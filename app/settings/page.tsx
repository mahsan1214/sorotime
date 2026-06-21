"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LEVEL,
  PRACTICE_TYPE_LABELS,
  LEVEL_ORDER,
  EXAM_STANDARDS,
  getAvailablePracticeTypes,
  getDefaultTypeForLevel,
  getOfficialLevelStandard,
  getPracticeConfig,
  sanitizeTimeSec,
  type LevelBand,
  type LevelKey,
  type PracticeType,
  type SubjectKey,
} from "../../lib/practice-config";

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

function buildPracticeHref(
  level: LevelKey,
  type: PracticeType,
  customTimeSec?: number
): string {
  const params = new URLSearchParams({
    level,
    type,
  });

  if (customTimeSec) {
    params.set("time", String(customTimeSec));
  }

  return `/practice?${params.toString()}`;
}

export default function SettingsPage() {
  const [selectedLevel, setSelectedLevel] = useState<LevelKey>(DEFAULT_LEVEL);
  const [selectedType, setSelectedType] = useState<PracticeType>(
    getDefaultTypeForLevel(DEFAULT_LEVEL)
  );
  const [timeInput, setTimeInput] = useState("");

  const availableTypes = useMemo(
    () => getAvailablePracticeTypes(selectedLevel),
    [selectedLevel]
  );

  useEffect(() => {
    if (!availableTypes.includes(selectedType)) {
      setSelectedType(availableTypes[0] ?? getDefaultTypeForLevel(selectedLevel));
    }
  }, [availableTypes, selectedLevel, selectedType]);

  const customTimeSec = useMemo(() => {
    if (timeInput.trim() === "") return undefined;
    return sanitizeTimeSec(Number(timeInput));
  }, [timeInput]);

  const standard = useMemo(
    () => getOfficialLevelStandard(selectedLevel),
    [selectedLevel]
  );

  const previewConfig = useMemo(
    () => getPracticeConfig(selectedLevel, selectedType, customTimeSec),
    [selectedLevel, selectedType, customTimeSec]
  );

  const practiceHref = useMemo(
    () => buildPracticeHref(selectedLevel, selectedType, customTimeSec),
    [selectedLevel, selectedType, customTimeSec]
  );

  const supportsOnlyCurrentAppSubjects =
    standard.optionalSubjects.includes("denpyozan") ||
    standard.optionalSubjects.includes("oyoKeisan") ||
    standard.optionalSubjects.includes("kaiho");

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-4 py-6 text-slate-800 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-orange-600">Sorotime 設定</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            全珠連基準の練習設定
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            級・段ごとの公式構成を基準に、現在のアプリで実装済みの種目だけを選べるようにしています。
            3級以上は本来「選択種目」がありますが、現時点では
            見取り算・暗算・かけ算・わり算を中心に練習する構成です。
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">1. 級・段を選ぶ</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {LEVEL_ORDER.map((level) => {
                  const item = EXAM_STANDARDS[level];
                  const active = selectedLevel === level;

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedLevel(level)}
                      className={[
                        "rounded-2xl border px-4 py-3 text-left transition",
                        active
                          ? "border-orange-500 bg-orange-50 text-orange-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50/50",
                      ].join(" ")}
                    >
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {getBandLabel(item.band)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">2. 種目を選ぶ</h2>
              <p className="mt-2 text-sm text-slate-600">
                選べるのは、この級・段で現在アプリ実装済みの種目です。
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {availableTypes.map((type) => {
                  const active = selectedType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={[
                        "rounded-2xl border px-4 py-4 text-center font-semibold transition",
                        active
                          ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50/50",
                      ].join(" ")}
                    >
                      {PRACTICE_TYPE_LABELS[type]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">3. 制限時間</h2>
              <p className="mt-2 text-sm text-slate-600">
                空欄なら公式基準時間を使用します。入力した場合はその秒数で上書きします。
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:max-w-xs">
                <label className="text-sm font-medium text-slate-700">
                  カスタム時間（秒）
                </label>
                <input
                  type="number"
                  min={10}
                  max={3600}
                  inputMode="numeric"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  placeholder={`例: ${previewConfig.timeSec}`}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-lg outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
                <p className="text-xs text-slate-500">
                  公式時間:{" "}
                  {selectedType === "anzan"
                    ? `${Math.floor((standard.anzanTimeSec ?? 180) / 60)}分`
                    : `${Math.floor(standard.standardTimeSec / 60)}分`}
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">プレビュー</h2>

              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-slate-500">級・段</dt>
                  <dd className="mt-1 text-lg font-bold text-slate-900">
                    {standard.label}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-500">区分</dt>
                  <dd className="mt-1 text-slate-800">{getBandLabel(standard.band)}</dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-500">練習種目</dt>
                  <dd className="mt-1 text-slate-800">
                    {PRACTICE_TYPE_LABELS[selectedType]}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-500">制限時間</dt>
                  <dd className="mt-1 text-slate-800">
                    {Math.floor(previewConfig.timeSec / 60)}分
                    {previewConfig.timeSec % 60 !== 0
                      ? `${previewConfig.timeSec % 60}秒`
                      : ""}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-500">問題数</dt>
                  <dd className="mt-1 text-slate-800">{previewConfig.questionCount}問</dd>
                </div>
              </dl>

              <Link
                href={practiceHref}
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-white transition hover:bg-orange-600"
              >
                この設定で練習を開始
              </Link>

              <Link
                href="/"
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ホームに戻る
              </Link>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">全珠連基準情報</h2>

              <div className="mt-4 space-y-4 text-sm text-slate-700">
                <div>
                  <div className="font-semibold text-slate-500">必須種目</div>
                  <div className="mt-1">
                    {formatSubjectList(standard.requiredSubjects)}
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-500">選択種目</div>
                  <div className="mt-1">
                    {formatSubjectList(standard.optionalSubjects)}
                    {standard.optionalPickCount > 0 && (
                      <span className="ml-2 text-slate-500">
                        （{standard.optionalPickCount}種目選択）
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-500">珠算の公式時間</div>
                  <div className="mt-1">{Math.floor(standard.standardTimeSec / 60)}分</div>
                </div>

                {standard.anzanTimeSec && (
                  <div>
                    <div className="font-semibold text-slate-500">暗算の公式時間</div>
                    <div className="mt-1">
                      {Math.floor(standard.anzanTimeSec / 60)}分
                    </div>
                  </div>
                )}

                {standard.sharedPaperByScore && (
                  <div className="rounded-2xl bg-blue-50 px-4 py-3 text-blue-900">
                    段位は共通問題を使用し、点数で認定する方式です。
                  </div>
                )}

                {supportsOnlyCurrentAppSubjects && (
                  <div className="rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
                    この級・段には本来、伝票算・応用計算・開法などの選択種目がありますが、
                    現在の練習画面では未実装のため選択肢に出していません。
                  </div>
                )}

                {previewConfig.type === "anzan" && !previewConfig.strictOfficialForType && (
                  <div className="rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
                    暗算は資料に級別の細目が明記されていないため、
                    現在のアプリでは見取り暗算形式の近似練習です。
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">メモ</h2>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
                {standard.notes.map((note, index) => (
                  <li key={`${note}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
