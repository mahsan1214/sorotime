"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LEVEL_OPTIONS,
  TYPE_OPTIONS,
  type LevelKey,
  type PracticeType,
} from "@/lib/practice-config";

export default function SettingsPage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<LevelKey>("kyu5");
  const [selectedType, setSelectedType] = useState<PracticeType>("mitorizan");

  const handleStart = () => {
    router.push(`/practice?level=${selectedLevel}&type=${selectedType}`);
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
            href="/history"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            練習記録
          </Link>
        </div>

        <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-orange-100 sm:p-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              練習設定
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
              級・段と種目をえらんで、今日の練習を始めましょう。
            </p>
          </div>

          <section className="mt-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-xl">
                🏅
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">級・段</h2>
                <p className="text-sm text-slate-500">
                  自分にあったレベルをえらびます
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LEVEL_OPTIONS.map((option) => {
                const active = selectedLevel === option.key;

                return (
                  <button
                    key={option.key}
                    onClick={() => setSelectedLevel(option.key)}
                    className={`rounded-3xl border-2 px-5 py-5 text-left transition ${
                      active
                        ? "border-orange-500 bg-orange-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {option.label}
                      </span>
                      {active && (
                        <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                          選択中
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {option.note}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-xl">
                🧮
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">種目</h2>
                <p className="text-sm text-slate-500">
                  練習したい内容をえらびます
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {TYPE_OPTIONS.map((option) => {
                const active = selectedType === option.key;

                return (
                  <button
                    key={option.key}
                    onClick={() => setSelectedType(option.key)}
                    className={`rounded-3xl border-2 px-5 py-5 text-left transition ${
                      active
                        ? "border-sky-500 bg-sky-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {option.label}
                      </span>
                      {active && (
                        <span className="rounded-full bg-sky-500 px-3 py-1 text-xs font-bold text-white">
                          選択中
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {option.note}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-10 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <h3 className="text-lg font-extrabold text-slate-900">今日の設定</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">選んだ級・段</p>
                <p className="mt-1 text-2xl font-extrabold text-orange-600">
                  {LEVEL_OPTIONS.find((item) => item.key === selectedLevel)?.label}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">選んだ種目</p>
                <p className="mt-1 text-2xl font-extrabold text-sky-600">
                  {TYPE_OPTIONS.find((item) => item.key === selectedType)?.label}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-10">
            <button
              onClick={handleStart}
              className="w-full rounded-3xl bg-orange-500 px-6 py-5 text-xl font-extrabold text-white shadow-lg transition hover:bg-orange-600"
            >
              この内容で練習を始める
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
