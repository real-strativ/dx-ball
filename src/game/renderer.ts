import { COLORS, POWERUP_STYLE, POWERUP_W, POWERUP_H } from './constants';
import { drawPowerIcon } from './icons';
import { brickColor } from './engine';
import type { Brick, GameState } from './types';

// A fixed starfield, generated once. Positions are 0..1 so it fits any field size.
const STARS = Array.from({ length: 160 }, (_, i) => {
  const rand = (n: number) => {
    const x = Math.sin(i * 97.13 + n * 13.7) * 10000;
    return x - Math.floor(x);
  };
  return { x: rand(1), y: rand(2), size: rand(3) < 0.85 ? 1 : 2, alpha: 0.25 + rand(4) * 0.6 };
});

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Small deterministic random generator, so each brick keeps the same crack shape every frame.
function seeded(seed: number) {
  let v = seed % 2147483647;
  if (v <= 0) v += 2147483646;
  return () => {
    v = (v * 16807) % 2147483647;
    return (v - 1) / 2147483646;
  };
}

// Shattered-glass cracks spreading from an impact point. More damage = more cracks.
function drawCracks(ctx: CanvasRenderingContext2D, b: Brick) {
  const damage = b.maxHp - b.hp;
  const rnd = seeded(Math.floor(b.x * 31 + b.y * 17) + 7);
  const inset = 2;
  const minX = b.x + inset, maxX = b.x + b.w - inset;
  const minY = b.y + inset, maxY = b.y + b.h - inset;
  const cx = b.x + b.w * (0.3 + rnd() * 0.4);
  const cy = b.y + b.h * (0.35 + rnd() * 0.3);
  const arms = damage >= 2 ? 7 : 4;

  ctx.save();
  ctx.beginPath();
  ctx.rect(minX, minY, maxX - minX, maxY - minY);
  ctx.clip();

  if (damage >= 2) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }

  const path = new Path2D();
  for (let i = 0; i < arms; i++) {
    let angle = (i / arms) * Math.PI * 2 + rnd() * 0.7;
    let x = cx, y = cy;
    path.moveTo(x, y);
    const segments = 3 + Math.floor(rnd() * 2);
    for (let sgm = 0; sgm < segments; sgm++) {
      angle += (rnd() - 0.5) * 0.9;
      const len = 5 + rnd() * 9;
      x += Math.cos(angle) * len;
      y += Math.sin(angle) * len * 0.6;
      path.lineTo(x, y);
      // occasional small side branch
      if (rnd() < 0.3) {
        const ba = angle + (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.5);
        path.lineTo(x + Math.cos(ba) * 5, y + Math.sin(ba) * 3);
        path.moveTo(x, y);
      }
      if (x < minX || x > maxX || y < minY || y > maxY) break;
    }
  }

  // light edge underneath, dark crack on top, gives the crack a little depth
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.translate(0.8, 0.8);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.stroke(path);
  ctx.translate(-0.8, -0.8);
  ctx.strokeStyle = 'rgba(10,8,30,0.6)';
  ctx.lineWidth = damage >= 2 ? 1.4 : 1.1;
  ctx.stroke(path);

  // impact dent
  ctx.fillStyle = 'rgba(10,8,30,0.45)';
  ctx.beginPath();
  ctx.arc(cx, cy, damage >= 2 ? 2.2 : 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // a chipped corner on badly damaged bricks
  if (damage >= 2) {
    const right = rnd() < 0.5;
    const ex = right ? b.x + b.w : b.x;
    const dir = right ? -1 : 1;
    ctx.fillStyle = COLORS.bg;
    ctx.beginPath();
    ctx.moveTo(ex, b.y);
    ctx.lineTo(ex + dir * (6 + rnd() * 4), b.y);
    ctx.lineTo(ex + dir * 2, b.y + 5 + rnd() * 3);
    ctx.lineTo(ex, b.y + 4);
    ctx.closePath();
    ctx.fill();
  }
}

// Mix a hex color toward white (amount > 0) or black (amount < 0).
const shadeCache = new Map<string, string>();
function shade(hex: string, amount: number): string {
  const key = hex + amount;
  const cached = shadeCache.get(key);
  if (cached) return cached;
  const n = parseInt(hex.slice(1), 16);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * t);
  const out = `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
  shadeCache.set(key, out);
  return out;
}

function rivet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.42;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function drawBrick(ctx: CanvasRenderingContext2D, b: Brick, k: number) {
  // Snap edges to whole screen pixels so they're crisp, not smeared.
  const snap = (v: number) => Math.round(v * k) / k;
  const x = snap(b.x);
  const y = snap(b.y);
  const w = snap(b.x + b.w) - x;
  const h = snap(b.y + b.h) - y;
  const base = brickColor(b);
  const radius = 3;

  // body: lit from above, darker toward the bottom
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, shade(base, 0.22));
  grad.addColorStop(0.45, base);
  grad.addColorStop(1, shade(base, -0.3));
  roundRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = grad;
  ctx.fill();

  // glossy highlight on the top half
  roundRect(ctx, x + 2, y + 2, w - 4, h * 0.38, radius - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fill();

  if (b.kind === 'steel') {
    // brushed-metal sheen and bolts
    ctx.save();
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.55, y);
    ctx.lineTo(x + w * 0.7, y);
    ctx.lineTo(x + w * 0.55, y + h);
    ctx.lineTo(x + w * 0.4, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    const r = Math.max(1.8, h * 0.1);
    rivet(ctx, x + 6, y + h / 2, r);
    rivet(ctx, x + w - 6, y + h / 2, r);
  } else if (b.maxHp === 2) {
    // reinforced: an inner frame
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x + 4.5, y + 4.5, w - 9, h - 9, 2);
    ctx.stroke();
  } else if (b.maxHp >= 3) {
    // armored: dark inner frame plus corner rivets
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 2);
    ctx.stroke();
    const r = Math.max(1.5, h * 0.08);
    for (const [rx, ry] of [[x + 4, y + 4], [x + w - 4, y + 4], [x + 4, y + h - 4], [x + w - 4, y + h - 4]]) {
      rivet(ctx, rx, ry, r);
    }
  }

  if (b.kind === 'power') {
    // a star marks bricks that always drop a power-up
    star(ctx, x + w / 2, y + h / 2, Math.min(h * 0.36, 8));
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  if (b.kind !== 'steel' && b.hp < b.maxHp) drawCracks(ctx, b);

  // crisp dark outline separates every brick clearly
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1 / k;
  roundRect(ctx, x + 0.5 / k, y + 0.5 / k, w - 1 / k, h - 1 / k, radius);
  ctx.stroke();

  if (b.flash > 0) {
    roundRect(ctx, x, y, w, h, radius);
    ctx.fillStyle = `rgba(255,255,255,${b.flash * 4})`;
    ctx.fill();
  }
}

export function draw(ctx: CanvasRenderingContext2D, s: GameState) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, s.width, s.height);
  ctx.fillStyle = '#ffffff';
  for (const st of STARS) {
    ctx.globalAlpha = st.alpha * 0.8;
    ctx.fillRect(st.x * s.width, st.y * s.height, st.size, st.size);
  }
  ctx.globalAlpha = 1;

  // screen pixels per play-field unit, used to keep brick edges pixel-sharp
  const k = ctx.getTransform().a || 1;
  for (const b of s.bricks) if (b.alive) drawBrick(ctx, b, k);

  // power-up capsules with an icon showing what they do
  for (const pu of s.powerUps) {
    const style = POWERUP_STYLE[pu.type];
    const x = pu.pos.x - POWERUP_W / 2;
    const y = pu.pos.y - POWERUP_H / 2;
    roundRect(ctx, x, y, POWERUP_W, POWERUP_H, POWERUP_H / 2);
    ctx.fillStyle = style.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(x + 8, y + 3, POWERUP_W - 16, 2);
    drawPowerIcon(ctx, pu.type, pu.pos.x, pu.pos.y + 0.5, 16, '#0b0f24');
  }

  // lasers
  ctx.fillStyle = COLORS.laser;
  for (const l of s.lasers) ctx.fillRect(l.x - 1.5, l.y - 10, 3, 12);

  // paddle
  const p = s.paddle;
  roundRect(ctx, p.x, p.y, p.width, p.height, p.height / 2);
  ctx.fillStyle = COLORS.paddle;
  ctx.fill();
  const endColor = s.effects.laser > 0 ? COLORS.laser : s.effects.sticky > 0 ? '#b07cf0' : COLORS.paddleEnd;
  ctx.fillStyle = endColor;
  roundRect(ctx, p.x, p.y, 16, p.height, p.height / 2);
  ctx.fill();
  roundRect(ctx, p.x + p.width - 16, p.y, 16, p.height, p.height / 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(p.x + 16, p.y + 3, p.width - 32, 2);

  // balls
  const fire = s.effects.fire > 0;
  for (const b of s.balls) {
    if (fire) {
      ctx.fillStyle = 'rgba(255,122,26,0.3)';
      ctx.beginPath();
      ctx.arc(b.pos.x - b.vel.x * 0.02, b.pos.y - b.vel.y * 0.02, b.r + 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = fire ? COLORS.fire : COLORS.ball;
    ctx.beginPath();
    ctx.arc(b.pos.x, b.pos.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // particles
  for (const pt of s.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;

  if (s.status === 'playing' && s.balls.some((b) => b.stuck)) {
    ctx.fillStyle = COLORS.text;
    ctx.globalAlpha = 0.75;
    ctx.font = '600 16px "Chakra Petch", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Click, tap or press Space to launch', s.width / 2, s.height - 110);
    ctx.globalAlpha = 1;
  }
}
