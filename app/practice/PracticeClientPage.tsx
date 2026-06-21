"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_LEVEL,
  DEFAULT_TYPE,
  PRACTICE_TYPE_LABELS,
  createQuestionSet,
  formatTime,
  getAvailablePracticeTypes,
  getPracticeConfig,
  isLevelKey,
  isPracticeType,
  sanitizeTimeSec,
  type PracticeQuestion,
} from "../../lib/practice-config";

function parseAnswer(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildPracticeHref(
  level: string,
  type: string,
  timeSec?: number
): string {
  const params = new URLSearchParams({
    level,
    type,
  });

  if (timeSec) {
    params.set("time", String(timeSec));
  }

  return `/practice?${params.toString()}`;
}

function KeypadButton({
  label,
  onClick,
  disabled = false,
  className = "",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-2xl px-4 py-4 text-xl font-bold shadow-sm transition",
        disabled
          ? "cursor-not-allowed bg-slate-100 text-slate-400"
          : "bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-orange-50 hover:ring-orange-300",
        className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function PracticeClientPage() {
  const searchParams = useSearchParams();

    const levelParam = searchParams.get("level");
  const typeParam = searchParams.get("type");
  const timeParam = searchParams.get("time");

  const resolvedLevel =
    levelParam && isLevelKey(levelParam) ? levelParam : DEFAULT_LEVEL;

  const requestedType =
    typeParam && isPracticeType(typeParam) ? typeParam : DEFAULT_TYPE;

  const requestedTimeSec = sanitizeTimeSec(
    timeParam ? Number(timeParam) : undefined
  );


  const config = useMemo(
    () => getPracticeConfig(resolvedLevel, requestedType, requestedTimeSec),
    [resolvedLevel, requestedType, requestedTimeSec]
  );

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeSec);
  const [finished, setFinished] = useState(false);
  const [loadError, setLoadError] = useState("");
  const historySavedRef = useRef(false);

  const currentQuestion = questions[currentIndex] ?? null;
  const totalQuestions = questions.length;
  const availableTypes = useMemo(
    () => getAvailablePracticeTypes(config.level),
    [config.level]
  );

  const accuracy = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;

  const initializeSession = useCallback(() => {
    try {
      const generated = createQuestionSet(config);

      setQuestions(generated);
      setCurrentIndex(0);
      setInputValue("");
      setChecked(false);
      setIsCorrect(null);
      setScore(0);
      setAnsweredCount(0);
      setTimeLeft(config.timeSec);
      setFinished(false);
      setLoadError(generated.length === 0 ? "問題の生成に失敗しました。" : "");
      historySavedRef.current = false;
    } catch (error) {
      console.error(error);
      setQuestions([]);
      setCurrentIndex(0);
      setInputValue("");
      setChecked(false);
      setIsCorrect(null);
      setScore(0);
      setAnsweredCount(0);
      setTimeLeft(config.timeSec);
      setFinished(false);
      setLoadError("問題の生成に失敗しました。");
      historySavedRef.current = false;
    }
  }, [config]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  const isTimerRunning =
    !finished && !checked && !!currentQuestion && timeLeft > 0;

  useEffect(() => {
    if (!isTimerRunning) return;

    const timerId = window.setTimeout(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    if (finished) return;
    if (timeLeft > 0) return;

    setFinished(true);
    setChecked(false);
    setIsCorrect(null);
  }, [finished, timeLeft]);

  useEffect(() => {
    if (!finished || historySavedRef.current) return;

    historySavedRef.current = true;

    const record = {
      id: `${Date.now()}-${config.level}-${config.type}`,
      createdAt: new Date().toISOString(),
      level: config.level,
      levelLabel: config.levelLabel,
      type: config.type,
      typeLabel: config.typeLabel,
      score,
      answeredCount,
      totalQuestions,
      accuracy,
      timeSec: config.timeSec,
      remainingTimeSec: timeLeft,
      usedCustomTime: config.timeSec !==
        (config.type === "anzan"
          ? config.anzanTimeSec ?? config.standardTimeSec
          : config.standardTimeSec),
    };

    import("../../lib/history-storage")
      .then((mod: any) => {
        if (typeof mod?.saveHistory === "function") {
          try {
            mod.saveHistory(record);
          } catch (error) {
            console.error(error);
          }
        }
      })
      .catch(() => {
        // history-storage がなくても練習自体は継続
      });
  }, [
    finished,
    config.level,
    config.levelLabel,
    config.type,
    config.typeLabel,
    config.timeSec,
    config.standardTimeSec,
    config.anzanTimeSec,
    score,
    answeredCount,
    totalQuestions,
    accuracy,
    timeLeft,
  ]);

  const practiceHref = useMemo(
    () => buildPracticeHref(config.level, config.type, requestedTimeSec),
    [config.level, config.type, requestedTimeSec]
  );

  const submitAnswer = useCallback(() => {
    if (!currentQuestion || finished || checked) return;

    const parsed = parseAnswer(inputValue);
    if (parsed === null) return;

    const correct = parsed === currentQuestion.answer;

    setChecked(true);
    setIsCorrect(correct);
    setAnsweredCount((prev) => prev + 1);

    if (correct) {
      setScore((prev) => prev + 1);
    }
  }, [checked, currentQuestion, finished, inputValue]);

  const goNext = useCallback(() => {
    if (finished) return;

    const isLastQuestion = currentIndex >= totalQuestions - 1;

    if (isLastQuestion) {
      setFinished(true);
      setChecked(false);
      setIsCorrect(null);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setInputValue("");
    setChecked(false);
    setIsCorrect(null);
  }, [currentIndex, finished, totalQuestions]);

  const handlePrimaryAction = useCallback(() => {
    if (checked) {
      goNext();
      return;
    }

    submitAnswer();
  }, [checked, goNext, submitAnswer]);

  const appendDigit = useCallback(
    (digit: string) => {
      if (checked || finished) return;
      setInputValue((prev) => `${prev}${digit}`);
    },
    [checked, finished]
  );

  const backspace = useCallback(() => {
    if (checked || finished) return;
    setInputValue((prev) => prev.slice(0, -1));
  }, [checked, finished]);

  const clearInput = useCallback(() => {
    if (checked || finished) return;
    setInputValue("");
  }, [checked, finished]);

  const renderQuestionBody = useCallback(() => {
    if (!currentQuestion) {
      return (
        <div className="rounded-3xl bg-amber-50 px-6 py-8 text-center text-amber-900">
          問題を読み込めませんでした。
        </div>
      );
    }

    switch (currentQuestion.layout) {
      case "sum":
        return (
          <div className="mx-auto max-w-md rounded-3xl bg-slate-50 p-6 shadow-inner ring-1 ring-slate-200">
            <div className="mb-4 text-center text-sm font-semibold text-slate-500">
              {config.typeLabel}
            </div>
            <div className="space-y-2 font-mono text-right text-4xl font-bold tracking-widest text-slate-900 sm:text-5xl">
              {currentQuestion.lines.map((line, index) => (
                <div key={`${line}-${index}`}>{line}</div>
              ))}
            </div>
          </div>
        );

      case "multiply":
        return (
          <div className="mx-auto max-w-md rounded-3xl bg-slate-50 p-8 text-center shadow-inner ring-1 ring-slate-200">
            <div className="mb-4 text-sm font-semibold text-slate-500">
              かけ算
            </div>
            <div className="font-mono text-4xl font-bold tracking-wide text-slate-900 sm:text-5xl">
              {currentQuestion.left} × {currentQuestion.right}
            </div>
          </div>
        );

      case "divide":
        return (
          <div className="mx-auto max-w-md rounded-3xl bg-slate-50 p-8 text-center shadow-inner ring-1 ring-slate-200">
            <div className="mb-4 text-sm font-semibold text-slate-500">
              わり算
            </div>
            <div className="font-mono text-4xl font-bold tracking-wide text-slate-900 sm:text-5xl">
              {currentQuestion.dividend} ÷ {currentQuestion.divisor}
            </div>
          </div>
        );

      default:
        return (
          <div className="rounded-3xl bg-red-50 px-6 py-8 text-center text-red-900">
            未対応の問題形式です。
          </div>
        );
    }
  }, [config.typeLabel, currentQuestion]);

  if (finished) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-4 py-6 text-slate-800 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <p className="text-sm font-semibold text-orange-600">練習結果</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {config.levelLabel} / {config.typeLabel}
            </h1>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="text-sm text-slate-500">正解数</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {score}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="text-sm text-slate-500">解答数</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {answeredCount}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="text-sm text-slate-500">正答率</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {accuracy}%
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="text-sm text-slate-500">残り時間</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
              <div>出題数: {totalQuestions}問</div>
              <div>制限時間: {formatTime(config.timeSec)}</div>
              <div>
                公式準拠判定:{" "}
                {config.strictOfficialForType ? "この種目は基準どおり" : "近似実装あり"}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={initializeSession}
                className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-white transition hover:bg-orange-600"
              >
                同じ設定で再挑戦
              </button>

              <Link
                href="/settings"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                設定に戻る
              </Link>

              <Link
                href="/history"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                履歴を見る
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-4 py-6 text-slate-800 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-600">練習中</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {config.levelLabel} / {config.typeLabel}
              </h1>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                全珠連基準をベースにした練習設定です。
                回答を確定するとタイマーは止まり、次の問題に進むと再開します。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">問題</div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {Math.min(currentIndex + 1, Math.max(totalQuestions, 1))}/{Math.max(totalQuestions, 1)}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">正解</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{score}</div>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">解答</div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {answeredCount}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">残り時間</div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          </div>

          {config.adjustedTypeFromRequest && (
            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              この級・段では選べない種目だったため、
              「{config.typeLabel}」に切り替えて表示しています。
            </div>
          )}

          {config.type === "anzan" && !config.strictOfficialForType && (
            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              暗算は資料に級別細目がないため、現在のアプリでは見取り暗算形式の近似練習です。
            </div>
          )}

          {availableTypes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {availableTypes.map((type) => {
                const href = buildPracticeHref(config.level, type, requestedTimeSec);
                const active = type === config.type;

                return (
                  <Link
                    key={type}
                    href={href}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "bg-orange-500 text-white"
                        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-orange-50 hover:ring-orange-300",
                    ].join(" ")}
                  >
                    {PRACTICE_TYPE_LABELS[type]}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              {loadError ? (
                <div className="rounded-2xl bg-red-50 px-5 py-6 text-red-900">
                  {loadError}
                </div>
              ) : (
                <>
                  {renderQuestionBody()}

                  <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                    <label className="text-sm font-semibold text-slate-600">
                      回答
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={inputValue}
                      onChange={(e) => {
                        if (checked) return;
                        setInputValue(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handlePrimaryAction();
                        }
                      }}
                      disabled={checked}
                      placeholder="数字を入力"
                      className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-4 text-center text-3xl font-bold tracking-widest outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-100 disabled:text-slate-500"
                    />

                    {checked && currentQuestion && (
                      <div
                        className={[
                          "mt-4 rounded-2xl px-4 py-4 text-sm font-semibold",
                          isCorrect
                            ? "bg-emerald-50 text-emerald-900"
                            : "bg-rose-50 text-rose-900",
                        ].join(" ")}
                      >
                        {isCorrect ? "正解です。" : `不正解です。正しい答えは ${currentQuestion.answer} です。`}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handlePrimaryAction}
                      disabled={!checked && parseAnswer(inputValue) === null}
                      className={[
                        "inline-flex items-center justify-center rounded-2xl px-5 py-4 text-base font-bold transition",
                        !checked && parseAnswer(inputValue) === null
                          ? "cursor-not-allowed bg-slate-200 text-slate-500"
                          : "bg-orange-500 text-white hover:bg-orange-600",
                      ].join(" ")}
                    >
                      {checked
                        ? currentIndex >= totalQuestions - 1
                          ? "結果を見る"
                          : "次の問題へ"
                        : "答え合わせ"}
                    </button>

                    <button
                      type="button"
                      onClick={clearInput}
                      disabled={checked}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      入力クリア
                    </button>

                    <button
                      type="button"
                      onClick={initializeSession}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      最初からやり直す
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">テンキー</h2>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {["7", "8", "9", "4", "5", "6", "1", "2", "3"].map((digit) => (
                  <KeypadButton
                    key={digit}
                    label={digit}
                    onClick={() => appendDigit(digit)}
                    disabled={checked || finished}
                  />
                ))}

                <KeypadButton
                  label="C"
                  onClick={clearInput}
                  disabled={checked || finished}
                  className="bg-amber-50 text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
                />

                <KeypadButton
                  label="0"
                  onClick={() => appendDigit("0")}
                  disabled={checked || finished}
                />

                <KeypadButton
                  label="⌫"
                  onClick={backspace}
                  disabled={checked || finished}
                  className="bg-slate-50 text-slate-900"
                />
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                手書き入力欄は表示していません。数字入力かテンキーで回答してください。
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">現在の設定</h2>

              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-slate-500">級・段</dt>
                  <dd className="mt-1 text-slate-800">{config.levelLabel}</dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-500">種目</dt>
                  <dd className="mt-1 text-slate-800">{config.typeLabel}</dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-500">問題数</dt>
                  <dd className="mt-1 text-slate-800">{config.questionCount}問</dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-500">制限時間</dt>
                  <dd className="mt-1 text-slate-800">{formatTime(config.timeSec)}</dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-500">公式準拠</dt>
                  <dd className="mt-1 text-slate-800">
                    {config.strictOfficialForType ? "はい" : "一部近似あり"}
                  </dd>
                </div>
              </dl>

              <ul className="mt-5 space-y-2 text-sm leading-7 text-slate-700">
                {config.notes.map((note, index) => (
                  <li key={`${note}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                    {note}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/settings"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  設定に戻る
                </Link>

                <Link
                  href="/history"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  履歴を見る
                </Link>

                <Link
                  href={practiceHref}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  URLを再読み込み
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
