"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearHistory, loadHistory, type PracticeHistoryItem } from "@/lib/history-storage";
import { formatTime } from "@/lib/practice-config";

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [history, setHistory] = useState<PracticeHistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-4 py-6 text-slate-800 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← ホームにもどる
          </Link>

          <Link
            href="/settings"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            新しく練習する
          </Link>
        </div>

        <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-orange-100 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                練習記録
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
                直近10件の結果を見られます。
              </p>
            </div>

            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600"
              >
                記録を消す
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="mt-10 rounded-3xl bg-slate-50 px-6 py-10 text-center ring-1 ring-slate-200">
              <p className="text-xl font-bold text-slate-700">まだ記録がありません</p>
              <p className="mt-2 text-slate-500">
                練習が終わると、ここに結果が保存されます。
              </p>
              <Link
                href="/settings"
                className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-orange-600"
              >
                練習をはじめる
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        {index + 1}件目 / {formatDate(item.playedAt)}
                      </p>
                      <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                        {item.levelLabel}・{item.typeLabel}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.conditionText} / {item.count}問 / 制限時間{" "}
                        {formatTime(item.timeLimit)}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
                      <div className="rounded-2xl bg-white px-4 py-3 text-center ring-1 ring-slate-200">
                        <p className="text-xs text-slate-500">正解数</p>
                        <p className="mt-1 text-2xl font-extrabold text-orange-600">
                          {item.correctCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3 text-center ring-1 ring-slate-200">
                        <p className="text-xs text-slate-500">正答率</p>
                        <p className="mt-1 text-2xl font-extrabold text-sky-600">
                          {item.percentage}%
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3 text-center ring-1 ring-slate-200">
                        <p className="text-xs text-slate-500">残り時間</p>
                        <p className="mt-1 text-2xl font-extrabold text-emerald-600">
                          {formatTime(item.remainingTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
