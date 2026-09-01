import { PALETTE } from '../../config/index.ts';
import type { Cosmetics } from '../renderer.ts';
import type { View } from './view.ts';

// Parallax torch-lit arena: sky, moon, castle wall, crowd silhouettes, banners,
// torches with flicker. Pure drawing from the view + tick.

export interface Circle {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

export const moonCircle = (view: View): Circle => ({ x: view.w * 0.76, y: view.h * 0.16, r: view.w * 0.09 });

const drawMoon = (ctx: CanvasRenderingContext2D, c: Circle, blood: boolean): void => {
  const glow = ctx.createRadialGradient(c.x, c.y, c.r * 0.2, c.x, c.y, c.r * 2.4);
  glow.addColorStop(0, blood ? PALETTE.bloodMoon : PALETTE.torch0);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(c.x - c.r * 2.4, c.y - c.r * 2.4, c.r * 4.8, c.r * 4.8);
  ctx.fillStyle = blood ? PALETTE.bloodMoon : PALETTE.ink;
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.fill();
};

const drawWall = (ctx: CanvasRenderingContext2D, view: View): void => {
  const top = view.h * 0.28;
  ctx.fillStyle = PALETTE.stone0;
  ctx.fillRect(0, top, view.w, view.groundY - top);
  ctx.fillStyle = PALETTE.stone1;
  for (let x = 0; x < view.w; x += 26) {
    ctx.fillRect(x, top, 22, 12);
  }
  ctx.fillStyle = PALETTE.night2;
  for (let x = -8; x < view.w; x += 44) {
    ctx.fillRect(x, top - 14, 20, 16);
  }
};

const drawCrowd = (ctx: CanvasRenderingContext2D, view: View, tick: number): void => {
  const base = view.groundY - view.h * 0.16;
  ctx.fillStyle = PALETTE.crowd;
  for (let x = 0; x < view.w + 20; x += 18) {
    const sway = Math.sin(tick * 0.05 + x) * 1.5;
    ctx.beginPath();
    ctx.arc(x, base + sway, 10, Math.PI, 0);
    ctx.fill();
  }
};

const drawBanners = (ctx: CanvasRenderingContext2D, view: View): void => {
  const y = view.h * 0.3;
  for (const fx of [0.2, 0.5, 0.86]) {
    const x = view.w * fx;
    ctx.fillStyle = PALETTE.banner;
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x, y + 42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    ctx.fillRect(x - 2, y + 8, 4, 4);
  }
};

const drawTorch = (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number): void => {
  const flick = 0.75 + Math.sin(tick * 0.4 + x) * 0.12 + Math.sin(tick * 1.3) * 0.08;
  const g = ctx.createRadialGradient(x, y, 2, x, y, 60 * flick);
  g.addColorStop(0, PALETTE.torch0);
  g.addColorStop(0.4, PALETTE.torch1);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 60, y - 60, 120, 120);
  ctx.fillStyle = PALETTE.torch2;
  ctx.fillRect(x - 2, y, 4, 26);
};

export const drawBackground = (ctx: CanvasRenderingContext2D, view: View, cos: Cosmetics, tick: number): void => {
  const sky = ctx.createLinearGradient(0, 0, 0, view.groundY);
  sky.addColorStop(0, cos.bloodMoon ? '#1a0a0e' : PALETTE.night0);
  sky.addColorStop(1, PALETTE.night2);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, view.w, view.h);
  drawMoon(ctx, moonCircle(view), cos.bloodMoon);
  drawWall(ctx, view);
  drawBanners(ctx, view);
  drawCrowd(ctx, view, tick);
  drawTorch(ctx, view.w * 0.12, view.groundY - view.h * 0.12, tick);
  drawTorch(ctx, view.w * 0.88, view.groundY - view.h * 0.12, tick);
  const floor = ctx.createLinearGradient(0, view.groundY, 0, view.h);
  floor.addColorStop(0, PALETTE.stone2);
  floor.addColorStop(1, PALETTE.night1);
  ctx.fillStyle = floor;
  ctx.fillRect(0, view.groundY, view.w, view.h - view.groundY);
};
