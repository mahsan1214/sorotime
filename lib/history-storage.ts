import type { LevelKey, PracticeType } from "./practice-config";

export const HISTORY_KEY = "sorotime_history";

export type PracticeHistoryItem = {
  id: string;
  playedAt: string;
  levelKey: LevelKey;
  levelLabel: string;
  type: PracticeType;
  typeLabel: string;
  count: number;
  timeLimit: number;
  remainingTime: number;
  correctCount: number;
  percentage: number;
  conditionText: string;
};

export function loadHistory(): PracticeHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const items: PracticeHistoryItem[] = raw ? JSON.parse(raw) : [];
    return items.slice(0, 10);
  } catch {
    return [];
  }
}

export function saveHistory(item: PracticeHistoryItem) {
  if (typeof window === "undefined") return;

  const current = loadHistory();
  const next = [item, ...current].slice(0, 10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}
