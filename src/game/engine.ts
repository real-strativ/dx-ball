import {
  BASE_W, BASE_H, COLS, BRICK_GAP, BRICK_TOP, SIDE_MARGIN, MIN_BRICK_H, MAX_BRICK_H,
  PADDLE_W, PADDLE_H, PADDLE_BOTTOM, PADDLE_SPEED, BALL_R, BASE_SPEED, SPEED_PER_LEVEL,
  MAX_BOUNCE, MAX_BALLS, POWERUP_FALL, POWERUP_W, POWERUP_H, DROP_CHANCE,
  LASER_SPEED, LASER_COOLDOWN, START_LIVES, MAX_LIVES, EFFECT_DURATION,
  POWERUP_WEIGHTS, COLORS, BRICK_ROW_COLORS,
} from './constants';
import { LEVELS } from './levels';
import type {
  Ball, Brick, BrickKind, EffectType, GameState, InputState, Paddle, PowerUpType, Vec,
} from './types';

export const EFFECTS: EffectType[] = ['wide', 'narrow', 'slow', 'fire', 'sticky', 'laser'];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// ---------- creation ----------

export function createBricks(level: number): Brick[] {
  const grid = LEVELS[(level - 1) % LEVELS.length].grid;
  const bricks: Brick[] = [];
  grid.forEach((row, r) => {
    for (let c = 0; c < COLS; c++) {
      const ch = row[c] ?? '.';
      if (ch === '.') continue;
      let kind: BrickKind = 'normal';
      let hp = 1;
      if (ch === 'S') {
        kind = 'steel';
        hp = Infinity;
      } else if (ch === 'P') {
        kind = 'power';
      } else {
        hp = Number(ch) || 1;
      }
      bricks.push({
        col: c,
        row: r,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        hp,
        maxHp: hp,
        kind,
        alive: true,
        flash: 0,
      });
    }
  });
  return bricks;
}

// Bricks stretch to fill the width of the field.
export function layoutBricks(s: GameState) {
  const usable = s.width - SIDE_MARGIN * 2;
  const bw = (usable - (COLS - 1) * BRICK_GAP) / COLS;
  const bh = clamp(bw * 0.38, MIN_BRICK_H, MAX_BRICK_H);
  for (const b of s.bricks) {
    b.x = SIDE_MARGIN + b.col * (bw + BRICK_GAP);
    b.y = BRICK_TOP + b.row * (bh + BRICK_GAP);
    b.w = bw;
    b.h = bh;
  }
}

function basePaddleWidth(s: GameState) {
  return PADDLE_W * clamp(s.width / BASE_W, 1, 1.5);
}

function createStuckBall(p: Paddle): Ball {
  return {
    pos: { x: p.x + p.width / 2, y: p.y - BALL_R },
    vel: { x: 0, y: 0 },
    r: BALL_R,
    stuck: true,
    stuckOffset: p.width / 2,
  };
}

function noEffects(): Record<EffectType, number> {
  return { wide: 0, narrow: 0, slow: 0, fire: 0, sticky: 0, laser: 0 };
}

export function createGame(
  level: number,
  score = 0,
  lives = START_LIVES,
  width = BASE_W,
  height = BASE_H,
): GameState {
  const paddle: Paddle = { x: width / 2 - PADDLE_W / 2, y: height - PADDLE_BOTTOM, width: PADDLE_W, height: PADDLE_H };
  const s: GameState = {
    width,
    height,
    level,
    score,
    lives,
    status: 'playing',
    balls: [createStuckBall(paddle)],
    paddle,
    bricks: createBricks(level),
    powerUps: [],
    lasers: [],
    particles: [],
    effects: noEffects(),
    laserCooldown: 0,
    sounds: [],
  };
  paddle.width = basePaddleWidth(s);
  paddle.x = width / 2 - paddle.width / 2;
  s.balls = [createStuckBall(paddle)];
  layoutBricks(s);
  return s;
}

// Called when the screen size changes: everything keeps its relative position.
export function resizeGame(s: GameState, width: number, height: number) {
  if (width === s.width && height === s.height) return;
  const fx = width / s.width;
  const fy = height / s.height;
  s.width = width;
  s.height = height;
  layoutBricks(s);
  s.paddle.y = height - PADDLE_BOTTOM;
  s.paddle.x = clamp(s.paddle.x * fx, 0, width - s.paddle.width);
  for (const b of s.balls) { b.pos.x *= fx; b.pos.y *= fy; }
  for (const pu of s.powerUps) { pu.pos.x *= fx; pu.pos.y *= fy; }
  for (const l of s.lasers) { l.x *= fx; l.y *= fy; }
  for (const pt of s.particles) { pt.x *= fx; pt.y *= fy; }
}

// ---------- helpers ----------

function ballSpeed(s: GameState): number {
  const base = BASE_SPEED + (s.level - 1) * SPEED_PER_LEVEL;
  return base * (s.effects.slow > 0 ? 0.7 : 1);
}

// Keep a constant speed and stop the ball from flying almost horizontally forever.
function normalizeVelocity(b: Ball, speed: number) {
  const len = Math.hypot(b.vel.x, b.vel.y) || 1;
  b.vel.x = (b.vel.x / len) * speed;
  b.vel.y = (b.vel.y / len) * speed;
  const minY = speed * 0.3;
  if (Math.abs(b.vel.y) < minY) {
    b.vel.y = (b.vel.y < 0 ? -1 : 1) * minY;
    b.vel.x = (b.vel.x < 0 ? -1 : 1) * Math.sqrt(speed * speed - minY * minY);
  }
}

function launchBall(b: Ball, p: Paddle, speed: number) {
  let hit = clamp((b.pos.x - (p.x + p.width / 2)) / (p.width / 2), -1, 1);
  if (Math.abs(hit) < 0.1) hit = (Math.random() - 0.5) * 0.4;
  const angle = hit * MAX_BOUNCE;
  b.vel = { x: Math.sin(angle) * speed, y: -Math.cos(angle) * speed };
  b.stuck = false;
}

function rotate(v: Vec, a: number): Vec {
  return { x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) };
}

function randomPowerUp(): PowerUpType {
  const total = POWERUP_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [type, w] of POWERUP_WEIGHTS) {
    roll -= w;
    if (roll <= 0) return type;
  }
  return 'wide';
}

export function brickColor(b: Brick): string {
  if (b.kind === 'steel') return COLORS.steel;
  return BRICK_ROW_COLORS[b.row % BRICK_ROW_COLORS.length];
}

function spawnParticles(s: GameState, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 180;
    const life = 0.4 + Math.random() * 0.4;
    s.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 60,
      life, maxLife: life, color,
      size: 2 + Math.random() * 3,
    });
  }
}

function damageBrick(s: GameState, b: Brick, destroy: boolean) {
  b.flash = 0.12;
  if (b.kind === 'steel') {
    s.sounds.push('steel');
    return;
  }
  b.hp -= destroy ? b.hp : 1;
  s.sounds.push('brick');
  if (b.hp > 0) {
    s.score += 10;
    return;
  }
  b.alive = false;
  s.score += b.kind === 'power' ? 100 : 50 * b.maxHp;
  spawnParticles(s, b.x + b.w / 2, b.y + b.h / 2, brickColor(b), 14);
  if (b.kind === 'power' || Math.random() < DROP_CHANCE) {
    s.powerUps.push({ type: randomPowerUp(), pos: { x: b.x + b.w / 2, y: b.y + b.h / 2 } });
  }
}

function applyPowerUp(s: GameState, type: PowerUpType) {
  s.score += 25;
  s.sounds.push('powerup');
  switch (type) {
    case 'wide':
      s.effects.wide = EFFECT_DURATION.wide;
      s.effects.narrow = 0;
      break;
    case 'narrow':
      s.effects.narrow = EFFECT_DURATION.narrow;
      s.effects.wide = 0;
      break;
    case 'slow':
    case 'fire':
    case 'sticky':
    case 'laser':
      s.effects[type] = EFFECT_DURATION[type];
      break;
    case 'life':
      s.lives = Math.min(s.lives + 1, MAX_LIVES);
      break;
    case 'multi': {
      const speed = ballSpeed(s);
      const src = s.balls.find((b) => !b.stuck) ?? s.balls[0];
      if (!src) break;
      if (src.stuck) launchBall(src, s.paddle, speed);
      for (const a of [-0.4, 0.4]) {
        if (s.balls.length >= MAX_BALLS) break;
        s.balls.push({ ...src, pos: { ...src.pos }, vel: rotate(src.vel, a), stuck: false });
      }
      break;
    }
    default: {
      const unhandled: never = type;
      throw new Error(`Unhandled power-up: ${unhandled}`);
    }
  }
}

function loseLife(s: GameState) {
  s.lives -= 1;
  s.sounds.push('lose');
  if (s.lives <= 0) {
    s.status = 'lost';
    return;
  }
  s.effects = noEffects();
  s.powerUps = [];
  s.lasers = [];
  s.paddle.width = basePaddleWidth(s);
  s.balls = [createStuckBall(s.paddle)];
}

// Moves a ball one small step. Returns true if the ball should stop moving this frame.
function stepBall(s: GameState, b: Ball, dt: number): boolean {
  const px = b.pos.x;
  const py = b.pos.y;
  b.pos.x += b.vel.x * dt;
  b.pos.y += b.vel.y * dt;

  // walls
  if (b.pos.x - b.r < 0) { b.pos.x = b.r; b.vel.x = Math.abs(b.vel.x); }
  if (b.pos.x + b.r > s.width) { b.pos.x = s.width - b.r; b.vel.x = -Math.abs(b.vel.x); }
  if (b.pos.y - b.r < 0) { b.pos.y = b.r; b.vel.y = Math.abs(b.vel.y); }
  if (b.pos.y - b.r > s.height) return true;

  // paddle: where the ball lands decides the bounce angle
  const p = s.paddle;
  if (
    b.vel.y > 0 &&
    b.pos.y + b.r >= p.y &&
    py + b.r <= p.y + 2 &&
    b.pos.x >= p.x - b.r &&
    b.pos.x <= p.x + p.width + b.r
  ) {
    b.pos.y = p.y - b.r;
    s.sounds.push('paddle');
    if (s.effects.sticky > 0) {
      b.stuck = true;
      b.stuckOffset = b.pos.x - p.x;
      b.vel = { x: 0, y: 0 };
      return true;
    }
    const speed = Math.hypot(b.vel.x, b.vel.y);
    const hit = clamp((b.pos.x - (p.x + p.width / 2)) / (p.width / 2), -1, 1);
    const angle = hit * MAX_BOUNCE;
    b.vel.x = Math.sin(angle) * speed;
    b.vel.y = -Math.cos(angle) * speed;
    return false;
  }

  // bricks: at most one hit per step
  for (const br of s.bricks) {
    if (!br.alive) continue;
    const cx = clamp(b.pos.x, br.x, br.x + br.w);
    const cy = clamp(b.pos.y, br.y, br.y + br.h);
    const dx = b.pos.x - cx;
    const dy = b.pos.y - cy;
    if (dx * dx + dy * dy > b.r * b.r) continue;

    const passThrough = s.effects.fire > 0 && br.kind !== 'steel';
    if (!passThrough) {
      const fromSide = px + b.r <= br.x || px - b.r >= br.x + br.w;
      const fromTopOrBottom = py + b.r <= br.y || py - b.r >= br.y + br.h;
      b.pos.x = px;
      b.pos.y = py;
      if (fromSide && !fromTopOrBottom) b.vel.x = -b.vel.x;
      else if (fromSide && fromTopOrBottom) { b.vel.x = -b.vel.x; b.vel.y = -b.vel.y; }
      else b.vel.y = -b.vel.y;
    }
    damageBrick(s, br, passThrough);
    break;
  }
  return false;
}

// ---------- main update ----------

export function update(s: GameState, dt: number, input: InputState) {
  if (s.status !== 'playing') return;

  for (const k of EFFECTS) if (s.effects[k] > 0) s.effects[k] = Math.max(0, s.effects[k] - dt);

  // paddle size eases toward its target
  const p = s.paddle;
  const targetW = basePaddleWidth(s) * (s.effects.wide > 0 ? 1.5 : 1) * (s.effects.narrow > 0 ? 0.65 : 1);
  const center = p.x + p.width / 2;
  const oldWidth = p.width;
  p.width += (targetW - p.width) * Math.min(1, dt * 10);
  p.x = center - p.width / 2;
  // a ball resting on the paddle keeps its relative spot as the paddle resizes
  for (const b of s.balls) if (b.stuck) b.stuckOffset *= p.width / oldWidth;

  // paddle movement: keyboard overrides mouse until the mouse moves again
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) {
    input.pointerFrac = null;
    p.x += dir * PADDLE_SPEED * dt;
  } else if (input.pointerFrac !== null) {
    p.x = input.pointerFrac * s.width - p.width / 2;
  }
  p.x = clamp(p.x, 0, s.width - p.width);

  const speed = ballSpeed(s);
  if (input.launch) {
    for (const b of s.balls) if (b.stuck) launchBall(b, p, speed);
    input.launch = false;
  }

  // lasers
  s.laserCooldown = Math.max(0, s.laserCooldown - dt);
  if (s.effects.laser > 0 && input.fireHeld && s.laserCooldown === 0) {
    s.lasers.push({ x: p.x + 6, y: p.y, alive: true }, { x: p.x + p.width - 6, y: p.y, alive: true });
    s.laserCooldown = LASER_COOLDOWN;
    s.sounds.push('laser');
  }
  for (const l of s.lasers) {
    l.y -= LASER_SPEED * dt;
    if (l.y < 0) l.alive = false;
    for (const br of s.bricks) {
      if (!l.alive) break;
      if (br.alive && l.x >= br.x && l.x <= br.x + br.w && l.y >= br.y && l.y <= br.y + br.h) {
        damageBrick(s, br, false);
        l.alive = false;
      }
    }
  }
  s.lasers = s.lasers.filter((l) => l.alive);

  // balls, moved in small steps so fast balls never skip through bricks
  for (const b of s.balls) {
    if (b.stuck) {
      b.stuckOffset = clamp(b.stuckOffset, b.r, p.width - b.r);
      b.pos.x = p.x + b.stuckOffset;
      b.pos.y = p.y - b.r;
      continue;
    }
    normalizeVelocity(b, speed);
    const steps = Math.max(1, Math.ceil((speed * dt) / (b.r * 0.75)));
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) if (stepBall(s, b, sdt)) break;
  }
  s.balls = s.balls.filter((b) => b.pos.y - b.r <= s.height);
  if (s.balls.length === 0) loseLife(s);
  if (s.status !== 'playing') return;

  // falling power-ups
  for (const pu of s.powerUps) pu.pos.y += POWERUP_FALL * dt;
  s.powerUps = s.powerUps.filter((pu) => {
    const caught =
      pu.pos.y + POWERUP_H / 2 >= p.y &&
      pu.pos.y - POWERUP_H / 2 <= p.y + p.height &&
      pu.pos.x + POWERUP_W / 2 >= p.x &&
      pu.pos.x - POWERUP_W / 2 <= p.x + p.width;
    if (caught) applyPowerUp(s, pu.type);
    return !caught && pu.pos.y - POWERUP_H < s.height;
  });

  // particles and brick flashes
  for (const pt of s.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 420 * dt;
    pt.life -= dt;
  }
  s.particles = s.particles.filter((pt) => pt.life > 0);
  for (const br of s.bricks) if (br.flash > 0) br.flash = Math.max(0, br.flash - dt);

  if (!s.bricks.some((b) => b.alive && b.kind !== 'steel')) {
    s.status = 'won';
    s.sounds.push('win');
  }
}
