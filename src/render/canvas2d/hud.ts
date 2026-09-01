import { PALETTE, RHYTHM_WINDOW } from '../../config/index.ts';
import { clamp01, lerp } from '../../core/math.ts';
import { comboChainLength } from '../../sim/combos.ts';
import type { DuelState } from '../../sim/state.ts';
import { sx, type View } from './view.ts';

// Heads-up display: player + enemy vitals, the enemy telegraph ring (the read),
// combo chain and rung. Every label is >= 16px per Franz's rule.

const FONT = 'ui-monospace, "SF Mono", Menlo, monospace';

const text = (ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left'): void => {
  ctx.font = `bold ${Math.max(16, size)}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
};

const bar = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frac: number, color: string): void => {
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = PALETTE.panelEdge;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * clamp01(frac), h);
};

const drawTelegraph = (ctx: CanvasRenderingContext2D, view: View, duel: DuelState): void => {
  const e = duel.enemy;
  if (e.phase !== 'telegraph' || e.move === null) {
    return;
  }
  const total = Math.max(1, e.move.windup * e.telegraphMult);
  const prog = clamp01(1 - e.timer / total);
  const cx = sx(view, e.x);
  const cy = view.groundY - view.h * 0.11;
  const r = lerp(view.w * 0.16, view.w * 0.05, prog);
  const color = e.tell === 'red' ? PALETTE.tellRed : e.tell === 'gold' ? PALETTE.tellGold : PALETTE.tellWhite;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.4 + prog * 0.6;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
};

const drawCombo = (ctx: CanvasRenderingContext2D, view: View, duel: DuelState): void => {
  const chain = comboChainLength(duel.player.combo, duel.tick, RHYTHM_WINDOW);
  if (chain < 2) {
    return;
  }
  text(ctx, `${chain} HIT`, view.w / 2, view.h * 0.42, 22, PALETTE.gold, 'center');
};

export const drawHud = (ctx: CanvasRenderingContext2D, view: View, duel: DuelState): void => {
  const p = duel.player;
  const e = duel.enemy;
  const w = view.w * 0.4;
  const pad = view.w * 0.05;
  bar(ctx, pad, 26, w, 12, p.hp / p.stats.maxHp, PALETTE.hp);
  bar(ctx, pad, 44, w, 8, p.stamina / p.stats.maxStamina, PALETTE.stamina);
  bar(ctx, pad, 58, w, 6, p.rage / p.stats.maxRage, PALETTE.rage);
  bar(ctx, view.w - pad - w, 26, w, 12, e.hp / e.maxHp, PALETTE.hpEnemy);
  bar(ctx, view.w - pad - w, 44, w, 6, e.guard / e.guardMax, PALETTE.heroSteel);
  text(ctx, e.name, view.w - pad, 78, 16, PALETTE.inkDim, 'right');
  text(ctx, `RUNG ${duel.rung}`, view.w / 2, 34, 16, PALETTE.gold, 'center');
  if (p.riposteWindow > 0) {
    text(ctx, 'RIPOSTE!', view.w / 2, view.h * 0.5, 24, PALETTE.parry, 'center');
  }
  drawTelegraph(ctx, view, duel);
  drawCombo(ctx, view, duel);
};
