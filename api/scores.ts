// Shared top-3 leaderboard for every player, stored in Upstash Redis.
// Vercel functions can't write files that last, so the scores live in a Redis
// sorted set: score = points, member = "<unique id>:<player name>".
import { Redis } from '@upstash/redis';

const KEY = 'leaderboard';
const TOP_SCORES = 3;
const MAX_NAME = 16;
const MAX_SCORE = 10_000_000;

// the Vercel Marketplace integration sets the KV_* names, a manual Upstash setup the UPSTASH_* ones
const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '',
  token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  automaticDeserialization: false,
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function topScores() {
  const flat = await redis.zrange<string[]>(KEY, 0, TOP_SCORES - 1, { rev: true, withScores: true });
  const list = [];
  for (let i = 0; i < flat.length; i += 2) {
    const member = String(flat[i]);
    list.push({ name: member.slice(member.indexOf(':') + 1), score: Number(flat[i + 1]) });
  }
  return list;
}

export async function GET() {
  return json(200, await topScores());
}

export async function POST(request: Request) {
  let entry: { name?: unknown; score?: unknown };
  try {
    entry = await request.json();
  } catch {
    return json(400, { error: 'invalid JSON' });
  }
  const name = typeof entry?.name === 'string' ? entry.name.trim().slice(0, MAX_NAME) : '';
  const score = entry?.score;
  if (!name || typeof score !== 'number' || !Number.isInteger(score) || score <= 0 || score > MAX_SCORE) {
    return json(400, { error: 'name and a positive whole score are required' });
  }

  // add the run, then drop everything below the top few (lowest ranks first)
  await redis
    .multi()
    .zadd(KEY, { score, member: `${crypto.randomUUID()}:${name}` })
    .zremrangebyrank(KEY, 0, -(TOP_SCORES + 1))
    .exec();
  return json(200, await topScores());
}
