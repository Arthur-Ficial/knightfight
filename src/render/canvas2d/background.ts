import { PALETTE } from '../../config/index.ts';
import type { Cosmetics } from '../renderer.ts';
import type { View } from './view.ts';

// Parallax arena drawn for the low-res pixel buffer: flat colour bands (no
// gradients), quantised banded torch/moon light (hard steps), calm and moody.

export interface Circle {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

const R = Math.round;

export const moonCircle = (view: View): Circle => ({ x: view.w * 0.74, y: view.h * 0.15, r: view.w * 0.08 });

const disc = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(R(x), R(y), R(r), 0, Math.PI * 2);
  ctx.fill();
};

/** Concentric hard-edged light bands (outer dim -> inner bright). */
const bandedLight = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, bands: readonly string[], alpha: number): void => {
  ctx.globalAlpha = alpha;
  for (let i = 0; i < bands.length; i += 1) {
    disc(ctx, x, y, r * (1 - i / bands.length), bands[i] ?? '#000');
  }
  ctx.globalAlpha = 1;
};

const drawMoon = (ctx: CanvasRenderingContext2D, c: Circle, blood: boolean): void => {
  bandedLight(ctx, c.x, c.y, c.r * 1.7, blood ? [PALETTE.dread, PALETTE.bloodMoon] : [PALETTE.stone1, PALETTE.stone2], 0.5);
  disc(ctx, c.x, c.y, c.r, blood ? PALETTE.bloodMoon : PALETTE.inkDim);
  disc(ctx, c.x - c.r * 0.3, c.y - c.r * 0.3, c.r * 0.5, blood ? PALETTE.foe1 : PALETTE.ink);
};

const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void => {
  ctx.fillStyle = color;
  ctx.fillRect(R(x), R(y), R(w), R(h));
};

const drawTower = (ctx: CanvasRenderingContext2D, x: number, top: number, w: number, h: number): void => {
  rect(ctx, x - w / 2, top, w, h, PALETTE.tower);
  for (let i = -1; i <= 1; i += 1) {
    rect(ctx, x + i * w * 0.35 - w * 0.12, top - w * 0.16, w * 0.24, w * 0.16, PALETTE.tower);
  }
};

const drawFog = (ctx: CanvasRenderingContext2D, view: View, tick: number, y: number, speed: number): void => {
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = PALETTE.fog;
  const off = ((tick * speed) % (view.w + 60)) - 30;
  for (let i = -1; i < 3; i += 1) {
    rect(ctx, i * view.w * 0.6 + off, y, view.w * 0.5, view.h * 0.03, PALETTE.fog);
  }
  ctx.globalAlpha = 1;
};

const drawWall = (ctx: CanvasRenderingContext2D, view: View): void => {
  const top = view.h * 0.3;
  rect(ctx, 0, top, view.w, view.groundY - top, PALETTE.stone0);
  const step = view.w * 0.11;
  for (let x = 0; x < view.w; x += step) {
    rect(ctx, x, top, step * 0.8, view.h * 0.015, PALETTE.stone1);
    rect(ctx, x, top - view.h * 0.02, step * 0.5, view.h * 0.02, PALETTE.night2);
  }
};

const drawCrowd = (ctx: CanvasRenderingContext2D, view: View, tick: number): void => {
  const base = view.groundY - view.h * 0.15;
  const step = view.w * 0.06;
  for (let x = 0; x < view.w + step; x += step) {
    const sway = Math.round(Math.sin(tick * 0.02 + x) * 1) ;
    disc(ctx, x, base + sway, view.w * 0.028, PALETTE.crowd);
  }
};

const drawBanners = (ctx: CanvasRenderingContext2D, view: View): void => {
  const y = view.h * 0.32;
  for (const fx of [0.28, 0.72]) {
    const x = view.w * fx;
    const w = view.w * 0.05;
    ctx.fillStyle = PALETTE.banner;
    ctx.beginPath();
    ctx.moveTo(R(x - w), R(y));
    ctx.lineTo(R(x + w), R(y));
    ctx.lineTo(R(x), R(y + view.h * 0.05));
    ctx.closePath();
    ctx.fill();
  }
};

const drawTorch = (ctx: CanvasRenderingContext2D, view: View, x: number, y: number, tick: number): void => {
  const flick = Math.floor((tick * 0.15 + x) % 2) === 0 ? 1 : 0.85;
  bandedLight(ctx, x, y, view.w * 0.11 * flick, [PALETTE.torch2, PALETTE.torch1, PALETTE.torch0], 0.4);
  rect(ctx, x - view.w * 0.006, y, view.w * 0.012, view.h * 0.03, PALETTE.torch2);
};

export const drawBackground = (ctx: CanvasRenderingContext2D, view: View, cos: Cosmetics, tick: number): void => {
  rect(ctx, 0, 0, view.w, view.groundY, cos.bloodMoon ? PALETTE.night0 : PALETTE.night1);
  rect(ctx, 0, view.h * 0.18, view.w, view.groundY - view.h * 0.18, PALETTE.night2);
  drawMoon(ctx, moonCircle(view), cos.bloodMoon);
  drawTower(ctx, view.w * 0.1, view.h * 0.13, view.w * 0.14, view.h * 0.19);
  drawTower(ctx, view.w * 0.9, view.h * 0.1, view.w * 0.16, view.h * 0.22);
  drawWall(ctx, view);
  drawBanners(ctx, view);
  drawCrowd(ctx, view, tick);
  drawFog(ctx, view, tick, view.groundY - view.h * 0.04, 0.12);
  drawTorch(ctx, view, view.w * 0.12, view.groundY - view.h * 0.11, tick);
  drawTorch(ctx, view, view.w * 0.88, view.groundY - view.h * 0.11, tick);
  rect(ctx, 0, view.groundY, view.w, view.h * 0.06, PALETTE.stone2);
  rect(ctx, 0, view.groundY + view.h * 0.06, view.w, view.h, PALETTE.night1);
};

export const drawForeground = (ctx: CanvasRenderingContext2D, view: View, tick: number): void => {
  drawFog(ctx, view, tick, view.h * 0.92, -0.18);
  const step = view.w * 0.09;
  for (let x = -step; x < view.w + step; x += step) {
    disc(ctx, x, view.h + view.h * 0.03, view.w * 0.05, PALETTE.night0);
  }
};
