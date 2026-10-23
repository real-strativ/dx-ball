export type Progress = { unlocked: number; highScore: number; bestByLevel: Record<number, number> };

const KEY = 'brick-blaster-progress';
const DEFAULT: Progress = { unlocked: 1, highScore: 0, bestByLevel: {} };

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {
    return DEFAULT;
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // storage blocked — progress just won't persist
  }
}
