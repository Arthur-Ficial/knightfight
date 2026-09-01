import { PALETTE } from '../../config/index.ts';
import { plate, blob, capsule, type Shade, type Vec } from './limb.ts';
import type { WeaponType, ShieldType } from './style.ts';

// Weapon + shield geometry. Real parts: blade with fuller, crossguard, pommel;
// polearms, crossbow, dagger pair, mace. Returns the blade tip for the trail.

const add = (p: Vec, u: Vec, d: number): Vec => [p[0] + u[0] * d, p[1] + u[1] * d];
const perp = (u: Vec): Vec => [-u[1], u[0]];

const blade = (ctx: CanvasRenderingContext2D, base: Vec, u: Vec, len: number, hw: number): Vec => {
  const p = perp(u);
  const tip = add(base, u, len);
  const mid = add(base, u, len * 0.62);
  plate(ctx, [
    [base[0] + p[0] * hw, base[1] + p[1] * hw],
    [mid[0] + p[0] * hw * 0.8, mid[1] + p[1] * hw * 0.8],
    tip,
    [mid[0] - p[0] * hw * 0.8, mid[1] - p[1] * hw * 0.8],
    [base[0] - p[0] * hw, base[1] - p[1] * hw],
  ], PALETTE.steelLight, PALETTE.ink);
  ctx.strokeStyle = PALETTE.steelDark;
  ctx.lineWidth = Math.max(1, hw * 0.3);
  ctx.beginPath();
  ctx.moveTo(base[0], base[1]);
  ctx.lineTo(tip[0], tip[1]);
  ctx.stroke();
  return tip;
};

const hilt = (ctx: CanvasRenderingContext2D, hand: Vec, u: Vec, s: number, accent: string): void => {
  const p = perp(u);
  capsule(ctx, add(hand, u, -6 * s), hand, 3 * s, 3 * s, PALETTE.leather);
  capsule(ctx, [hand[0] + p[0] * 7 * s, hand[1] + p[1] * 7 * s], [hand[0] - p[0] * 7 * s, hand[1] - p[1] * 7 * s], 3 * s, 3 * s, accent);
  blob(ctx, add(hand, u, -7 * s), 3 * s, accent);
};

export const drawWeapon = (
  ctx: CanvasRenderingContext2D, hand: Vec, u: Vec, s: number, type: WeaponType, sh: Shade, accent: string,
): Vec => {
  const p = perp(u);
  if (type === 'dagger2') {
    blade(ctx, add(hand, p, 4 * s), u, 26 * s, 4 * s);
    return blade(ctx, add(hand, p, -4 * s), u, 26 * s, 4 * s);
  }
  if (type === 'halberd') {
    capsule(ctx, add(hand, u, -30 * s), add(hand, u, 70 * s), 4 * s, 4 * s, PALETTE.leather);
    const head = add(hand, u, 62 * s);
    plate(ctx, [head, add(head, p, 20 * s), add(add(head, p, 16 * s), u, 18 * s), add(head, u, 14 * s)], PALETTE.steelMid, PALETTE.steelLight);
    return add(hand, u, 82 * s);
  }
  if (type === 'crossbow') {
    capsule(ctx, add(hand, u, -8 * s), add(hand, u, 22 * s), 4 * s, 3 * s, PALETTE.leather);
    const nose = add(hand, u, 20 * s);
    capsule(ctx, add(nose, p, 16 * s), add(nose, p, -16 * s), 3 * s, 3 * s, sh.base);
    ctx.strokeStyle = PALETTE.steelLight;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(nose[0] + p[0] * 16 * s, nose[1] + p[1] * 16 * s);
    ctx.lineTo(hand[0], hand[1]);
    ctx.lineTo(nose[0] - p[0] * 16 * s, nose[1] - p[1] * 16 * s);
    ctx.stroke();
    return add(hand, u, 24 * s);
  }
  if (type === 'mace') {
    capsule(ctx, hand, add(hand, u, 34 * s), 4 * s, 4 * s, PALETTE.leather);
    const head = add(hand, u, 40 * s);
    blob(ctx, head, 8 * s, PALETTE.steelMid);
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      plate(ctx, [add(head, [Math.cos(a), Math.sin(a)], 6 * s), add(head, [Math.cos(a + 0.3), Math.sin(a + 0.3)], 6 * s), add(head, [Math.cos(a + 0.15), Math.sin(a + 0.15)], 13 * s)], PALETTE.steelLight, PALETTE.steelLight);
    }
    return head;
  }
  if (type === 'chicken') {
    capsule(ctx, hand, add(hand, u, 30 * s), 7 * s, 10 * s, PALETTE.torch0);
    blob(ctx, add(hand, u, 30 * s), 8 * s, PALETTE.torch1);
    blob(ctx, add(add(hand, u, 34 * s), p, 4 * s), 2 * s, PALETTE.tellRed);
    return add(hand, u, 38 * s);
  }
  const len = type === 'greatsword' ? 84 * s : 58 * s;
  const hw = type === 'greatsword' ? 6 * s : 4.5 * s;
  hilt(ctx, hand, u, s, accent);
  return blade(ctx, add(hand, u, 6 * s), u, len, hw);
};

export const drawShield = (ctx: CanvasRenderingContext2D, p: Vec, s: number, type: ShieldType, sh: Shade, accent: string): void => {
  if (type === null) {
    return;
  }
  if (type === 'kite') {
    plate(ctx, [[p[0], p[1] - 20 * s], [p[0] + 15 * s, p[1] - 12 * s], [p[0] + 12 * s, p[1] + 14 * s], [p[0], p[1] + 26 * s], [p[0] - 12 * s, p[1] + 14 * s], [p[0] - 15 * s, p[1] - 12 * s]], sh.base, sh.warm);
    plate(ctx, [[p[0], p[1] - 10 * s], [p[0] + 6 * s, p[1]], [p[0], p[1] + 12 * s], [p[0] - 6 * s, p[1]]], accent, sh.cool);
  } else {
    blob(ctx, [p[0] + 2 * s, p[1] + 2 * s], 18 * s, sh.shadow);
    blob(ctx, p, 17 * s, sh.base);
    blob(ctx, p, 5 * s, accent);
  }
};
