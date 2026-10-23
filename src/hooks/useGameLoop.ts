import { useEffect, useRef } from 'react';

// Calls `callback(dt)` every animation frame. dt is in seconds and capped,
// so the game doesn't jump forward after a lag spike or a hidden tab.
export function useGameLoop(callback: (dt: number) => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      callbackRef.current(dt);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
}
