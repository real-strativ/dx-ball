import type { PowerUpType } from './types';

// Draws a power-up icon centered at (cx, cy). Shapes are designed on a
// 20 x 20 grid (-10..10) and scaled by `size / 20`.
export function drawPowerIcon(
  ctx: CanvasRenderingContext2D,
  type: PowerUpType,
  cx: number,
  cy: number,
  size: number,
  color: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size / 20, size / 20);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (type) {
    case 'wide': {
      // arrows pushing outward from a bar
      ctx.fillRect(-4, -2, 8, 4);
      arrowHead(ctx, -9, 0, -1);
      arrowHead(ctx, 9, 0, 1);
      line(ctx, -9, 0, -4, 0);
      line(ctx, 4, 0, 9, 0);
      break;
    }
    case 'narrow': {
      // arrows squeezing inward onto a short bar
      ctx.fillRect(-2.5, -4, 5, 8);
      arrowHead(ctx, -4, 0, 1);
      arrowHead(ctx, 4, 0, -1);
      line(ctx, -10, 0, -5, 0);
      line(ctx, 5, 0, 10, 0);
      break;
    }
    case 'multi': {
      // three balls
      for (const [x, y] of [[-6, 3.5], [6, 3.5], [0, -4.5]] as const) {
        ctx.beginPath();
        ctx.arc(x, y, 3.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'slow': {
      // snail: spiral shell on a body
      ctx.beginPath();
      ctx.arc(1.5, -1, 5.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(1.5, -1, 2.2, Math.PI * 0.2, Math.PI * 1.9);
      ctx.stroke();
      line(ctx, -9, 6, 8, 6);
      line(ctx, -8.5, 6, -9, 1);
      line(ctx, -9, 1, -10, -2.5);
      line(ctx, -9, 1, -7, -2.5);
      break;
    }
    case 'fire': {
      // flame
      ctx.beginPath();
      ctx.moveTo(0, -9.5);
      ctx.bezierCurveTo(3, -5, 7.5, -2, 7, 3);
      ctx.bezierCurveTo(6.5, 7.5, 3, 9.5, 0, 9.5);
      ctx.bezierCurveTo(-3, 9.5, -6.5, 7.5, -7, 3);
      ctx.bezierCurveTo(-7.3, -0.5, -4.5, -2.5, -3.5, -6);
      ctx.bezierCurveTo(-1.5, -4, -1, -2.5, -1.5, 0);
      ctx.bezierCurveTo(0.5, -2.5, 1, -6, 0, -9.5);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'sticky': {
      // horseshoe magnet: catches the ball
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(-6, 0);
      ctx.arc(0, 0, 6, Math.PI, 0, true);
      ctx.lineTo(6, -8);
      ctx.stroke();
      ctx.lineWidth = 1.6;
      line(ctx, -8.5, -5, -3.5, -5);
      line(ctx, 3.5, -5, 8.5, -5);
      break;
    }
    case 'laser': {
      // crosshair: the paddle can shoot
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 5.8, 0, Math.PI * 2);
      ctx.stroke();
      line(ctx, 0, -10, 0, -3);
      line(ctx, 0, 3, 0, 10);
      line(ctx, -10, 0, -3, 0);
      line(ctx, 3, 0, 10, 0);
      ctx.beginPath();
      ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'life': {
      // heart
      ctx.beginPath();
      ctx.moveTo(0, 8.5);
      ctx.bezierCurveTo(-4, 5, -9.5, 1.5, -9.5, -3);
      ctx.bezierCurveTo(-9.5, -7, -5.5, -9, -2.8, -7.6);
      ctx.bezierCurveTo(-1.4, -6.9, -0.5, -5.8, 0, -4.8);
      ctx.bezierCurveTo(0.5, -5.8, 1.4, -6.9, 2.8, -7.6);
      ctx.bezierCurveTo(5.5, -9, 9.5, -7, 9.5, -3);
      ctx.bezierCurveTo(9.5, 1.5, 4, 5, 0, 8.5);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Solid triangle pointing left (dir -1) or right (dir 1), tip at (x, y).
function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, dir: 1 | -1) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dir * 5, y - 4.5);
  ctx.lineTo(x - dir * 5, y + 4.5);
  ctx.closePath();
  ctx.fill();
}
