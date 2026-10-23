import { useEffect, useRef, type RefObject } from 'react';
import type { InputState } from '../game/types';

// Tracks keyboard, mouse and touch input in a ref (no re-renders).
export function useInput(canvasRef: RefObject<HTMLCanvasElement>) {
  const input = useRef<InputState>({
    left: false,
    right: false,
    pointerFrac: null,
    launch: false,
    fireHeld: false,
  });

  useEffect(() => {
    const state = input.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.right = true;
      if (e.key === ' ') {
        e.preventDefault();
        if (!e.repeat) state.launch = true;
        state.fireHeld = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.right = false;
      if (e.key === ' ') state.fireHeld = false;
    };

    const canvas = canvasRef.current;
    // pointer position as a fraction of the board width (0..1)
    const toFrac = (clientX: number) => {
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return (clientX - rect.left) / rect.width;
    };
    const onPointerMove = (e: PointerEvent) => {
      state.pointerFrac = toFrac(e.clientX);
    };
    const onPointerDown = (e: PointerEvent) => {
      state.pointerFrac = toFrac(e.clientX);
      state.launch = true;
      state.fireHeld = true;
    };
    const onPointerUp = () => {
      state.fireHeld = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointerup', onPointerUp);
    canvas?.addEventListener('pointermove', onPointerMove);
    canvas?.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerup', onPointerUp);
      canvas?.removeEventListener('pointermove', onPointerMove);
      canvas?.removeEventListener('pointerdown', onPointerDown);
    };
  }, [canvasRef]);

  return input;
}
