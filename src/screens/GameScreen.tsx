import { useCallback, useEffect, useRef, useState } from 'react';
import HUD, { type HudData } from '../components/HUD';
import { BASE_H, BASE_W, MAX_ASPECT, MIN_ASPECT } from '../game/constants';
import { createGame, resizeGame, update, EFFECTS } from '../game/engine';
import { draw } from '../game/renderer';
import { LEVELS } from '../game/levels';
import type { GameState, GameStatus } from '../game/types';
import { useGameLoop } from '../hooks/useGameLoop';
import { useInput } from '../hooks/useInput';
import { playSound, setMuted } from '../utils/sound';

type Props = {
  startLevel: number;
  onExit: () => void;
  onLevelCleared: (level: number, score: number) => void;
  onScore: (score: number) => void;
};

// Picks a play field that matches the shape of the available space:
// wide screens get a wider field, tall phones get a taller one.
function fitBoard(availW: number, availH: number) {
  const aspect = Math.min(Math.max(availW / availH, MIN_ASPECT), MAX_ASPECT);
  const width = aspect >= BASE_W / BASE_H ? Math.round(BASE_H * aspect) : BASE_W;
  const height = aspect >= BASE_W / BASE_H ? BASE_H : Math.round(BASE_W / aspect);
  const scale = Math.min(availW / width, availH / height);
  return { width, height, cssW: Math.floor(width * scale), cssH: Math.floor(height * scale) };
}

function readHud(g: GameState): HudData {
  return {
    score: g.score,
    lives: g.lives,
    level: g.level,
    levelName: LEVELS[(g.level - 1) % LEVELS.length].name,
    effects: EFFECTS.filter((e) => g.effects[e] > 0).map((e) => ({ type: e, seconds: Math.ceil(g.effects[e]) })),
  };
}

export default function GameScreen({ startLevel, onExit, onLevelCleared, onScore }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameState>(createGame(startLevel));
  const boardRef = useRef({ width: BASE_W, height: BASE_H });
  const input = useInput(canvasRef);

  const [hud, setHud] = useState<HudData>(() => readHud(gameRef.current));
  const hudKey = useRef('');
  const [status, setStatus] = useState<GameStatus>('playing');
  const statusRef = useRef<GameStatus>('playing');
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [muted, setMutedState] = useState(false);

  // Full screen: use the browser's Fullscreen API, and fall back to filling the
  // window when it isn't available (iPhone Safari, embedded frames).
  const sectionRef = useRef<HTMLElement>(null);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [windowFullscreen, setWindowFullscreen] = useState(false);
  const isFullscreen = nativeFullscreen || windowFullscreen;

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    if (windowFullscreen) {
      setWindowFullscreen(false);
      return;
    }
    const el = sectionRef.current;
    if (el && document.fullscreenEnabled && el.requestFullscreen) {
      el.requestFullscreen().catch(() => setWindowFullscreen(true));
    } else {
      setWindowFullscreen(true);
    }
  }, [windowFullscreen]);

  const toggleFullscreenRef = useRef(toggleFullscreen);
  const windowFullscreenRef = useRef(windowFullscreen);
  useEffect(() => {
    toggleFullscreenRef.current = toggleFullscreen;
    windowFullscreenRef.current = windowFullscreen;
  }, [toggleFullscreen, windowFullscreen]);

  useEffect(() => {
    const onChange = () => setNativeFullscreen(document.fullscreenElement === sectionRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  // stop the page behind from scrolling while the game fills the window
  useEffect(() => {
    if (!windowFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [windowFullscreen]);

  // keep callbacks from props in refs so the game loop never goes stale
  const callbacks = useRef({ onLevelCleared, onScore });
  useEffect(() => {
    callbacks.current = { onLevelCleared, onScore };
  }, [onLevelCleared, onScore]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => setMuted(muted), [muted]);

  // Resize the board to fill the stage, and render at the screen's real pixel
  // density (devicePixelRatio) so it stays sharp on retina and in full screen.
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const fit = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      const b = fitBoard(rect.width, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.style.width = `${b.cssW}px`;
      canvas.style.height = `${b.cssH}px`;
      canvas.width = Math.round(b.cssW * dpr);
      canvas.height = Math.round(b.cssH * dpr);
      boardRef.current = { width: b.width, height: b.height };
      resizeGame(gameRef.current, b.width, b.height);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    window.addEventListener('resize', fit);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);

  // P / Escape toggles pause; switching tabs pauses automatically
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'f' || e.key === 'F') && !e.repeat) {
        toggleFullscreenRef.current();
        return;
      }
      if (e.key === 'Escape' && windowFullscreenRef.current) {
        setWindowFullscreen(false);
        return;
      }
      if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && statusRef.current === 'playing') {
        setPaused((v) => !v);
      }
    };
    const onHide = () => {
      if (document.hidden && statusRef.current === 'playing') setPaused(true);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  useGameLoop(
    useCallback(
      (dt: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const g = gameRef.current;

        if (pausedRef.current) {
          input.current.launch = false;
        } else {
          update(g, dt, input.current);
        }

        // play each kind of sound at most once per frame
        for (const s of new Set(g.sounds)) playSound(s);
        g.sounds.length = 0;

        // map play-field units onto real screen pixels
        const scale = canvas.width / g.width;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.imageSmoothingEnabled = true;
        draw(ctx, g);

        // only re-render React when something visible in the HUD changed
        const next = readHud(g);
        const key = JSON.stringify(next);
        if (key !== hudKey.current) {
          hudKey.current = key;
          setHud(next);
        }

        if (g.status !== statusRef.current) {
          statusRef.current = g.status;
          setStatus(g.status);
          if (g.status === 'won') callbacks.current.onLevelCleared(g.level, g.score);
          callbacks.current.onScore(g.score);
        }
      },
      [input],
    ),
  );

  const startFresh = (level: number, score: number, lives?: number) => {
    const { width, height } = boardRef.current;
    gameRef.current = createGame(level, score, lives, width, height);
    input.current.launch = false;
    statusRef.current = 'playing';
    setStatus('playing');
    setPaused(false);
  };

  const g = gameRef.current;
  const isLastLevel = g.level >= LEVELS.length;

  return (
    <section ref={sectionRef} className={isFullscreen ? 'game is-fullscreen' : 'game'}>
      <HUD
        {...hud}
        muted={muted}
        fullscreen={isFullscreen}
        onToggleMute={() => setMutedState((m) => !m)}
        onToggleFullscreen={toggleFullscreen}
        onPause={() => status === 'playing' && setPaused(true)}
      />

      <div className="stage" ref={stageRef}>
        <canvas ref={canvasRef} className="stage__canvas" />

        {paused && status === 'playing' && (
          <div className="overlay">
            <div className="overlay__card">
              <h2>Paused</h2>
              <div className="overlay__actions">
                <button className="btn btn--primary" onClick={() => setPaused(false)} autoFocus>
                  Resume
                </button>
                <button className="btn" onClick={() => startFresh(g.level, 0)}>
                  Restart level
                </button>
                <button className="btn" onClick={onExit}>
                  Quit to menu
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'won' && (
          <div className="overlay">
            <div className="overlay__card">
              <h2>{isLastLevel ? 'You cleared every level' : 'Level cleared'}</h2>
              <p className="overlay__score">Score {g.score.toLocaleString()}</p>
              <div className="overlay__actions">
                {isLastLevel ? (
                  <button className="btn btn--primary" onClick={() => startFresh(1, 0)} autoFocus>
                    Play again
                  </button>
                ) : (
                  <button className="btn btn--primary" onClick={() => startFresh(g.level + 1, g.score, g.lives)} autoFocus>
                    Next level
                  </button>
                )}
                <button className="btn" onClick={onExit}>
                  Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'lost' && (
          <div className="overlay">
            <div className="overlay__card">
              <h2>Game over</h2>
              <p className="overlay__score">Score {g.score.toLocaleString()}</p>
              <div className="overlay__actions">
                <button className="btn btn--primary" onClick={() => startFresh(g.level, 0)} autoFocus>
                  Try again
                </button>
                <button className="btn" onClick={onExit}>
                  Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
