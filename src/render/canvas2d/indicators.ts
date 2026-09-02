import { PALETTE } from '../../config/index.ts';
import { clamp01, lerp } from '../../core/math.ts';
import type { Dir4, TellColour } from '../../core/types.ts';
import type { DuelState } from '../../sim/state.ts';
import type { View } from './view.ts';

// In-world gameplay indicators drawn INTO the pixel buffer. One symbol language
// for both halves of the fight: a chevron points a direction. Muted = the enemy
// guard (where NOT to strike); bright tell-colour = an incoming attack (dodge it
// that way); gold = the player's own strike.

const R = Math.round;

const tellColour = (tell: TellColour): string =>
  tell === 'red' ? PALETTE.tellRed : tell === 'gold' ? PALETTE.tellGold : PALETTE.tellWhite;

/** A filled arrow/chevron pointing in `dir`, snapped to the pixel grid. */
export const drawChevron = (ctx: CanvasRenderingContext2D, cx: number, cy: number, dir: Dir4, size: number, color: string): void => {
  const x = R(cx);
  const y = R(cy);
  const s = R(size);
  ctx.fillStyle = color;
  ctx.beginPath();
  if (dir === 'up') {
    ctx.moveTo(x, y - s); ctx.lineTo(x - s, y + s * 0.5); ctx.lineTo(x + s, y + s * 0.5);
  } else if (dir === 'down') {
    ctx.moveTo(x, y + s); ctx.lineTo(x - s, y - s * 0.5); ctx.lineTo(x + s, y - s * 0.5);
  } else if (dir === 'left') {
    ctx.moveTo(x - s, y); ctx.lineTo(x + s * 0.5, y - s); ctx.lineTo(x + s * 0.5, y + s);
  } else {
    ctx.moveTo(x + s, y); ctx.lineTo(x - s * 0.5, y - s); ctx.lineTo(x - s * 0.5, y + s);
  }
  ctx.closePath();
  ctx.fill();
};

const offsetFor = (dir: Dir4, cx: number, cy: number, r: number): [number, number] =>
  dir === 'up' ? [cx, cy - r] : dir === 'down' ? [cx, cy + r] : dir === 'left' ? [cx - r, cy] : [cx + r, cy];

const drawGuard = (ctx: CanvasRenderingContext2D, view: View, duel: DuelState, enemyX: number): void => {
  const e = duel.enemy;
  if (e.phase === 'staggered') {
    return;
  }
  // While countering, the mark points the line the enemy is DEFENDING (the read
  // it made of your wind-up) in a bright parry colour, so pose and mark agree.
  const countering = e.phase === 'counter' && e.counterDir !== null;
  const dir = countering ? (e.counterDir as Dir4) : e.guardDir;
  const cx = enemyX;
  const cy = view.groundY - view.h * 0.1;
  const [gx, gy] = offsetFor(dir, cx, cy, view.w * 0.08);
  ctx.fillStyle = '#0a0a12';
  ctx.beginPath();
  ctx.arc(Math.round(gx), Math.round(gy), Math.round(view.w * (countering ? 0.055 : 0.05)), 0, Math.PI * 2);
  ctx.fill();
  drawChevron(ctx, gx, gy, dir, view.w * (countering ? 0.045 : 0.04), countering ? PALETTE.tellWhite : PALETTE.heroRim);
};

const drawTelegraph = (ctx: CanvasRenderingContext2D, view: View, duel: DuelState, enemyX: number): void => {
  const e = duel.enemy;
  if (e.phase !== 'telegraph' || e.move === null) {
    return;
  }
  const total = Math.max(1, e.move.windup * e.telegraphMult);
  const prog = clamp01(1 - e.timer / total);
  const cx = enemyX;
  const cy = view.groundY - view.h * 0.12;
  const r = lerp(view.w * 0.14, view.w * 0.05, prog);
  const color = tellColour(e.tell ?? 'white');
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5 + prog * 0.5;
  ctx.beginPath();
  ctx.arc(R(cx), R(cy), R(r), 0, Math.PI * 2);
  ctx.stroke();
  const [ax, ay] = offsetFor(e.move.dir, cx, cy, view.w * 0.12);
  const csz = view.w * 0.06 * (0.75 + prog * 0.4);
  drawChevron(ctx, ax, ay, e.move.dir, csz + 2, '#0a0a12');
  drawChevron(ctx, ax, ay, e.move.dir, csz, color);
  ctx.globalAlpha = 1;
};

const drawPlayerStrike = (ctx: CanvasRenderingContext2D, view: View, duel: DuelState, playerX: number): void => {
  const a = duel.player.action;
  if (a === null || a.name !== 'strike' || a.phase === 'recovery') {
    return;
  }
  const cx = playerX;
  const cy = view.groundY - view.h * 0.12;
  const [ax, ay] = offsetFor(a.dir, cx, cy, view.w * 0.1);
  drawChevron(ctx, ax, ay, a.dir, view.w * 0.045, '#0a0a12');
  drawChevron(ctx, ax, ay, a.dir, view.w * 0.035, PALETTE.gold);
};

export const drawWorldIndicators = (
  ctx: CanvasRenderingContext2D, view: View, duel: DuelState, enemyX: number, playerX: number,
): void => {
  drawGuard(ctx, view, duel, enemyX);
  drawTelegraph(ctx, view, duel, enemyX);
  drawPlayerStrike(ctx, view, duel, playerX);
};
