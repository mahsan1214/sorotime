"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LEVEL,
  DEFAULT_TYPE,
  EXAM_STANDARDS,
  PRACTICE_TYPE_LABELS,
  formatTime,
  getAvailablePracticeTypes,
  isLevelKey,
  isPracticeType,
  type LevelBand,
  type LevelKey,
  type PracticeType,
  type SubjectKey,
} from "../../lib/practice-config";

type HistoryRecord = {
  id: string;
  createdAt: string;
  level: LevelKey;
  levelLabel: string;
  type: PracticeType;
  typeLabel: string;
  score: number;
  answeredCount: number;
  totalQuestions: number;
  accuracy: number;
  timeSec: number;
  remainingTimeSec: number;
  usedCustomTime: boolean;
};

type HistoryStorageModuleLike = {
  getHistory?: () => unknown[] | Promise<unknown[]>;
  loadHistory?: () => unknown[] | Promise<unknown[]>;
  readHistory?: () => unknown[] | Promise<unknown[]>;
  clearHistory?: () => void | Promise<void>;
  removeAllHistory?: () => void | Promise<void>;
  deleteHistory?: (id: string) => void | Promise<void>;
  removeHistory?: (id: string) => void | Promise<void>;
  replaceHistory?: (records: unknown[]) => void | Promise<void>;
  setHistory?: (records: unknown[]) => void | Promise<void>;
  overwriteHistory?: (records: unknown[]) => void | Promise<void>;
  HISTORY_STORAGE_KEY?: string;
  STORAGE_KEY?: string;
};

const STORAGE_KEY_CANDIDATES = [
  "sorotime-history",
  "sorotimeHistory",
  "practice-history",
  "practiceHistory",
  "history",
];

const SUBJECT_LABELS: Record<SubjectKey, string> = {
  kakezan: "かけ算",
  warizan: "わり算",
  mitorizan: "見取り算",
  anzan: "暗算",
  denpyozan: "伝票算",
  oyoKeisan: "応用計算",
  kaiho: "開法",
};

function getBandLabel(band: LevelBand): string {
  switch (band) {
    case "shokyu":
      return "初級";
    case "chukyu":
      return "中級";
    case "jokyu":
      return "上級";
    case "dan":
      return "段位";
    default:
      return "";
  }
}

function formatSubjectList(subjects: SubjectKey[]): string {
  if (subjects.length === 0) return "なし";
  return subjects.map((subject) => SUBJECT_LABELS[subject]).join("・");
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildPracticeHref(
  level: LevelKey,
  type: PracticeType,
  timeSec?: number
): string {
  const params = new URLSearchParams({
    level,
    type,
  });

  if (timeSec && Number.isFinite(timeSec)) {
    params.set("time", String(timeSec));
  }

  return `/practice?${params.toString()}`;
}

function toSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeHistoryRecord(raw: unknown): HistoryRecord | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;

  const levelValue = typeof item.level === "string" ? item.level : DEFAULT_LEVEL;
  const typeValue = typeof item.type === "string" ? item.type : DEFAULT_TYPE;

  if (!isLevelKey(levelValue) || !isPracticeType(typeValue)) {
    return null;
  }

  const official = EXAM_STANDARDS[levelValue];
  const createdAt =
    typeof item.createdAt === "string" && item.createdAt.trim() !== ""
      ? item.createdAt
      : new Date().toISOString();

  const score = toSafeNumber(item.score, 0);
  const answeredCount = toSafeNumber(item.answeredCount, 0);
  const totalQuestions = toSafeNumber(item.totalQuestions, 0);
  const timeSec = toSafeNumber(item.timeSec, official.standardTimeSec);
  const remainingTimeSec = toSafeNumber(item.remainingTimeSec, 0);

  let accuracy = toSafeNumber(item.accuracy, 0);
  if ((!Number.isFinite(accuracy) || accuracy <= 0) && answeredCount > 0) {
    accuracy = Math.round((score / answeredCount) * 100);
  }

  const id =
    typeof item.id === "string" && item.id.trim() !== ""
      ? item.id
      : `${createdAt}-${levelValue}-${typeValue}`;

  const levelLabel =
    typeof item.levelLabel === "string" && item.levelLabel.trim() !== ""
      ? item.levelLabel
      : official.label;

  const typeLabel =
    typeof item.typeLabel === "string" && item.typeLabel.trim() !== ""
      ? item.typeLabel
      : PRACTICE_TYPE_LABELS[typeValue];

  const usedCustomTime =
    typeof item.usedCustomTime === "boolean"
      ? item.usedCustomTime
      : timeSec !==
        (typeValue === "anzan"
          ? official.anzanTimeSec ?? official.standardTimeSec
          : official.standardTimeSec);

  return {
    id,
    createdAt,
    level: levelValue,
    levelLabel,
    type: typeValue,
    typeLabel,
    score,
    answeredCount,
    totalQuestions,
    accuracy,
    timeSec,
    remainingTimeSec,
    usedCustomTime,
  };
}

function normalizeHistoryArray(value: unknown): HistoryRecord[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => normalizeHistoryRecord(item))
    .filter((item): item is HistoryRecord => item !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

function getLikelyStorageKeyFromLocalStorage(): string | null {
  if (typeof window === "undefined") return null;

  for (const key of STORAGE_KEY_CANDIDATES) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return key;
      }
    } catch {
      // ignore invalid json
    }
  }

  return null;
}

async function importHistoryModule(): Promise<HistoryStorageModuleLike | null> {
  try {
    const mod = (await import("../../lib/history-storage")) as HistoryStorageModuleLike;
    return mod;
  } catch {
    return null;
  }
}

async function readHistoryFromAnySource(): Promise<HistoryRecord[]> {
  const mod = await importHistoryModule();

  const getter =
    mod?.getHistory ?? mod?.loadHistory ?? mod?.readHistory;

  if (typeof getter === "function") {
    try {
      const result = await Promise.resolve(getter());
      const normalized = normalizeHistoryArray(result);
      if (normalized.length > 0) return normalized;
    } catch {
      // fallback below
    }
  }

  if (typeof window !== "undefined") {
    const storageKey =
      mod?.HISTORY_STORAGE_KEY ??
      mod?.STORAGE_KEY ??
      getLikelyStorageKeyFromLocalStorage() ??
      STORAGE_KEY_CANDIDATES[0];

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];

    try {
      return normalizeHistoryArray(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  return [];
}

async function replaceHistoryEverywhere(records: HistoryRecord[]): Promise<void> {
  const mod = await importHistoryModule();

  if (typeof mod?.replaceHistory === "function") {
    await Promise.resolve(mod.replaceHistory(records));
    return;
  }

  if (typeof mod?.setHistory === "function") {
    await Promise.resolve(mod.setHistory(records));
    return;
  }

  if (typeof mod?.overwriteHistory === "function") {
    await Promise.resolve(mod.overwriteHistory(records));
    return;
  }

  if (typeof window !== "undefined") {
    const storageKey =
      mod?.HISTORY_STORAGE_KEY ??
      mod?.STORAGE_KEY ??
      getLikelyStorageKeyFromLocalStorage() ??
      STORAGE_KEY_CANDIDATES[0];

    window.localStorage.setItem(storageKey, JSON.stringify(records));
  }
}

async function clearHistoryEverywhere(): Promise<void> {
  const mod = await importHistoryModule();

  if (typeof mod?.clearHistory === "function") {
    await Promise.resolve(mod.clearHistory());
    return;
  }

  if (typeof mod?.removeAllHistory === "function") {
    await Promise.resolve(mod.removeAllHistory());
    return;
  }

  if (typeof window !== "undefined") {
    const storageKey =
      mod?.HISTORY_STORAGE_KEY ??
      mod?.STORAGE_KEY ??
      getLikelyStorageKeyFromLocalStorage();

    if (storageKey) {
      window.localStorage.removeItem(storageKey);
    }
  }
}

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const loaded = await readHistoryFromAnySource();
      setRecords(loaded);
    } catch (error) {
      console.error(error);
      setErrorMessage("履歴の読み込みに失敗しました。");
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDeleteOne = useCallback(async (id: string) => {
    try {
      const next = records.filter((record) => record.id !== id);
      await replaceHistoryEverywhere(next);
      setRecords(next);
    } catch (error) {
      console.error(error);
      setErrorMessage("履歴の削除に失敗しました。");
    }
  }, [records]);

  const handleClearAll = useCallback(async () => {
    setIsClearing(true);
    setErrorMessage("");

    try {
      await clearHistoryEverywhere();
      setRecords([]);
    } catch (error) {
      console.error(error);
      setErrorMessage("履歴の全削除に失敗しました。");
    } finally {
      setIsClearing(false);
    }
  }, []);

  const summary = useMemo(() => {
    const totalSessions = records.length;
    const totalCorrect = records.reduce((sum, item) => sum + item.score, 0);
    const totalAnswered = records.reduce(
      (sum, item) => sum + item.answeredCount,
      0
    );
    const averageAccuracy =
      totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    return {
      totalSessions,
      totalCorrect,
      totalAnswered,
      averageAccuracy,
    };
  }, [records]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-4 py-6 text-slate-800 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-semibold text-orange-600">Sorotime 履歴</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            全珠連基準の練習履歴
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            級・段、種目、公式時間、カスタム時間の有無、公式準拠か近似実装かを確認できます。
            段位は共通問題・点数認定方式であることも履歴上に表示しています。
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-sm text-slate-500">練習回数</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">
                {summary.totalSessions}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-sm text-slate-500">総正解数</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">
                {summary.totalCorrect}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-sm text-slate-500">総解答数</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">
                {summary.totalAnswered}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-sm text-slate-500">通算正答率</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">
                {summary.averageAccuracy}%
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-white transition hover:bg-orange-600"
            >
              設定へ戻る
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ホームへ戻る
            </Link>

            <button
              type="button"
              onClick={loadHistory}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              再読み込み
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={isClearing || records.length === 0}
              className="inline-flex items-center justify-center rounded-2xl border border-rose-200 px-5 py-4 text-base font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            >
              {isClearing ? "削除中..." : "履歴をすべて削除"}
            </button>
          </div>
        </section>

        {errorMessage && (
          <section className="rounded-3xl bg-red-50 px-6 py-5 text-red-900 shadow-sm ring-1 ring-red-200">
            {errorMessage}
          </section>
        )}

        {isLoading ? (
          <section className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-bold text-slate-700">履歴を読み込み中...</p>
          </section>
        ) : records.length === 0 ? (
          <section className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-bold text-slate-800">履歴はまだありません</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              設定画面から練習を開始すると、ここに全珠連基準の履歴が表示されます。
            </p>
            <Link
              href="/settings"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-white transition hover:bg-orange-600"
            >
              練習を始める
            </Link>
          </section>
        ) : (
          <section className="space-y-5">
            {records.map((record) => {
              const standard = EXAM_STANDARDS[record.level];
              const availableTypes = getAvailablePracticeTypes(record.level);
              const officialTime =
                record.type === "anzan"
                  ? standard.anzanTimeSec ?? standard.standardTimeSec
                  : standard.standardTimeSec;

              const practiceHref = buildPracticeHref(
                record.level,
                availableTypes.includes(record.type)
                  ? record.type
                  : availableTypes[0] ?? DEFAULT_TYPE,
                record.usedCustomTime ? record.timeSec : undefined
              );

              return (
                <article
                  key={record.id}
                  className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-900">
                          {record.levelLabel}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                          {getBandLabel(standard.band)}
                        </span>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-900">
                          {record.typeLabel}
                        </span>

                        {record.usedCustomTime && (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                            カスタム時間
                          </span>
                        )}

                        {record.type === "anzan" && !standard.anzan?.officialExact && (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                            近似実装
                          </span>
                        )}

                        {standard.sharedPaperByScore && (
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-900">
                            共通問題・点数認定
                          </span>
                        )}
                      </div>

                      <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                        {record.levelLabel} / {record.typeLabel}
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        {formatDateTime(record.createdAt)}
                      </p>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-sm text-slate-500">正解数</div>
                          <div className="mt-2 text-2xl font-bold text-slate-900">
                            {record.score}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-sm text-slate-500">解答数</div>
                          <div className="mt-2 text-2xl font-bold text-slate-900">
                            {record.answeredCount}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-sm text-slate-500">正答率</div>
                          <div className="mt-2 text-2xl font-bold text-slate-900">
                            {record.accuracy}%
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-sm text-slate-500">残り時間</div>
                          <div className="mt-2 text-2xl font-bold text-slate-900">
                            {formatTime(record.remainingTimeSec)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                          <div>
                            <span className="font-semibold text-slate-500">
                              出題数:
                            </span>{" "}
                            {record.totalQuestions}問
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">
                              公式時間:
                            </span>{" "}
                            {formatTime(officialTime)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">
                              使用時間:
                            </span>{" "}
                            {formatTime(record.timeSec)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">
                              実装状態:
                            </span>{" "}
                            {record.type === "anzan" && !standard.anzan?.officialExact
                              ? "一部近似あり"
                              : "公式基準ベース"}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                          <div>
                            <span className="font-semibold text-slate-500">
                              必須種目:
                            </span>{" "}
                            {formatSubjectList(standard.requiredSubjects)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">
                              選択種目:
                            </span>{" "}
                            {formatSubjectList(standard.optionalSubjects)}
                            {standard.optionalPickCount > 0 && (
                              <span className="text-slate-500">
                                {" "}
                                （{standard.optionalPickCount}種目選択）
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {standard.notes.length > 0 && (
                        <div className="mt-5 space-y-2">
                          {standard.notes.map((note, index) => (
                            <div
                              key={`${record.id}-note-${index}`}
                              className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                            >
                              {note}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex w-full shrink-0 flex-col gap-3 lg:w-64">
                      <Link
                        href={practiceHref}
                        className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-white transition hover:bg-orange-600"
                      >
                        同じ設定で再挑戦
                      </Link>

                      <Link
                        href="/settings"
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        設定を開く
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteOne(record.id)}
                        className="inline-flex items-center justify-center rounded-2xl border border-rose-200 px-5 py-4 text-base font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        この履歴を削除
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
