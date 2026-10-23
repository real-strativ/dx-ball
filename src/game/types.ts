export type Vec = { x: number; y: number };

export type Ball = {
  pos: Vec;
  vel: Vec;
  r: number;
  stuck: boolean;
  stuckOffset: number;
};

export type Paddle = { x: number; y: number; width: number; height: number };

export type BrickKind = 'normal' | 'steel' | 'power';

export type Brick = {
  col: number;
  row: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  kind: BrickKind;
  alive: boolean;
  flash: number;
};

export type EffectType = 'wide' | 'narrow' | 'slow' | 'fire' | 'sticky' | 'laser';
export type PowerUpType = EffectType | 'multi' | 'life';

export type PowerUp = { type: PowerUpType; pos: Vec };
export type Laser = { x: number; y: number; alive: boolean };

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

export type SoundEvent = 'paddle' | 'brick' | 'steel' | 'powerup' | 'lose' | 'win' | 'laser';

export type GameStatus = 'playing' | 'won' | 'lost';

export type GameState = {
  width: number;
  height: number;
  level: number;
  score: number;
  lives: number;
  status: GameStatus;
  balls: Ball[];
  paddle: Paddle;
  bricks: Brick[];
  powerUps: PowerUp[];
  lasers: Laser[];
  particles: Particle[];
  effects: Record<EffectType, number>;
  laserCooldown: number;
  sounds: SoundEvent[];
};

export type InputState = {
  left: boolean;
  right: boolean;
  // pointer position across the board, 0 = left edge, 1 = right edge
  pointerFrac: number | null;
  launch: boolean;
  fireHeld: boolean;
};
