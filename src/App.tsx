import { useEffect, useState } from 'react';
import MainMenu from './screens/MainMenu';
import LevelSelect from './screens/LevelSelect';
import GameScreen from './screens/GameScreen';
import { LEVELS } from './game/levels';
import { loadProgress, saveProgress, type Progress } from './utils/storage';
import { fetchTopScores, submitScore, type ScoreEntry } from './utils/leaderboard';

type Screen = 'menu' | 'levels' | 'playing';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [level, setLevel] = useState(1);
  const [runId, setRunId] = useState(0);
  const [progress, setProgress] = useState<Progress>(loadProgress);

  // null = still loading or the leaderboard can't be reached
  const [topScores, setTopScores] = useState<ScoreEntry[] | null>(null);

  useEffect(() => saveProgress(progress), [progress]);

  // refresh the shared leaderboard every time the menu opens
  useEffect(() => {
    if (screen !== 'menu') return;
    let live = true;
    fetchTopScores()
      .then((list) => live && setTopScores(list))
      .catch(() => live && setTopScores(null));
    return () => {
      live = false;
    };
  }, [screen]);

  const startLevel = (n: number) => {
    setLevel(n);
    setRunId((id) => id + 1);
    setScreen('playing');
  };

  const handleLevelCleared = (n: number, score: number) =>
    setProgress((p) => ({
      ...p,
      unlocked: Math.max(p.unlocked, Math.min(n + 1, LEVELS.length)),
      bestByLevel: { ...p.bestByLevel, [n]: Math.max(p.bestByLevel[n] ?? 0, score) },
    }));

  const handleScore = (score: number) =>
    setProgress((p) => (score > p.highScore ? { ...p, highScore: score } : p));

  // a run is over (game over, last level cleared, restart or quit): rank it
  const handleRunOver = (score: number) => {
    if (score <= 0) return;
    submitScore({ name: progress.playerName.trim(), score })
      .then(setTopScores)
      .catch(() => {
        // leaderboard unreachable: the run just isn't ranked
      });
  };

  return (
    <main className="app">
      {screen === 'menu' && (
        <MainMenu
          topScores={topScores}
          playerName={progress.playerName}
          onNameChange={(playerName) => setProgress((p) => ({ ...p, playerName }))}
          unlocked={progress.unlocked}
          onPlay={() => startLevel(1)}
          onContinue={() => startLevel(progress.unlocked)}
          onLevels={() => setScreen('levels')}
        />
      )}
      {screen === 'levels' && (
        <LevelSelect
          unlocked={progress.unlocked}
          bestByLevel={progress.bestByLevel}
          onPick={startLevel}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'playing' && (
        <GameScreen
          key={runId}
          startLevel={level}
          onExit={() => setScreen('menu')}
          onLevelCleared={handleLevelCleared}
          onScore={handleScore}
          onRunOver={handleRunOver}
        />
      )}
    </main>
  );
}
