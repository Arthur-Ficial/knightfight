import { PALETTE } from '../../config/index.ts';
import { plate, blob, type Shade, type Vec } from './limb.ts';
import type { HelmType } from './style.ts';

// Armour plate geometry: helms (with visor, plume, horns, crown, beak),
// pauldrons, breastplate with heraldry, tassets. Each reads in silhouette.

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string): void => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
};

const plume = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, dir: number, color: string): void => {
  plate(ctx, [
    [cx, cy - r * 1.1], [cx - dir * r * 0.4, cy - r * 1.9],
    [cx - dir * r * 1.3, cy - r * 1.7], [cx - dir * r * 0.5, cy - r * 0.9],
  ], color, color);
};

const horns = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void => {
  plate(ctx, [[cx - r * 0.6, cy - r], [cx - r * 1.5, cy - r * 2], [cx - r * 0.9, cy - r * 0.7]], color, color);
  plate(ctx, [[cx + r * 0.6, cy - r], [cx + r * 1.5, cy - r * 2], [cx + r * 0.9, cy - r * 0.7]], color, color);
};

const crown = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void => {
  for (let i = -1; i <= 1; i += 1) {
    plate(ctx, [[cx + i * r * 0.7 - r * 0.25, cy - r], [cx + i * r * 0.7, cy - r * 1.7], [cx + i * r * 0.7 + r * 0.25, cy - r]], color, color);
  }
};

export const drawHelm = (
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, dir: number, helm: HelmType, sh: Shade, accent: string,
): void => {
  if (helm === 'great' || helm === 'crown') {
    plume(ctx, cx, cy, r, dir, accent);
  }
  if (helm === 'horned') {
    horns(ctx, cx, cy, r, PALETTE.ironDark);
  }
  blob(ctx, [cx + r * 0.18, cy + r * 0.18], r * 1.05, sh.shadow);
  roundRect(ctx, cx - r, cy - r * 1.05, r * 2, r * 2.05, r * 0.55, sh.base);
  if (helm === 'crown') {
    crown(ctx, cx, cy - r * 0.6, r, accent);
  }
  blob(ctx, [cx - r * 0.4, cy - r * 0.5], r * 0.4, sh.cool);
  const slitY = cy - r * 0.05;
  ctx.fillStyle = '#05060c';
  if (helm === 'beaked') {
    plate(ctx, [[cx, slitY - r * 0.1], [cx + dir * r * 1.5, slitY + r * 0.2], [cx, slitY + r * 0.5]], sh.shadow, accent);
    blob(ctx, [cx - r * 0.35, slitY - r * 0.1], r * 0.18, '#05060c');
    blob(ctx, [cx + r * 0.35, slitY - r * 0.1], r * 0.18, '#05060c');
  } else if (helm === 'barbute' || helm === 'hood') {
    ctx.fillRect(cx - r * 0.5, slitY - r * 0.2, r, r * 1.1);
  } else {
    ctx.fillRect(cx - r * 0.75 + dir * r * 0.1, slitY, r * 1.5, r * 0.3);
    ctx.fillStyle = accent;
    ctx.fillRect(cx - r * 0.1, cy - r, r * 0.2, r * 0.5);
  }
};

export const drawTorso = (
  ctx: CanvasRenderingContext2D, chest: Vec, pelvis: Vec, w: number, dir: number, sh: Shade, accent: string,
): void => {
  const top = w * 0.85;
  const bot = w * 0.6;
  plate(ctx, [
    [chest[0] - top, chest[1]], [chest[0] + top, chest[1]],
    [pelvis[0] + bot, pelvis[1]], [pelvis[0] - bot, pelvis[1]],
  ], sh.base, sh.warm);
  const mx = (chest[0] + pelvis[0]) / 2;
  const my = (chest[1] + pelvis[1]) / 2;
  plate(ctx, [[mx, my - w * 0.5], [mx + w * 0.4, my], [mx, my + w * 0.5], [mx - w * 0.4, my]], accent, sh.cool);
  ctx.globalAlpha = 0.4;
  plate(ctx, [[chest[0] - top, chest[1]], [chest[0] - top * 0.2, chest[1]], [pelvis[0] - bot * 0.3, pelvis[1]], [pelvis[0] - bot, pelvis[1]]], sh.cool, sh.cool);
  ctx.globalAlpha = 1;
  // tassets
  plate(ctx, [[pelvis[0] - bot, pelvis[1] - w * 0.1], [pelvis[0] - bot * 0.2, pelvis[1] - w * 0.1], [pelvis[0] - bot * 0.4, pelvis[1] + w * 0.5], [pelvis[0] - bot * 1.1, pelvis[1] + w * 0.4]], sh.shadow, sh.warm);
  plate(ctx, [[pelvis[0] + bot, pelvis[1] - w * 0.1], [pelvis[0] + bot * 0.2, pelvis[1] - w * 0.1], [pelvis[0] + bot * 0.4, pelvis[1] + w * 0.5], [pelvis[0] + bot * 1.1, pelvis[1] + w * 0.4]], sh.shadow, sh.warm);
  void dir;
};

export const drawPauldron = (ctx: CanvasRenderingContext2D, p: Vec, r: number, sh: Shade): void => {
  blob(ctx, [p[0] + r * 0.15, p[1] + r * 0.15], r * 1.1, sh.shadow);
  blob(ctx, p, r, sh.base);
  ctx.globalAlpha = 0.5;
  blob(ctx, [p[0] - r * 0.35, p[1] - r * 0.35], r * 0.45, sh.cool);
  ctx.globalAlpha = 1;
};
