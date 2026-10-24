import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// `vite` doesn't run the api/ Vercel functions, so in dev /api/scores is served
// from memory with the same rules as api/scores.ts (resets when the server restarts)
function devScoresApi(): Plugin {
  const TOP_SCORES = 3;
  let scores: { name: string; score: number }[] = [];

  return {
    name: 'dev-scores-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/scores', (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method === 'GET') return send(200, scores);
        if (req.method !== 'POST') return send(405, { error: 'method not allowed' });

        let raw = '';
        req.on('data', (chunk) => (raw += chunk));
        req.on('end', () => {
          let entry: { name?: unknown; score?: unknown };
          try {
            entry = JSON.parse(raw);
          } catch {
            return send(400, { error: 'invalid JSON' });
          }
          const name = typeof entry?.name === 'string' ? entry.name.trim().slice(0, 16) : '';
          const score = entry?.score;
          if (!name || typeof score !== 'number' || !Number.isInteger(score) || score <= 0) {
            return send(400, { error: 'name and a positive whole score are required' });
          }
          scores = [...scores, { name, score }].sort((a, b) => b.score - a.score).slice(0, TOP_SCORES);
          send(200, scores);
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devScoresApi()],
});
