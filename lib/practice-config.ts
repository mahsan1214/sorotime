export type PracticeType = "mitorizan" | "anzan" | "kakezan" | "warizan";

export type LevelKey =
  | "kyu10"
  | "kyu7"
  | "kyu5"
  | "kyu3"
  | "jun1"
  | "kyu1"
  | "dan1";

export type PracticeMode = "sum" | "multiply" | "divide";

export type Question = {
  layout: PracticeMode;
  lines: string[];
  answer: number;
};

export type PracticeConfig = {
  levelKey: LevelKey;
  levelLabel: string;
  type: PracticeType;
  typeLabel: string;
  count: number;
  time: number;
  mode: PracticeMode;

  // sum 用
  digits?: number;
  linesCount?: number;

  // multiply 用
  leftDigits?: number;
  rightDigits?: number;

  // divide 用
  divisorDigits?: number;
  quotientDigits?: number;
};

export const DEFAULT_LEVEL: LevelKey = "kyu5";
export const DEFAULT_TYPE: PracticeType = "mitorizan";

export const LEVEL_OPTIONS: { key: LevelKey; label: string; note: string }[] = [
  { key: "kyu10", label: "10級", note: "はじめての練習向け" },
  { key: "kyu7", label: "7級", note: "少しなれてきた方向け" },
  { key: "kyu5", label: "5級", note: "小学生の中級練習向け" },
  { key: "kyu3", label: "3級", note: "しっかり練習したい方向け" },
  { key: "jun1", label: "準1級", note: "上級に近い練習" },
  { key: "kyu1", label: "1級", note: "高い集中力が必要" },
  { key: "dan1", label: "初段", note: "かなり難しい練習" },
];

export const TYPE_OPTIONS: {
  key: PracticeType;
  label: string;
  note: string;
}[] = [
  { key: "mitorizan", label: "見取り算", note: "数字を見て計算する" },
  { key: "anzan", label: "暗算", note: "頭の中で計算する" },
  { key: "kakezan", label: "かけ算", note: "かけ算の練習をする" },
  { key: "warizan", label: "わり算", note: "わり算の練習をする" },
];

export const PRACTICE_CONFIGS: Record<
  LevelKey,
  Record<PracticeType, PracticeConfig>
> = {
  kyu10: {
    mitorizan: {
      levelKey: "kyu10",
      levelLabel: "10級",
      type: "mitorizan",
      typeLabel: "見取り算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 2,
      linesCount: 3,
    },
    anzan: {
      levelKey: "kyu10",
      levelLabel: "10級",
      type: "anzan",
      typeLabel: "暗算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 2,
      linesCount: 2,
    },
    kakezan: {
      levelKey: "kyu10",
      levelLabel: "10級",
      type: "kakezan",
      typeLabel: "かけ算",
      count: 10,
      time: 60,
      mode: "multiply",
      leftDigits: 1,
      rightDigits: 1,
    },
    warizan: {
      levelKey: "kyu10",
      levelLabel: "10級",
      type: "warizan",
      typeLabel: "わり算",
      count: 10,
      time: 60,
      mode: "divide",
      divisorDigits: 1,
      quotientDigits: 1,
    },
  },

  kyu7: {
    mitorizan: {
      levelKey: "kyu7",
      levelLabel: "7級",
      type: "mitorizan",
      typeLabel: "見取り算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 2,
      linesCount: 5,
    },
    anzan: {
      levelKey: "kyu7",
      levelLabel: "7級",
      type: "anzan",
      typeLabel: "暗算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 2,
      linesCount: 3,
    },
    kakezan: {
      levelKey: "kyu7",
      levelLabel: "7級",
      type: "kakezan",
      typeLabel: "かけ算",
      count: 10,
      time: 60,
      mode: "multiply",
      leftDigits: 2,
      rightDigits: 1,
    },
    warizan: {
      levelKey: "kyu7",
      levelLabel: "7級",
      type: "warizan",
      typeLabel: "わり算",
      count: 10,
      time: 60,
      mode: "divide",
      divisorDigits: 1,
      quotientDigits: 2,
    },
  },

  kyu5: {
    mitorizan: {
      levelKey: "kyu5",
      levelLabel: "5級",
      type: "mitorizan",
      typeLabel: "見取り算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 3,
      linesCount: 5,
    },
    anzan: {
      levelKey: "kyu5",
      levelLabel: "5級",
      type: "anzan",
      typeLabel: "暗算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 2,
      linesCount: 5,
    },
    kakezan: {
      levelKey: "kyu5",
      levelLabel: "5級",
      type: "kakezan",
      typeLabel: "かけ算",
      count: 10,
      time: 60,
      mode: "multiply",
      leftDigits: 2,
      rightDigits: 2,
    },
    warizan: {
      levelKey: "kyu5",
      levelLabel: "5級",
      type: "warizan",
      typeLabel: "わり算",
      count: 10,
      time: 60,
      mode: "divide",
      divisorDigits: 1,
      quotientDigits: 2,
    },
  },

  kyu3: {
    mitorizan: {
      levelKey: "kyu3",
      levelLabel: "3級",
      type: "mitorizan",
      typeLabel: "見取り算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 3,
      linesCount: 8,
    },
    anzan: {
      levelKey: "kyu3",
      levelLabel: "3級",
      type: "anzan",
      typeLabel: "暗算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 3,
      linesCount: 5,
    },
    kakezan: {
      levelKey: "kyu3",
      levelLabel: "3級",
      type: "kakezan",
      typeLabel: "かけ算",
      count: 10,
      time: 60,
      mode: "multiply",
      leftDigits: 3,
      rightDigits: 2,
    },
    warizan: {
      levelKey: "kyu3",
      levelLabel: "3級",
      type: "warizan",
      typeLabel: "わり算",
      count: 10,
      time: 60,
      mode: "divide",
      divisorDigits: 2,
      quotientDigits: 2,
    },
  },

  jun1: {
    mitorizan: {
      levelKey: "jun1",
      levelLabel: "準1級",
      type: "mitorizan",
      typeLabel: "見取り算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 4,
      linesCount: 8,
    },
    anzan: {
      levelKey: "jun1",
      levelLabel: "準1級",
      type: "anzan",
      typeLabel: "暗算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 3,
      linesCount: 8,
    },
    kakezan: {
      levelKey: "jun1",
      levelLabel: "準1級",
      type: "kakezan",
      typeLabel: "かけ算",
      count: 10,
      time: 60,
      mode: "multiply",
      leftDigits: 3,
      rightDigits: 3,
    },
    warizan: {
      levelKey: "jun1",
      levelLabel: "準1級",
      type: "warizan",
      typeLabel: "わり算",
      count: 10,
      time: 60,
      mode: "divide",
      divisorDigits: 2,
      quotientDigits: 3,
    },
  },

  kyu1: {
    mitorizan: {
      levelKey: "kyu1",
      levelLabel: "1級",
      type: "mitorizan",
      typeLabel: "見取り算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 4,
      linesCount: 10,
    },
    anzan: {
      levelKey: "kyu1",
      levelLabel: "1級",
      type: "anzan",
      typeLabel: "暗算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 3,
      linesCount: 10,
    },
    kakezan: {
      levelKey: "kyu1",
      levelLabel: "1級",
      type: "kakezan",
      typeLabel: "かけ算",
      count: 10,
      time: 60,
      mode: "multiply",
      leftDigits: 4,
      rightDigits: 3,
    },
    warizan: {
      levelKey: "kyu1",
      levelLabel: "1級",
      type: "warizan",
      typeLabel: "わり算",
      count: 10,
      time: 60,
      mode: "divide",
      divisorDigits: 2,
      quotientDigits: 3,
    },
  },

  dan1: {
    mitorizan: {
      levelKey: "dan1",
      levelLabel: "初段",
      type: "mitorizan",
      typeLabel: "見取り算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 5,
      linesCount: 10,
    },
    anzan: {
      levelKey: "dan1",
      levelLabel: "初段",
      type: "anzan",
      typeLabel: "暗算",
      count: 10,
      time: 60,
      mode: "sum",
      digits: 4,
      linesCount: 10,
    },
    kakezan: {
      levelKey: "dan1",
      levelLabel: "初段",
      type: "kakezan",
      typeLabel: "かけ算",
      count: 10,
      time: 60,
      mode: "multiply",
      leftDigits: 4,
      rightDigits: 4,
    },
    warizan: {
      levelKey: "dan1",
      levelLabel: "初段",
      type: "warizan",
      typeLabel: "わり算",
      count: 10,
      time: 60,
      mode: "divide",
      divisorDigits: 3,
      quotientDigits: 3,
    },
  },
};

export function isLevelKey(value: string | null): value is LevelKey {
  return (
    value === "kyu10" ||
    value === "kyu7" ||
    value === "kyu5" ||
    value === "kyu3" ||
    value === "jun1" ||
    value === "kyu1" ||
    value === "dan1"
  );
}

export function isPracticeType(value: string | null): value is PracticeType {
  return (
    value === "mitorizan" ||
    value === "anzan" ||
    value === "kakezan" ||
    value === "warizan"
  );
}

export function getPracticeConfig(level: LevelKey, type: PracticeType): PracticeConfig {
  return PRACTICE_CONFIGS[level][type];
}

export function createRandomNumber(digits: number) {
  const min = digits === 1 ? 1 : Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createSumQuestion(digits: number, linesCount: number): Question {
  const numbers = Array.from({ length: linesCount }, () => createRandomNumber(digits));
  const answer = numbers.reduce((sum, value) => sum + value, 0);

  return {
    layout: "sum",
    lines: numbers.map(String),
    answer,
  };
}

function createMultiplyQuestion(leftDigits: number, rightDigits: number): Question {
  const left = createRandomNumber(leftDigits);
  const right = createRandomNumber(rightDigits);

  return {
    layout: "multiply",
    lines: [String(left), String(right)],
    answer: left * right,
  };
}

function countDigits(num: number) {
  return String(Math.abs(num)).length;
}

function createDivideQuestion(divisorDigits: number, quotientDigits: number): Question {
  while (true) {
    const divisor = createRandomNumber(divisorDigits);
    const quotient = createRandomNumber(quotientDigits);
    const dividend = divisor * quotient;

    if (countDigits(dividend) >= Math.max(divisorDigits, quotientDigits)) {
      return {
        layout: "divide",
        lines: [String(dividend), String(divisor)],
        answer: quotient,
      };
    }
  }
}

export function createQuestion(config: PracticeConfig): Question {
  if (config.mode === "sum") {
    return createSumQuestion(config.digits!, config.linesCount!);
  }

  if (config.mode === "multiply") {
    return createMultiplyQuestion(config.leftDigits!, config.rightDigits!);
  }

  return createDivideQuestion(config.divisorDigits!, config.quotientDigits!);
}

export function createQuestionSet(config: PracticeConfig): Question[] {
  return Array.from({ length: config.count }, () => createQuestion(config));
}

export function formatTime(seconds: number) {
  const safe = Math.max(seconds, 0);
  const m = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const s = (safe % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
