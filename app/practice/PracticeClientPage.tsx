"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import HandwritingPad from "../../components/HandwritingPad";
import {
  DEFAULT_LEVEL,
  DEFAULT_TYPE,
  createQuestionSet,
  formatTime,
  getPracticeConfig,
  isLevelKey,
  isPracticeType,
} from "../../lib/practice-config";
import { saveHistory } from "../../lib/history-storage";

type InputMode = "handwriting" | "keypad";
type RawQuestion = Record<string, any>;

type QuestionViewModel =
  | { kind: "sum"; numbers: number[]; answer?: number }
  | { kind: "multiply"; left: number; right: number; answer?: number }
  | { kind: "divide"; dividend: number; divisor: number; answer?: number }
  | { kind: "text"; text: string; answer?: number }
  | { kind: "unknown"; raw: RawQuestion; answer?: number };

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  return null;
}

function getNumberArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;

  const arr = value
    .map((item) => toNumber(item))
    .filter((item): item is number => item !== null);

  return arr.length > 0 ? arr : null;
}

function getFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return null;
}

function getQuestionViewModel(
  raw: unknown,
  practiceType: string
): QuestionViewModel | null {
  if (!raw || typeof raw !== "object") return null;

  const q = raw as RawQuestion;

  const directText = getFirstString(
    q.displayText,
    q.questionText,
    q.text,
    q.question,
    q.expression,
    q.formula,
    q.label,
    q.prompt
  );

  if (directText) {
    return {
      kind: "text",
      text: directText,
      answer: toNumber(q.answer) ?? undefined,
    };
  }

  const numberArray =
    getNumberArray(q.numbers) ??
    getNumberArray(q.values) ??
    getNumberArray(q.items) ??
    getNumberArray(q.addends) ??
    getNumberArray(q.terms) ??
    getNumberArray(q.list);

  if (
    (practiceType === "mitorizan" || practiceType === "anzan") &&
    numberArray &&
    numberArray.length >= 2
  ) {
    return {
      kind: "sum",
      numbers: numberArray,
      answer: toNumber(q.answer) ?? undefined,
    };
  }

  const left =
    toNumber(q.left) ??
    toNumber(q.a) ??
    toNumber(q.multiplicand) ??
    toNumber(q.first);

  const right =
    toNumber(q.right) ??
    toNumber(q.b) ??
    toNumber(q.multiplier) ??
    toNumber(q.second);

  if (practiceType === "kakezan" && left !== null && right !== null) {
    return {
      kind: "multiply",
      left,
      right,
      answer: toNumber(q.answer) ?? undefined,
    };
  }

  const dividend =
    toNumber(q.dividend) ??
    toNumber(q.left) ??
    toNumber(q.value1) ??
    toNumber(q.first);

  const divisor =
    toNumber(q.divisor) ??
    toNumber(q.right) ??
    toNumber(q.value2) ??
    toNumber(q.second);

  if (practiceType === "warizan" && dividend !== null && divisor !== null) {
    return {
      kind: "divide",
      dividend,
      divisor,
      answer: toNumber(q.answer) ?? undefined,
    };
  }

  if (numberArray && numberArray.length >= 2) {
    return {
      kind: "sum",
      numbers: numberArray,
      answer: toNumber(q.answer) ?? undefined,
    };
  }

  return {
    kind: "unknown",
    raw: q,
    answer: toNumber(q.answer) ?? undefined,
  };
}

export default function PracticeClientPage() {
  const searchParams = useSearchParams();

  const levelParam = searchParams.get("level");
  const typeParam = searchParams.get("type");

  const level = isLevelKey(levelParam) ? levelParam : DEFAULT_LEVEL;
  const type = isPracticeType(typeParam) ? typeParam : DEFAULT_TYPE;

  const config = useMemo(() => getPracticeConfig(level, type) as any, [level, type]);

  const [questions, setQuestions] = useState<RawQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [score, setScore] = useState(0);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(config.time);
  const [isFinished, setIsFinished] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("handwriting");
  const [loadError, setLoadError] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const handwritingPadRef = useRef<any>(null);
  const savedRef = useRef(false);

  const currentQuestion = questions[currentIndex] ?? null;
  const currentView = useMemo(
    () => getQuestionViewModel(currentQuestion, config.type),
    [currentQuestion, config.type]
  );

  const conditionText = useMemo(() => {
    if (!config) return "";

    if (config.type === "mitorizan" || config.type === "anzan") {
      return `${config.digits ?? 0}けた ${config.linesCount ?? 0}口 / ${config.count}問 / ${config.time}秒`;
    }

    if (config.type === "kakezan") {
      return `${config.leftDigits ?? 0}けた × ${config.rightDigits ?? 0}けた / ${config.count}問 / ${config.time}秒`;
    }

    if (config.type === "warizan") {
      return `${config.divisorDigits ?? 0}けたでわる / 商 ${config.quotientDigits ?? 0}けた / ${config.count}問 / ${config.time}秒`;
    }

    return `${config.count}問 / ${config.time}秒`;
  }, [config]);

  useEffect(() => {
    try {
      const rawQuestions = createQuestionSet(config) as unknown;
      const safeQuestions = Array.isArray(rawQuestions)
        ? (rawQuestions as RawQuestion[])
        : [];

      setQuestions(safeQuestions);
      setCurrentIndex(0);
      setInputValue("");
      setScore(0);
      setChecked(false);
      setIsCorrect(false);
      setTimeLeft(config.time);
      setIsFinished(false);
      setInputMode("handwriting");
      savedRef.current = false;

      if (safeQuestions.length === 0) {
        setLoadError("問題が0件でした");
      } else {
        setLoadError("");
      }

      setTimeout(() => {
        handwritingPadRef.current?.clear?.();
        inputRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error(error);
      setQuestions([]);
      setCurrentIndex(0);
      setInputValue("");
      setScore(0);
      setChecked(false);
      setIsCorrect(false);
      setTimeLeft(config.time);
      setIsFinished(false);
      setInputMode("handwriting");
      setLoadError("問題の読み込みに失敗しました");
      savedRef.current = false;
    }
  }, [config]);

  useEffect(() => {
    if (isFinished) return;
    if (questions.length === 0) return;

    if (timeLeft <= 0) {
      setIsFinished(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [timeLeft, isFinished, questions.length]);

  useEffect(() => {
    if (!isFinished || savedRef.current || questions.length === 0) return;

    savedRef.current = true;

    const totalCount = questions.length || config.count;
    const percentage =
      totalCount > 0 ? Math.round((score / totalCount) * 100) : 0;

    saveHistory({
      id: `${Date.now()}`,
      playedAt: new Date().toISOString(),
      levelKey: config.levelKey,
      levelLabel: config.levelLabel,
      type: config.type,
      typeLabel: config.typeLabel,
      count: totalCount,
      timeLimit: config.time,
      remainingTime: timeLeft,
      correctCount: score,
      percentage,
      conditionText,
    });
  }, [isFinished, score, config, timeLeft, conditionText, questions.length]);

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const clearInput = () => {
    setInputValue("");
    handwritingPadRef.current?.clear?.();
    focusInput();
  };

  const appendDigit = (digit: string) => {
    if (checked || isFinished || !currentView || currentView.kind === "unknown") return;
    setInputValue((prev) => `${prev}${digit}`);
    focusInput();
  };

  const backspaceInput = () => {
    if (checked || isFinished || !currentView || currentView.kind === "unknown") return;
    setInputValue((prev) => prev.slice(0, -1));
    focusInput();
  };

  const handleCheck = () => {
    if (!currentQuestion || !currentView || checked || inputValue.trim() === "") return;
    if (currentView.kind === "unknown") {
      setLoadError("この問題形式では答えあわせできません");
      return;
    }

    const expectedAnswer = currentView.answer;
    if (typeof expectedAnswer === "undefined") {
      setLoadError("答えデータが見つかりません");
      return;
    }

    const submittedAnswer = inputValue.trim();
    const correct = Number(submittedAnswer) === Number(expectedAnswer);

    setChecked(true);
    setIsCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    setInputValue("");
    handwritingPadRef.current?.clear?.();
    focusInput();
  };

  const handleNext = () => {
    if (!currentView) return;

    if (currentIndex >= questions.length - 1) {
      setIsFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setInputValue("");
    setChecked(false);
    setIsCorrect(false);
    handwritingPadRef.current?.clear?.();
    focusInput();
  };

  const handleRestart = () => {
    try {
      const rawQuestions = createQuestionSet(config) as unknown;
      const safeQuestions = Array.isArray(rawQuestions)
        ? (rawQuestions as RawQuestion[])
        : [];

      setQuestions(safeQuestions);
      setCurrentIndex(0);
      setInputValue("");
      setScore(0);
      setChecked(false);
      setIsCorrect(false);
      setTimeLeft(config.time);
      setIsFinished(false);
      setInputMode("handwriting");
      setLoadError(safeQuestions.length === 0 ? "問題が0件でした" : "");
      savedRef.current = false;
      handwritingPadRef.current?.clear?.();
      focusInput();
    } catch (error) {
      console.error(error);
      setQuestions([]);
      setLoadError("問題の読み込みに失敗しました");
    }
  };

  const handleRecognized = (text: string) => {
    const cleaned = (text || "").replace(/[^0-9]/g, "");
    setInputValue(cleaned);
    focusInput();
  };

  const handleEnterSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCheck();
    }
  };

  const switchInputMode = (mode: InputMode) => {
    setInputMode(mode);
    setInputValue("");
    handwritingPadRef.current?.clear?.();
    focusInput();
  };

  const renderQuestionBody = () => {
    if (loadError) {
      return (
        <div className="mx-auto w-full max-w-md rounded-3xl bg-rose-50 p-6 text-center ring-1 ring-rose-100">
          <div className="text-lg font-bold text-rose-700">{loadError}</div>
        </div>
      );
    }

    if (!currentQuestion) {
      return (
        <div className="mx-auto w-full max-w-md rounded-3xl bg-amber-50 p-6 text-center ring-1 ring-amber-100">
          <div className="text-lg font-bold text-amber-700">問題を準備中です</div>
        </div>
      );
    }

    if (!currentView) {
      return (
        <div className="mx-auto w-full max-w-md rounded-3xl bg-amber-50 p-6 text-center ring-1 ring-amber-100">
          <div className="text-lg font-bold text-amber-700">問題データを確認中です</div>
        </div>
      );
    }

    if (currentView.kind === "sum") {
      return (
        <div className="mx-auto w-full max-w-sm rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <div className="mb-3 text-center text-sm font-bold text-slate-500">
            {config.typeLabel}
          </div>
          <div className="space-y-2 text-right font-mono text-4xl font-bold tracking-wide text-slate-900">
            {currentView.numbers.map((num, index) => (
              <div key={`${num}-${index}`}>
                {index === 0 ? "" : "+"}
                {num}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (currentView.kind === "multiply") {
      return (
        <div className="mx-auto w-full max-w-sm rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <div className="mb-3 text-center text-sm font-bold text-slate-500">
            {config.typeLabel}
          </div>
          <div className="space-y-2 text-right font-mono text-4xl font-bold tracking-wide text-slate-900">
            <div>{currentView.left}</div>
            <div>× {currentView.right}</div>
            <div className="border-t-4 border-slate-300 pt-3">？</div>
          </div>
        </div>
      );
    }

    if (currentView.kind === "divide") {
      return (
        <div className="mx-auto w-full max-w-sm rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <div className="mb-3 text-center text-sm font-bold text-slate-500">
            {config.typeLabel}
          </div>
          <div className="text-center font-mono text-4xl font-bold tracking-wide text-slate-900">
            {currentView.dividend} ÷ {currentView.divisor}
          </div>
          <div className="mt-4 text-center text-lg font-bold text-slate-500">
            答えを書こう
          </div>
        </div>
      );
    }

    if (currentView.kind === "text") {
      return (
        <div className="mx-auto w-full max-w-sm rounded-3xl bg-slate-50 p-6 text-center ring-1 ring-slate-200">
          <div className="mb-3 text-sm font-bold text-slate-500">{config.typeLabel}</div>
          <div className="font-mono text-4xl font-bold tracking-wide text-slate-900 whitespace-pre-line">
            {currentView.text}
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-md rounded-3xl bg-amber-50 p-6 text-center ring-1 ring-amber-100">
        <div className="mb-2 text-sm font-bold text-amber-700">{config.typeLabel}</div>
        <div className="text-lg font-bold text-amber-800">
          この問題形式は未対応です
        </div>
        <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-left text-xs text-slate-600 ring-1 ring-slate-200">
{JSON.stringify(currentQuestion, null, 2)}
        </pre>
      </div>
    );
  };

  if (isFinished) {
    const totalCount = questions.length || config.count;
    const percentage =
      totalCount > 0 ? Math.round((score / totalCount) * 100) : 0;

    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-4 py-6 text-slate-800 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-4xl">
                🎉
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                練習おわり
              </h1>
              <p className="mt-3 text-base text-slate-600 sm:text-lg">
                {config.levelLabel} / {config.typeLabel}
              </p>
              <p className="mt-1 text-sm text-slate-500">{conditionText}</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-orange-50 p-5 text-center ring-1 ring-orange-100">
                <div className="text-sm font-bold text-orange-700">正解</div>
                <div className="mt-2 text-3xl font-extrabold text-orange-600">
                  {score} / {totalCount}
                </div>
              </div>

              <div className="rounded-3xl bg-emerald-50 p-5 text-center ring-1 ring-emerald-100">
                <div className="text-sm font-bold text-emerald-700">正答率</div>
                <div className="mt-2 text-3xl font-extrabold text-emerald-600">
                  {percentage}%
                </div>
              </div>

              <div className="rounded-3xl bg-sky-50 p-5 text-center ring-1 ring-sky-100">
                <div className="text-sm font-bold text-sky-700">残り時間</div>
                <div className="mt-2 text-3xl font-extrabold text-sky-600">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <button
                onClick={handleRestart}
                className="rounded-2xl bg-orange-500 px-5 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-orange-600"
              >
                もう一回やる
              </button>

              <Link
                href="/history"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-lg font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                練習記録を見る
              </Link>

              <Link
                href="/settings"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-lg font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                設定にもどる
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-4 py-6 text-slate-800 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/settings"
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← 設定にもどる
          </Link>

          <div className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
            のこり時間:{" "}
            <span className="text-lg text-orange-600">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-4xl">
              {config.levelLabel} / {config.typeLabel}
            </h1>
            <p className="mt-2 text-sm font-bold text-slate-500 sm:text-base">
              {conditionText}
            </p>
            <p className="mt-4 text-base font-bold text-slate-700 sm:text-lg">
              第{Math.min(currentIndex + 1, Math.max(questions.length, 1))}問 / 全{questions.length || config.count}問
            </p>
          </div>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-orange-400 transition-all"
              style={{
                width: `${
                  questions.length > 0
                    ? ((currentIndex + 1) / questions.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          <div className="mt-8">{renderQuestionBody()}</div>

          <div className="mt-8 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-6">
            <div className="mb-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => switchInputMode("handwriting")}
                className={`rounded-2xl px-4 py-3 text-sm font-bold transition sm:text-base ${
                  inputMode === "handwriting"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                手書き入力
              </button>

              <button
                type="button"
                onClick={() => switchInputMode("keypad")}
                className={`rounded-2xl px-4 py-3 text-sm font-bold transition sm:text-base ${
                  inputMode === "keypad"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                数字ボタン入力
              </button>
            </div>

            <div className="mx-auto max-w-md">
              <label
                htmlFor="answer"
                className="mb-2 block text-center text-sm font-bold text-slate-600"
              >
                答え
              </label>

              <input
                ref={inputRef}
                id="answer"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputValue}
                onChange={(e) =>
                  setInputValue(e.target.value.replace(/[^0-9]/g, ""))
                }
                onKeyDown={handleEnterSubmit}
                className="w-full rounded-2xl border-2 border-orange-200 bg-white px-5 py-4 text-center text-3xl font-bold tracking-widest text-slate-900 outline-none transition focus:border-orange-400"
                placeholder="ここに答え"
                disabled={!currentView || currentView.kind === "unknown"}
              />
            </div>

            {inputMode === "handwriting" ? (
              <div className="mt-6">
                <HandwritingPad
                  ref={handwritingPadRef}
                  onRecognized={handleRecognized}
                />
              </div>
            ) : (
              <div className="mx-auto mt-6 max-w-md">
                <div className="grid grid-cols-3 gap-3">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => appendDigit(digit)}
                      className="rounded-2xl bg-white px-4 py-4 text-2xl font-extrabold text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                      {digit}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={clearInput}
                    className="rounded-2xl bg-rose-50 px-4 py-4 text-lg font-bold text-rose-600 ring-1 ring-rose-100 transition hover:bg-rose-100"
                  >
                    けす
                  </button>

                  <button
                    type="button"
                    onClick={() => appendDigit("0")}
                    className="rounded-2xl bg-white px-4 py-4 text-2xl font-extrabold text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={backspaceInput}
                    className="rounded-2xl bg-sky-50 px-4 py-4 text-lg font-bold text-sky-600 ring-1 ring-sky-100 transition hover:bg-sky-100"
                  >
                    1字けす
                  </button>
                </div>
              </div>
            )}

            <div className="mx-auto mt-6 max-w-md">
              {!checked ? (
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={!currentView || currentView.kind === "unknown"}
                  className="w-full rounded-2xl bg-emerald-500 px-5 py-4 text-xl font-extrabold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  答えあわせ
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full rounded-2xl bg-orange-500 px-5 py-4 text-xl font-extrabold text-white shadow-sm transition hover:bg-orange-600"
                >
                  {currentIndex >= questions.length - 1 ? "結果を見る" : "次の問題へ"}
                </button>
              )}
            </div>

            {checked && currentView && currentView.kind !== "unknown" && (
              <div
                className={`mx-auto mt-6 max-w-md rounded-3xl p-5 text-center ring-1 ${
                  isCorrect
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                    : "bg-rose-50 text-rose-700 ring-rose-100"
                }`}
              >
                <div className="text-2xl font-extrabold">
                  {isCorrect ? "せいかい！" : "おしい！"}
                </div>
                <div className="mt-2 text-lg font-bold">
                  正しい答え: {currentView.answer}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-orange-50 p-4 text-center ring-1 ring-orange-100">
              <div className="text-sm font-bold text-orange-700">今の正解数</div>
              <div className="mt-1 text-2xl font-extrabold text-orange-600">
                {score}
              </div>
            </div>

            <div className="rounded-2xl bg-sky-50 p-4 text-center ring-1 ring-sky-100">
              <div className="text-sm font-bold text-sky-700">今の問題</div>
              <div className="mt-1 text-2xl font-extrabold text-sky-600">
                {Math.min(currentIndex + 1, Math.max(questions.length, 1))}
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100">
              <div className="text-sm font-bold text-emerald-700">残り時間</div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-600">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
