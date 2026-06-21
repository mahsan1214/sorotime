// lib/practice-config.ts

export const PRACTICE_TYPES = [
  "mitorizan",
  "anzan",
  "kakezan",
  "warizan",
] as const;

export type PracticeType = (typeof PRACTICE_TYPES)[number];

export const LEVEL_ORDER = [
  "10kyu",
  "9kyu",
  "8kyu",
  "7kyu",
  "6kyu",
  "5kyu",
  "4kyu",
  "jun3kyu",
  "3kyu",
  "jun2kyu",
  "2kyu",
  "jun1kyu",
  "1kyu",
  "jun_shodan",
  "shodan",
  "nidan",
  "sandan",
  "yondan",
  "godan",
  "rokudan",
  "nanadan",
  "hachidan",
  "kyudan",
  "judan",
] as const;

export type LevelKey = (typeof LEVEL_ORDER)[number];

export type SubjectKey =
  | PracticeType
  | "denpyozan"
  | "oyoKeisan"
  | "kaiho";

export type LevelBand = "shokyu" | "chukyu" | "jokyu" | "dan";

export type ExamMode =
  | "requiredOnly"
  | "requiredPlusOptional"
  | "danCommonByScore";

export interface DigitRange {
  min: number;
  max: number;
}

export interface BaseSubjectStandard {
  enabled: boolean;
  questionCount: number;
  timeSec: number;
  officialExact: boolean;
  note?: string;
}

export interface KakezanStandard extends BaseSubjectStandard {
  totalDigits: number;
  suggestedPairs: Array<[number, number]>;
}

export interface WarizanStandard extends BaseSubjectStandard {
  divisorPlusQuotientDigits: number;
  suggestedPairs: Array<{
    divisorDigits: number;
    quotientDigits: number;
  }>;
  exactDivision: boolean;
}

export interface MitorizanStandard extends BaseSubjectStandard {
  digits: DigitRange;
  lines: number;
  fixedDigits?: number;
}

export interface AnzanStandard extends BaseSubjectStandard {
  digits: DigitRange;
  lines: number;
  fixedDigits?: number;
  mode: "mitoriApprox";
}

export type PracticeSubjectStandard =
  | KakezanStandard
  | WarizanStandard
  | MitorizanStandard
  | AnzanStandard;

export interface LevelStandard {
  key: LevelKey;
  label: string;
  band: LevelBand;
  examMode: ExamMode;

  requiredSubjects: SubjectKey[];
  optionalSubjects: SubjectKey[];
  optionalPickCount: number;

  standardTimeSec: number;
  anzanTimeSec?: number;

  kakezan?: KakezanStandard;
  warizan?: WarizanStandard;
  mitorizan?: MitorizanStandard;
  anzan?: AnzanStandard;

  sharedPaperByScore?: boolean;
  notes: string[];
}

export interface PracticeConfig {
  level: LevelKey;
  levelLabel: string;
  band: LevelBand;
  examMode: ExamMode;

  type: PracticeType;
  typeLabel: string;

  requiredSubjects: SubjectKey[];
  optionalSubjects: SubjectKey[];
  optionalPickCount: number;

  questionCount: number;
  timeSec: number;

  standardTimeSec: number;
  anzanTimeSec?: number;

  strictOfficialForType: boolean;
  adjustedTypeFromRequest: boolean;

  kakezan?: KakezanStandard;
  warizan?: WarizanStandard;
  mitorizan?: MitorizanStandard;
  anzan?: AnzanStandard;

  sharedPaperByScore?: boolean;
  notes: string[];
}

export interface SumQuestion {
  layout: "sum";
  lines: string[];
  answer: number;
}

export interface MultiplyQuestion {
  layout: "multiply";
  lines: [string, string];
  left: number;
  right: number;
  answer: number;
}

export interface DivideQuestion {
  layout: "divide";
  lines: [string, string];
  dividend: number;
  divisor: number;
  answer: number;
}

export type PracticeQuestion = SumQuestion | MultiplyQuestion | DivideQuestion;

export const DEFAULT_LEVEL: LevelKey = "10kyu";
export const DEFAULT_TYPE: PracticeType = "mitorizan";

export const PRACTICE_TYPE_LABELS: Record<PracticeType, string> = {
  mitorizan: "見取り算",
  anzan: "暗算",
  kakezan: "かけ算",
  warizan: "わり算",
};

const EXAM_TIME_STANDARD = 7 * 60; // 420秒
const EXAM_TIME_ANZAN = 3 * 60; // 180秒
const DEFAULT_QUESTION_COUNT = 30;

const MUL_PATTERNS: Record<number, Array<[number, number]>> = {
  3: [
    [1, 2],
    [2, 1],
  ],
  4: [
    [2, 2],
    [1, 3],
    [3, 1],
  ],
  5: [
    [2, 3],
    [3, 2],
    [1, 4],
    [4, 1],
  ],
  6: [
    [3, 3],
    [2, 4],
    [4, 2],
    [1, 5],
    [5, 1],
  ],
  7: [
    [3, 4],
    [4, 3],
    [2, 5],
    [5, 2],
  ],
  8: [
    [4, 4],
    [3, 5],
    [5, 3],
    [2, 6],
    [6, 2],
  ],
  9: [
    [4, 5],
    [5, 4],
    [3, 6],
    [6, 3],
  ],
  10: [
    [5, 5],
    [4, 6],
    [6, 4],
    [3, 7],
  ],
  11: [
    [5, 6],
    [6, 5],
    [4, 7],
    [7, 4],
  ],
};

const DIV_PATTERNS: Record<
  number,
  Array<{ divisorDigits: number; quotientDigits: number }>
> = {
  3: [
    { divisorDigits: 1, quotientDigits: 2 },
    { divisorDigits: 2, quotientDigits: 1 },
  ],
  4: [
    { divisorDigits: 1, quotientDigits: 3 },
    { divisorDigits: 2, quotientDigits: 2 },
  ],
  5: [
    { divisorDigits: 1, quotientDigits: 4 },
    { divisorDigits: 2, quotientDigits: 3 },
    { divisorDigits: 3, quotientDigits: 2 },
  ],
  6: [
    { divisorDigits: 1, quotientDigits: 5 },
    { divisorDigits: 2, quotientDigits: 4 },
    { divisorDigits: 3, quotientDigits: 3 },
  ],
  7: [
    { divisorDigits: 2, quotientDigits: 5 },
    { divisorDigits: 3, quotientDigits: 4 },
    { divisorDigits: 1, quotientDigits: 6 },
  ],
  8: [
    { divisorDigits: 2, quotientDigits: 6 },
    { divisorDigits: 3, quotientDigits: 5 },
    { divisorDigits: 4, quotientDigits: 4 },
  ],
  9: [
    { divisorDigits: 3, quotientDigits: 6 },
    { divisorDigits: 4, quotientDigits: 5 },
    { divisorDigits: 2, quotientDigits: 7 },
  ],
  10: [
    { divisorDigits: 3, quotientDigits: 7 },
    { divisorDigits: 4, quotientDigits: 6 },
    { divisorDigits: 5, quotientDigits: 5 },
  ],
};

function makeKakezan(
  totalDigits: number,
  officialExact = true,
  note?: string
): KakezanStandard {
  return {
    enabled: true,
    questionCount: DEFAULT_QUESTION_COUNT,
    timeSec: EXAM_TIME_STANDARD,
    officialExact,
    totalDigits,
    suggestedPairs: MUL_PATTERNS[totalDigits] ?? [[1, totalDigits - 1]],
    note,
  };
}

function makeWarizan(
  divisorPlusQuotientDigits: number,
  officialExact = true,
  note?: string
): WarizanStandard {
  return {
    enabled: true,
    questionCount: DEFAULT_QUESTION_COUNT,
    timeSec: EXAM_TIME_STANDARD,
    officialExact,
    divisorPlusQuotientDigits,
    suggestedPairs:
      DIV_PATTERNS[divisorPlusQuotientDigits] ?? [
        {
          divisorDigits: 1,
          quotientDigits: Math.max(1, divisorPlusQuotientDigits - 1),
        },
      ],
    exactDivision: true,
    note,
  };
}

function makeMitorizan(
  digits: DigitRange,
  lines: number,
  fixedDigits?: number,
  officialExact = true,
  note?: string
): MitorizanStandard {
  return {
    enabled: true,
    questionCount: DEFAULT_QUESTION_COUNT,
    timeSec: EXAM_TIME_STANDARD,
    officialExact,
    digits,
    lines,
    fixedDigits,
    note,
  };
}

function makeAnzanApprox(
  digits: DigitRange,
  lines: number,
  fixedDigits?: number,
  note?: string
): AnzanStandard {
  return {
    enabled: true,
    questionCount: DEFAULT_QUESTION_COUNT,
    timeSec: EXAM_TIME_ANZAN,
    officialExact: false,
    digits,
    lines,
    fixedDigits,
    mode: "mitoriApprox",
    note,
  };
}

function createLowerLevel(params: {
  key: LevelKey;
  label: string;
  band: "shokyu" | "chukyu";
  requiredSubjects: SubjectKey[];
  kakezan?: KakezanStandard;
  warizan?: WarizanStandard;
  mitorizan?: MitorizanStandard;
  notes?: string[];
}): LevelStandard {
  return {
    key: params.key,
    label: params.label,
    band: params.band,
    examMode: "requiredOnly",
    requiredSubjects: params.requiredSubjects,
    optionalSubjects: [],
    optionalPickCount: 0,
    standardTimeSec: EXAM_TIME_STANDARD,
    kakezan: params.kakezan,
    warizan: params.warizan,
    mitorizan: params.mitorizan,
    notes: params.notes ?? [],
  };
}

function createUpperLevel(params: {
  key: LevelKey;
  label: string;
  kakeTotalDigits: number;
  wariTotalDigits: number;
  mitoriDigits: DigitRange;
  mitoriLines: number;
  mitoriFixedDigits?: number;
}): LevelStandard {
  return {
    key: params.key,
    label: params.label,
    band: "jokyu",
    examMode: "requiredPlusOptional",
    requiredSubjects: ["kakezan", "warizan", "mitorizan"],
    optionalSubjects: ["denpyozan", "oyoKeisan", "anzan"],
    optionalPickCount: 2,
    standardTimeSec: EXAM_TIME_STANDARD,
    anzanTimeSec: EXAM_TIME_ANZAN,
    kakezan: makeKakezan(params.kakeTotalDigits),
    warizan: makeWarizan(params.wariTotalDigits),
    mitorizan: makeMitorizan(
      params.mitoriDigits,
      params.mitoriLines,
      params.mitoriFixedDigits
    ),
    anzan: makeAnzanApprox(
      params.mitoriDigits,
      params.mitoriLines,
      params.mitoriFixedDigits,
      "提供資料に上級暗算の級別細目がないため、アプリでは見取り暗算形式の近似練習として生成"
    ),
    notes: [
      "3級以上は選択種目あり",
      "暗算は3分",
      "伝票算・応用計算は設定情報のみ保持",
    ],
  };
}

function createDanLevel(key: LevelKey, label: string): LevelStandard {
  return {
    key,
    label,
    band: "dan",
    examMode: "danCommonByScore",
    requiredSubjects: ["kakezan", "warizan", "mitorizan"],
    optionalSubjects: ["denpyozan", "oyoKeisan", "kaiho", "anzan"],
    optionalPickCount: 3,
    standardTimeSec: EXAM_TIME_STANDARD,
    anzanTimeSec: EXAM_TIME_ANZAN,
    kakezan: makeKakezan(
      11,
      true,
      "段位は実法合わせて11桁（小数・負数・名数を含む場合あり）"
    ),
    warizan: makeWarizan(
      10,
      true,
      "段位は法商合わせて10桁（小数・負数・名数を含む場合あり）"
    ),
    mitorizan: makeMitorizan(
      { min: 10, max: 10 },
      10,
      10,
      true,
      "段位は10桁揃い・10口"
    ),
    anzan: makeAnzanApprox(
      { min: 3, max: 6 },
      10,
      undefined,
      "資料上の段位暗算は かけ暗・わり暗・みとり暗 に分かれるが、現アプリでは見取り暗算形式で近似"
    ),
    sharedPaperByScore: true,
    notes: [
      "段位は共通問題を点数認定で使用",
      "選択種目は伝票算・応用計算・開法・暗算から3種目",
    ],
  };
}

export const EXAM_STANDARDS: Record<LevelKey, LevelStandard> = {
  "10kyu": createLowerLevel({
    key: "10kyu",
    label: "10級",
    band: "shokyu",
    requiredSubjects: ["mitorizan"],
    mitorizan: makeMitorizan(
      { min: 1, max: 1 },
      6,
      1,
      true,
      "10級はみとり算のみ"
    ),
    notes: ["10級はみとり算のみ"],
  }),

  "9kyu": createLowerLevel({
    key: "9kyu",
    label: "9級",
    band: "shokyu",
    requiredSubjects: ["kakezan", "mitorizan"],
    kakezan: makeKakezan(3),
    mitorizan: makeMitorizan(
      { min: 1, max: 2 },
      6,
      undefined,
      true,
      "9級はわり算なし"
    ),
    notes: ["9級はわり算なし"],
  }),

  "8kyu": createLowerLevel({
    key: "8kyu",
    label: "8級",
    band: "shokyu",
    requiredSubjects: ["kakezan", "warizan", "mitorizan"],
    kakezan: makeKakezan(3),
    warizan: makeWarizan(3),
    mitorizan: makeMitorizan({ min: 1, max: 2 }, 8),
  }),

  "7kyu": createLowerLevel({
    key: "7kyu",
    label: "7級",
    band: "shokyu",
    requiredSubjects: ["kakezan", "warizan", "mitorizan"],
    kakezan: makeKakezan(4),
    warizan: makeWarizan(3),
    mitorizan: makeMitorizan({ min: 2, max: 2 }, 8, 2),
  }),

  "6kyu": createLowerLevel({
    key: "6kyu",
    label: "6級",
    band: "chukyu",
    requiredSubjects: ["kakezan", "warizan", "mitorizan"],
    kakezan: makeKakezan(5),
    warizan: makeWarizan(4),
    mitorizan: makeMitorizan({ min: 2, max: 2 }, 10, 2),
  }),

  "5kyu": createLowerLevel({
    key: "5kyu",
    label: "5級",
    band: "chukyu",
    requiredSubjects: ["kakezan", "warizan", "mitorizan"],
    kakezan: makeKakezan(5),
    warizan: makeWarizan(4),
    mitorizan: makeMitorizan({ min: 2, max: 3 }, 10),
  }),

  "4kyu": createLowerLevel({
    key: "4kyu",
    label: "4級",
    band: "chukyu",
    requiredSubjects: ["kakezan", "warizan", "mitorizan"],
    kakezan: makeKakezan(6),
    warizan: makeWarizan(5),
    mitorizan: makeMitorizan({ min: 2, max: 4 }, 10),
  }),

  "jun3kyu": createUpperLevel({
    key: "jun3kyu",
    label: "準3級",
    kakeTotalDigits: 6,
    wariTotalDigits: 5,
    mitoriDigits: { min: 2, max: 4 },
    mitoriLines: 10,
  }),

  "3kyu": createUpperLevel({
    key: "3kyu",
    label: "3級",
    kakeTotalDigits: 7,
    wariTotalDigits: 6,
    mitoriDigits: { min: 3, max: 5 },
    mitoriLines: 10,
  }),

  "jun2kyu": createUpperLevel({
    key: "jun2kyu",
    label: "準2級",
    kakeTotalDigits: 8,
    wariTotalDigits: 7,
    mitoriDigits: { min: 3, max: 5 },
    mitoriLines: 10,
  }),

  "2kyu": createUpperLevel({
    key: "2kyu",
    label: "2級",
    kakeTotalDigits: 9,
    wariTotalDigits: 8,
    mitoriDigits: { min: 3, max: 6 },
    mitoriLines: 10,
  }),

  "jun1kyu": createUpperLevel({
    key: "jun1kyu",
    label: "準1級",
    kakeTotalDigits: 10,
    wariTotalDigits: 9,
    mitoriDigits: { min: 4, max: 6 },
    mitoriLines: 10,
  }),

  "1kyu": createUpperLevel({
    key: "1kyu",
    label: "1級",
    kakeTotalDigits: 11,
    wariTotalDigits: 10,
    mitoriDigits: { min: 4, max: 7 },
    mitoriLines: 10,
  }),

  "jun_shodan": createDanLevel("jun_shodan", "準初段"),
  "shodan": createDanLevel("shodan", "初段"),
  "nidan": createDanLevel("nidan", "二段"),
  "sandan": createDanLevel("sandan", "三段"),
  "yondan": createDanLevel("yondan", "四段"),
  "godan": createDanLevel("godan", "五段"),
  "rokudan": createDanLevel("rokudan", "六段"),
  "nanadan": createDanLevel("nanadan", "七段"),
  "hachidan": createDanLevel("hachidan", "八段"),
  "kyudan": createDanLevel("kyudan", "九段"),
  "judan": createDanLevel("judan", "十段"),
};

export const LEVEL_LABELS: Record<LevelKey, string> = Object.fromEntries(
  LEVEL_ORDER.map((key) => [key, EXAM_STANDARDS[key].label])
) as Record<LevelKey, string>;

export const LEVEL_OPTIONS = LEVEL_ORDER.map((key) => ({
  key,
  label: EXAM_STANDARDS[key].label,
  band: EXAM_STANDARDS[key].band,
}));

export const PRACTICE_TYPE_OPTIONS = PRACTICE_TYPES.map((key) => ({
  key,
  label: PRACTICE_TYPE_LABELS[key],
}));

export function isLevelKey(value: string): value is LevelKey {
  return (LEVEL_ORDER as readonly string[]).includes(value);
}

export function isPracticeType(value: string): value is PracticeType {
  return (PRACTICE_TYPES as readonly string[]).includes(value);
}

export function getLevelLabel(level: LevelKey): string {
  return EXAM_STANDARDS[level].label;
}

export function getOfficialLevelStandard(level: LevelKey): LevelStandard {
  return EXAM_STANDARDS[level];
}

export function getAvailablePracticeTypes(level: LevelKey): PracticeType[] {
  const standard = EXAM_STANDARDS[level];

  return PRACTICE_TYPES.filter((type) => {
    const subject = standard[type];
    return Boolean(subject?.enabled);
  });
}

export function getDefaultTypeForLevel(level: LevelKey): PracticeType {
  const available = getAvailablePracticeTypes(level);
  return available[0] ?? DEFAULT_TYPE;
}

export function sanitizeTimeSec(value: number | undefined | null): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  if (rounded < 10) return 10;
  if (rounded > 60 * 60) return 60 * 60;
  return rounded;
}

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getPracticeConfig(
  requestedLevel: LevelKey = DEFAULT_LEVEL,
  requestedType: PracticeType = DEFAULT_TYPE,
  customTimeSec?: number
): PracticeConfig {
  const level = EXAM_STANDARDS[requestedLevel] ? requestedLevel : DEFAULT_LEVEL;
  const standard = EXAM_STANDARDS[level];
  const availableTypes = getAvailablePracticeTypes(level);

  const type = availableTypes.includes(requestedType)
    ? requestedType
    : availableTypes[0] ?? DEFAULT_TYPE;

  const adjustedTypeFromRequest = type !== requestedType;
  const subject = standard[type] as PracticeSubjectStandard | undefined;

  const defaultTimeSec =
    subject?.timeSec ??
    (type === "anzan" ? standard.anzanTimeSec ?? EXAM_TIME_ANZAN : standard.standardTimeSec);

  const timeSec = sanitizeTimeSec(customTimeSec) ?? defaultTimeSec;
  const questionCount = subject?.questionCount ?? DEFAULT_QUESTION_COUNT;

  return {
    level,
    levelLabel: standard.label,
    band: standard.band,
    examMode: standard.examMode,

    type,
    typeLabel: PRACTICE_TYPE_LABELS[type],

    requiredSubjects: standard.requiredSubjects,
    optionalSubjects: standard.optionalSubjects,
    optionalPickCount: standard.optionalPickCount,

    questionCount,
    timeSec,

    standardTimeSec: standard.standardTimeSec,
    anzanTimeSec: standard.anzanTimeSec,

    strictOfficialForType: subject?.officialExact ?? false,
    adjustedTypeFromRequest,

    kakezan: standard.kakezan,
    warizan: standard.warizan,
    mitorizan: standard.mitorizan,
    anzan: standard.anzan,

    sharedPaperByScore: standard.sharedPaperByScore,
    notes: standard.notes,
  };
}

function randomInt(min: number, max: number): number {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function randomPick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function digitsMin(digits: number): number {
  if (digits <= 1) return 1;
  return 10 ** (digits - 1);
}

function digitsMax(digits: number): number {
  return 10 ** digits - 1;
}

function randomNumberWithDigits(digits: number): number {
  if (digits <= 1) return randomInt(1, 9);
  return randomInt(digitsMin(digits), digitsMax(digits));
}

function randomNumberFromRange(range: DigitRange, fixedDigits?: number): number {
  const digits = fixedDigits ?? randomInt(range.min, range.max);
  return randomNumberWithDigits(digits);
}

function createSumQuestion(standard: MitorizanStandard | AnzanStandard): SumQuestion {
  const lines = Array.from({ length: standard.lines }, () =>
    String(randomNumberFromRange(standard.digits, standard.fixedDigits))
  );

  const answer = lines.reduce((sum, value) => sum + Number(value), 0);

  return {
    layout: "sum",
    lines,
    answer,
  };
}

function createMultiplyQuestion(standard: KakezanStandard): MultiplyQuestion {
  const [leftDigits, rightDigits] = randomPick(standard.suggestedPairs);
  const left = randomNumberWithDigits(leftDigits);
  const right = randomNumberWithDigits(rightDigits);

  return {
    layout: "multiply",
    lines: [String(left), String(right)],
    left,
    right,
    answer: left * right,
  };
}

function createDivideQuestion(standard: WarizanStandard): DivideQuestion {
  const pair = randomPick(standard.suggestedPairs);
  const divisor = randomNumberWithDigits(pair.divisorDigits);
  const quotient = randomNumberWithDigits(pair.quotientDigits);
  const dividend = divisor * quotient;

  return {
    layout: "divide",
    lines: [String(dividend), String(divisor)],
    dividend,
    divisor,
    answer: quotient,
  };
}

export function createQuestionSet(config: PracticeConfig): PracticeQuestion[] {
  switch (config.type) {
    case "mitorizan": {
      if (!config.mitorizan) return [];
      return Array.from({ length: config.questionCount }, () =>
        createSumQuestion(config.mitorizan!)
      );
    }

    case "anzan": {
      if (!config.anzan) return [];
      return Array.from({ length: config.questionCount }, () =>
        createSumQuestion(config.anzan!)
      );
    }

    case "kakezan": {
      if (!config.kakezan) return [];
      return Array.from({ length: config.questionCount }, () =>
        createMultiplyQuestion(config.kakezan!)
      );
    }

    case "warizan": {
      if (!config.warizan) return [];
      return Array.from({ length: config.questionCount }, () =>
        createDivideQuestion(config.warizan!)
      );
    }

    default:
      return [];
  }
}
