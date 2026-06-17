"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LevelKey = "kyu10" | "kyu7" | "kyu5" | "kyu3" | "jun1" | "kyu1" | "dan1";
type PracticeType = "mitorizan" | "anzan" | "kakezan" | "warizan";

const levelOptions: { key: LevelKey; label: string; note: string }[] = [
  { key: "kyu10", label: "10級", note: "はじめての練習向け" },
  { key: "kyu7", label: "7級", note: "少しなれてきた方向け" },
  { key: "kyu5", label: "5級", note: "小学生の中級練習向け" },
  { key: "kyu3", label: "3級", note: "しっかり練習したい方向け" },
  { key: "jun1", label: "準1級", note: "上級に近い練習" },
  { key: "kyu1", label: "1級", note: "高い集中力が必要" },
  { key: "dan1", label: "初段", note: "かなり難しい練習" },
];

const typeOptions: { key: PracticeType; label: string; note: string }[] = [
  { key: "mitorizan", label: "見取り算", note: "数字を見て計算する" },
  { key: "anzan", label: "暗算", note: "頭の中で計算する" },
  { key: "kakezan", label: "かけ算", note: "かけ算の練習" },
  { key: "warizan", label: "わり算", note: "わり算の練習" },
];

function sanitizeTime(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 60;
  const intValue = Math.floor(n);
  if (intValue < 10) return 10;
  if (intValue > 600) return 600;
  return intValue;
}

export default function SettingsPage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<LevelKey>("kyu5");
  const [selectedType, setSelectedType] = useState<PracticeType>("mitorizan");
  const [timeValue, setTimeValue] = useState("60");

  const handleStart = () => {
    const safeTime = sanitizeTime(timeValue);
    router.push(
      `/practice?level=${selectedLevel}&type=${selectedType}&time=${safeTime}`
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-4 py-6 text-slate-800 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← ホームにもどる
          </Link>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
              ⚙️
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              練習の設定
            </h1>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              級・段、種目、時間をえらんで練習をはじめよう
            </p>
          </div>

          <section className="mt-8">
            <h2 className="mb-4 text-lg font-extrabold text-slate-900 sm:text-xl">
              級・段
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {levelOptions.map((option) => {
                const selected = selectedLevel === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedLevel(option.key)}
                    className={`rounded-3xl p-5 text-left transition ${
                      selected
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-slate-50 text-slate-800 ring-1 ring-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xl font-extrabold">{option.label}</div>
                    <div
                      className={`mt-2 text-sm ${
                        selected ? "text-orange-50" : "text-slate-500"
                      }`}
                    >
                      {option.note}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="mb-4 text-lg font-extrabold text-slate-900 sm:text-xl">
              種目
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {typeOptions.map((option) => {
                const selected = selectedType === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedType(option.key)}
                    className={`rounded-3xl p-5 text-left transition ${
                      selected
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-slate-50 text-slate-800 ring-1 ring-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xl font-extrabold">{option.label}</div>
                    <div
                      className={`mt-2 text-sm ${
                        selected ? "text-orange-50" : "text-slate-500"
                      }`}
                    >
                      {option.note}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="mb-4 text-lg font-extrabold text-slate-900 sm:text-xl">
              時間設定
            </h2>
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <label
                htmlFor="timeValue"
                className="mb-3 block text-sm font-bold text-slate-700"
              >
                練習時間（秒）
              </label>
              <input
                id="timeValue"
                type="number"
                min={10}
                max={600}
                step={10}
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                className="w-full max-w-xs rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xl font-bold text-slate-900 outline-none focus:border-orange-400"
              />
              <p className="mt-3 text-sm text-slate-500">
                10〜600秒の間で設定できます
              </p>
            </div>
          </section>

          <div className="mt-10">
            <button
              type="button"
              onClick={handleStart}
              className="w-full rounded-3xl bg-orange-500 px-6 py-5 text-xl font-extrabold text-white shadow-sm transition hover:bg-orange-600"
            >
              この内容で練習を始める
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
