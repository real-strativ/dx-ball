import { useEffect, useState } from 'react';
import MainMenu from './screens/MainMenu';
import LevelSelect from './screens/LevelSelect';
import GameScreen from './screens/GameScreen';
import { LEVELS } from './game/levels';
import { loadProgress, saveProgress, type Progress } from './utils/storage';

type Screen = 'menu' | 'levels' | 'playing';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [level, setLevel] = useState(1);
  const [runId, setRunId] = useState(0);
  const [progress, setProgress] = useState<Progress>(loadProgress);

  useEffect(() => saveProgress(progress), [progress]);

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

  return (
    <main className="app">
      {screen === 'menu' && (
        <MainMenu
          highScore={progress.highScore}
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
        />
      )}
    </main>
  );
}
