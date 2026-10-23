// Shared top-3 leaderboard, served by the /api/scores Vercel function.
export type ScoreEntry = { name: string; score: number };

export const TOP_SCORES = 3;

export async function fetchTopScores(): Promise<ScoreEntry[]> {
  const res = await fetch('/api/scores', { cache: 'no-store' });
  if (!res.ok) throw new Error(`leaderboard ${res.status}`);
  return res.json();
}

export async function submitScore(entry: ScoreEntry): Promise<ScoreEntry[]> {
  const res = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(`leaderboard ${res.status}`);
  return res.json();
}
