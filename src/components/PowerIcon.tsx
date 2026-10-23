import { useEffect, useRef } from 'react';
import { drawPowerIcon } from '../game/icons';
import type { PowerUpType } from '../game/types';

// The same icon as the falling capsules, for use in the HUD and menu.
export default function PowerIcon({ type, size = 16, color = '#0b0f24' }: { type: PowerUpType; size?: number; color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    drawPowerIcon(ctx, type, size / 2, size / 2, size, color);
  }, [type, size, color]);

  return <canvas ref={ref} style={{ width: size, height: size, display: 'block' }} aria-hidden="true" />;
}
