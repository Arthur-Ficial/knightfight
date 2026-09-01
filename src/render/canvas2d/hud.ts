import { PALETTE, RHYTHM_WINDOW } from '../../config/index.ts';
import { clamp01 } from '../../core/math.ts';
import { comboChainLength } from '../../sim/combos.ts';
import type { DuelState } from '../../sim/state.ts';
import type { View } from './view.ts';

// Crisp HUD overlay (drawn OVER the upscaled pixel scene so text stays legible):
// labelled player + enemy vitals, combo chain, rung. Every label is >= 16px.

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
  text(ctx, e.name, view.w - pad, 82, 16, PALETTE.inkDim, 'right');
  text(ctx, `RUNG ${duel.rung}`, view.w / 2, 34, 16, PALETTE.gold, 'center');
  if (p.riposteWindow > 0) {
    text(ctx, 'RIPOSTE', view.w / 2, view.h * 0.56, 22, PALETTE.parry, 'center');
  }
  drawCombo(ctx, view, duel);
};
