export type ScoreEntry = { name: string; score: number };

export type Progress = {
  unlocked: number;
  highScore: number;
  bestByLevel: Record<number, number>;
  playerName: string;
  topScores: ScoreEntry[];
};

const KEY = 'brick-blaster-progress';
const DEFAULT: Progress = { unlocked: 1, highScore: 0, bestByLevel: {}, playerName: '', topScores: [] };
export const TOP_SCORES = 3;

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

// Inserts a finished run and keeps only the best few.
export function addTopScore(list: ScoreEntry[], entry: ScoreEntry): ScoreEntry[] {
  return [...list, entry].sort((a, b) => b.score - a.score).slice(0, TOP_SCORES);
}
