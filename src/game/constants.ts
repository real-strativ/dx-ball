import type { EffectType, PowerUpType } from './types';

// Base play field. The real field grows wider (or taller) to fill the screen.
export const BASE_W = 800;
export const BASE_H = 600;
export const MAX_ASPECT = 2.2;
export const MIN_ASPECT = 0.5;

export const COLS = 12;
export const BRICK_GAP = 4;
export const BRICK_TOP = 60;
export const SIDE_MARGIN = 30;
export const MIN_BRICK_H = 22;
export const MAX_BRICK_H = 30;

export const PADDLE_W = 110;
export const PADDLE_H = 14;
export const PADDLE_BOTTOM = 46;
export const PADDLE_SPEED = 720;

export const BALL_R = 7;
export const BASE_SPEED = 360;
export const SPEED_PER_LEVEL = 16;
export const MAX_BOUNCE = (60 * Math.PI) / 180;
export const MAX_BALLS = 12;

export const POWERUP_FALL = 150;
export const POWERUP_W = 46;
export const POWERUP_H = 22;
export const DROP_CHANCE = 0.14;

export const LASER_SPEED = 640;
export const LASER_COOLDOWN = 0.28;

export const START_LIVES = 3;
export const MAX_LIVES = 9;

export const EFFECT_DURATION: Record<EffectType, number> = {
  wide: 14,
  narrow: 10,
  slow: 10,
  fire: 8,
  sticky: 12,
  laser: 10,
};

export const EFFECT_LABEL: Record<EffectType, string> = {
  wide: 'Wide paddle',
  narrow: 'Small paddle',
  slow: 'Slow ball',
  fire: 'Fireball',
  sticky: 'Sticky',
  laser: 'Laser',
};

export const POWERUP_STYLE: Record<PowerUpType, { color: string; label: string }> = {
  wide: { color: '#3fc1a0', label: 'Wide paddle' },
  narrow: { color: '#e5484d', label: 'Small paddle' },
  slow: { color: '#5b8def', label: 'Slow ball' },
  fire: { color: '#ff7a1a', label: 'Fireball' },
  sticky: { color: '#b07cf0', label: 'Sticky paddle' },
  laser: { color: '#ff4f8b', label: 'Laser' },
  multi: { color: '#f2b134', label: 'Multi-ball' },
  life: { color: '#f5f5f5', label: 'Extra life' },
};

export const POWERUP_WEIGHTS: [PowerUpType, number][] = [
  ['wide', 18],
  ['multi', 16],
  ['slow', 12],
  ['fire', 8],
  ['sticky', 10],
  ['laser', 10],
  ['narrow', 12],
  ['life', 4],
];

// Bricks are colored by row, like the classic game. Saturated enough to be
// lively, but kept mid-bright so large walls of bricks don't glare.
export const BRICK_ROW_COLORS = [
  '#d6434f', // red
  '#e5763a', // orange
  '#dda22e', // amber
  '#7cb342', // green
  '#2eaa8c', // teal
  '#2f97c6', // cyan
  '#4f72e0', // blue
  '#8a5edc', // violet
  '#cc4d92', // magenta
];

export const COLORS = {
  bg: '#0b1030',
  steel: '#8a93a6',
  paddle: '#c9d1dc',
  paddleEnd: '#5b8def',
  ball: '#ffffff',
  fire: '#ff7a1a',
  laser: '#ff4f8b',
  text: '#e8ecf5',
};
