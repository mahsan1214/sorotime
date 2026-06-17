"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import HandwritingPad, { type HandwritingPadHandle } from "@/components/HandwritingPad";
import {
  DEFAULT_LEVEL,
  DEFAULT_TYPE,
  createQuestionSet,
  formatTime,
  getPracticeConfig,
  isLevelKey,
  isPracticeType,
  type LevelKey,
  type PracticeType,
  type Question,
} from "@/lib/practice-config";
import { saveHistory } from "@/lib/history-storage";

type InputMode = "handwriting" | "keypad";

function renderConditionText(config: ReturnType<typeof getPracticeConfig>) {
  if (config.mode === "sum") {
    return `${config.digits}けた ${config.linesCount}口`;
  }

  if (config.mode === "multiply") {
    return `${config.leftDigits}けた × ${config.rightDigits}けた`;
  }

  return `${config.divisorDigits}けたでわる / 商${config.quotientDigits}けた`;
}

export default function PracticePage() {
  const searchParams = useSearchParams();
  const savedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handwritingPadRef = useRef<HandwritingPadHandle | null>(null);

  const levelParam = searchParams.get("level");
  const typeParam = searchParams.get("type");

  const level: LevelKey = isLevelKey(levelParam) ? levelParam : DEFAULT_LEVEL;
  const type: PracticeType = isPracticeType(typeParam) ? typeParam : DEFAULT_TYPE;

  const config = getPracticeConfig(level, type);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [score, setScore] = useState(0);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.time);
  const [isFinished, setIsFinished] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("handwriting");

  useEffect(() => {
    setQuestions(createQuestionSet(config));
    setCurrentIndex(0);
    setInputValue("");
    setScore(0);
    setChecked(false);
    setIsCorrect(false);
    setTimeLeft(config.time);
    setIsFinished(false);
    savedRef.current = false;
    handwritingPadRef.current?.clear();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [level, type, config]);

  useEffect(() => {
    if (isFinished) return;
    if (timeLeft <= 0) {
      setIsFinished(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  useEffect(() => {
    if (!isFinished || savedRef.current) return;

    const percentage = Math.round((score / config.count) * 100);

    saveHistory({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      playedAt: new Date().toISOString(),
      levelKey: level,
      levelLabel: config.levelLabel,
      type,
      typeLabel: config.typeLabel,
      count: config.count,
      timeLimit: config.time,
      remainingTime: Math.max(timeLeft, 0),
      correctCount: score,
      percentage,
      conditionText: renderConditionText(config),
    });

    savedRef.current = true;
  }, [isFinished, score, config, timeLeft, level, type]);

  const currentQuestion = questions[currentIndex];

  const progressPercent = useMemo(() => {
    return ((currentIndex + 1) / config.count) * 100;
  }, [currentIndex, config.count]);

  const handleCheck = () => {
    if (!currentQuestion || checked || inputValue.trim() === "") return;

    const submittedAnswer = inputValue;
    const correct = Number(submittedAnswer) === currentQuestion.answer;

    setChecked(true);
    setIsCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    setInputValue("");
    handwritingPadRef.current?.clear();
  };

  const handleNext = () => {
    if (currentIndex >= config.count - 1) {
      setIsFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setInputValue("");
    setChecked(false);
    setIsCorrect(false);
    handwritingPadRef.current?.clear();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleRestart = () => {
    setQuestions(createQuestionSet(config));
    setCurrentIndex(0);
    setInputValue("");
    setScore(0);
    setChecked(false);
    setIsCorrect(false);
    setTimeLeft(config.time);
    setIsFinished(false);
    savedRef.current = false;
    handwritingPadRef.current?.clear();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const appendDigit = (digit: number) => {
    if (checked) return;
    setInputValue((prev) => `${prev}${digit}`);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const clearInput = () => {
    if (checked) return;
    setInputValue("");
    handwritingPadRef.current?.clear();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const backspaceInput = () => {
    if (checked) return;
    setInputValue((prev) => prev.slice(0, -1));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleEnterSubmit = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== "Enter") return;
    event.preventDefault();

    if (!checked && inputValue.trim() !== "") {
      handleCheck();
    }
  };

  if (!questions.length || !currentQuestion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50 px-6">
        <div className="rounded-3xl bg-white px-8 py-6 text-lg font-bold text-slate-700 shadow-sm">
          問題を準備しています…
        </div>
      </main>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / config.count) * 100);

    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-6 py-8 text-slate-800">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-orange-100">
            <div className="text-center">
              <p className="text-sm font-bold tracking-wide text-orange-500">
                練習結果
              </p>
              <h1 className="mt-3 text-4xl font-extrabold text-slate-900">
                おつかれさま！
              </h1>
              <p className="mt-3 text-lg text-slate-600">
                {config.levelLabel} {config.typeLabel} の練習が終わりました。
              </p>
              <p className="mt-1 text-sm text-slate-500">{renderConditionText(config)}</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-orange-50 p-5 text-center">
                <p className="text-sm text-slate-500">正解数</p>
                <p className="mt-2 text-4xl font-extrabold text-orange-600">
                  {score}
                </p>
              </div>

              <div className="rounded-3xl bg-sky-50 p-5 text-center">
                <p className="text-sm text-slate-500">正答率</p>
                <p className="mt-2 text-4xl font-extrabold text-sky-600">
                  {percentage}%
                </p>
              </div>

              <div className="rounded-3xl bg-emerald-50 p-5 text-center">
                <p className="text-sm text-slate-500">残り時間</p>
                <p className="mt-2 text-4xl font-extrabold text-emerald-600">
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={handleRestart}
                className="rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600"
              >
                もう一回やる
              </button>

              <Link
                href="/history"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-lg font-bold text-slate-700 transition hover:bg-slate-50"
              >
                練習記録を見る
              </Link>

              <Link
                href="/settings"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-lg font-bold text-slate-700 transition hover:bg-slate-50"
              >
                設定にもどる
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const conditionText = renderConditionText(config);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-4 py-4 text-slate-800 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-3xl bg-white px-4 py-4 shadow-sm ring-1 ring-orange-100 sm:px-6">
          <Link
            href="/settings"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            ← 設定にもどる
          </Link>

          <div className="text-center">
            <p className="text-sm text-slate-500">{config.levelLabel}</p>
            <h1 className="text-xl font-extrabold sm:text-2xl">
              {config.typeLabel}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{conditionText}</p>
          </div>

          <div className="rounded-2xl bg-red-50 px-4 py-2 text-center ring-1 ring-red-100">
            <p className="text-xs text-red-500">のこり時間</p>
            <p className="text-2xl font-extrabold text-red-600 sm:text-3xl">
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-full bg-orange-100">
          <div
            className="h-4 rounded-full bg-orange-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mb-4 flex items-center justify-between px-1 text-sm font-bold text-slate-600 sm:text-base">
          <p>
            第{currentIndex + 1}問 / {config.count}問
          </p>
          <p>正解 {score}問</p>
        </div>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-orange-100 sm:p-8">
            <h2 className="text-center text-lg font-bold text-slate-500">問題</h2>

            <div className="mt-6 flex justify-center">
              <div className="rounded-3xl bg-amber-50 px-8 py-6">
                {currentQuestion.layout === "sum" && (
                  <div className="space-y-3 text-right font-mono text-4xl font-bold tracking-wider text-slate-900 sm:text-5xl">
                    {currentQuestion.lines.map((line, index) => (
                      <div key={index}>{index === 0 ? line : `+ ${line}`}</div>
                    ))}
                    <div className="border-t-4 border-slate-400 pt-3">?</div>
                  </div>
                )}

                {currentQuestion.layout === "multiply" && (
                  <div className="space-y-3 text-right font-mono text-4xl font-bold tracking-wider text-slate-900 sm:text-5xl">
                    <div>{currentQuestion.lines[0]}</div>
                    <div>× {currentQuestion.lines[1]}</div>
                    <div className="border-t-4 border-slate-400 pt-3">?</div>
                  </div>
                )}

                {currentQuestion.layout === "divide" && (
                  <div className="space-y-4 text-center font-mono text-4xl font-bold tracking-wider text-slate-900 sm:text-5xl">
                    <div>
                      {currentQuestion.lines[0]} ÷ {currentQuestion.lines[1]}
                    </div>
                    <div className="border-t-4 border-slate-400 pt-3">?</div>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500 sm:text-base">
              よく見て、あわてずに計算しよう。
            </p>
          </div>

          <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-orange-100 sm:p-8">
            <div className="mb-4 flex gap-3">
              <button
                onClick={() => {
                  setInputMode("handwriting");
                  handwritingPadRef.current?.clear();
                  setTimeout(() => {
                    inputRef.current?.focus();
                  }, 0);
                }}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  inputMode === "handwriting"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                手書き入力
              </button>

              <button
                onClick={() => {
                  setInputMode("keypad");
                  handwritingPadRef.current?.clear();
                  setTimeout(() => {
                    inputRef.current?.focus();
                  }, 0);
                }}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  inputMode === "keypad"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                数字ボタン入力
              </button>
            </div>

            <label htmlFor="answer" className="text-lg font-bold text-slate-700">
              答え
            </label>

            <input
              ref={inputRef}
              id="answer"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={(e) => {
                if (checked) return;
                const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
                setInputValue(onlyNumbers);
              }}
              onKeyDown={handleEnterSubmit}
              disabled={checked}
              placeholder="ここに数字を入れる"
              className="mt-4 w-full rounded-3xl border-2 border-orange-200 bg-orange-50 px-6 py-6 text-center text-3xl font-bold tracking-widest text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white sm:text-4xl"
            />

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {inputMode === "handwriting"
                ? "下の白いエリアに数字を大きく書いて、「読み取る」を押してください。読み取り後に Enter キーでも答え合わせできます。"
                : "数字ボタンや手入力のあと、Enter キーでも答え合わせできます。"}
            </p>

            <div className="mt-5">
              {inputMode === "handwriting" ? (
                <HandwritingPad
                  ref={handwritingPadRef}
                  disabled={checked}
                  onRecognized={(value) => {
                    if (checked) return;
                    setInputValue(value);
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 0);
                  }}
                />
              ) : (
                <div className="rounded-3xl border-2 border-orange-200 bg-orange-50 p-4">
                  <div className="grid grid-cols-3 gap-3 text-lg font-bold">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => appendDigit(num)}
                        className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={clearInput}
                      className="rounded-2xl bg-slate-200 px-4 py-4 transition hover:bg-slate-300"
                    >
                      けす
                    </button>
                    <button
                      onClick={() => appendDigit(0)}
                      className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                      0
                    </button>
                    <button
                      onClick={backspaceInput}
                      className="rounded-2xl bg-slate-200 px-4 py-4 transition hover:bg-slate-300"
                    >
                      1字もどす
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!checked ? (
              <button
                onClick={handleCheck}
                disabled={inputValue.trim() === ""}
                className="mt-5 w-full rounded-2xl bg-orange-500 px-6 py-4 text-xl font-extrabold text-white transition hover:bg-orange-600 disabled:bg-orange-300"
              >
                こたえあわせ
              </button>
            ) : (
              <div
                className={`mt-5 rounded-3xl px-5 py-5 text-center ring-1 ${
                  isCorrect
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-rose-50 text-rose-700 ring-rose-200"
                }`}
              >
                <p className="text-3xl font-extrabold">
                  {isCorrect ? "せいかい！" : "おしい！"}
                </p>
                <p className="mt-2 text-lg font-bold">
                  正しい答え: {currentQuestion.answer}
                </p>

                <button
                  onClick={handleNext}
                  className="mt-4 rounded-2xl bg-slate-800 px-6 py-3 text-lg font-bold text-white transition hover:bg-slate-700"
                >
                  {currentIndex === config.count - 1 ? "結果を見る" : "次の問題へ"}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
