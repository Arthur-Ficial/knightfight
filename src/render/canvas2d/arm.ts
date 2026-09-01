import { clamp } from '../../core/math.ts';
import { shadedLimb, jointBlob, type Shade, type Vec } from './limb.ts';

// Two-bone arm IK. Given a shoulder and a hand target, solve a believable elbow
// with a pole hint (the elbow bends toward the pole, never hyperextends), then
// draw a volumetric upper arm + forearm with joint bulk.

export const solveElbow = (s: Vec, hand: Vec, l1: number, l2: number, pole: Vec): Vec => {
  const rawx = hand[0] - s[0];
  const rawy = hand[1] - s[1];
  const raw = Math.hypot(rawx, rawy) || 1;
  const ux = rawx / raw;
  const uy = rawy / raw;
  const d = clamp(raw, Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mx = s[0] + ux * a;
  const my = s[1] + uy * a;
  const e1: Vec = [mx - uy * h, my + ux * h];
  const e2: Vec = [mx + uy * h, my - ux * h];
  const d1 = (e1[0] - pole[0]) ** 2 + (e1[1] - pole[1]) ** 2;
  const d2 = (e2[0] - pole[0]) ** 2 + (e2[1] - pole[1]) ** 2;
  return d1 < d2 ? e1 : e2;
};

/** Clamp a hand target to arm reach so the arm never hyperextends/detaches. */
export const reachClamp = (s: Vec, hand: Vec, maxLen: number): Vec => {
  const dx = hand[0] - s[0];
  const dy = hand[1] - s[1];
  const d = Math.hypot(dx, dy);
  if (d <= maxLen || d === 0) {
    return hand;
  }
  return [s[0] + (dx / d) * maxLen, s[1] + (dy / d) * maxLen];
};

export const drawArm = (
  ctx: CanvasRenderingContext2D, shoulder: Vec, hand: Vec, upper: number, fore: number, pole: Vec, s: number, sh: Shade,
): { hand: Vec; elbow: Vec } => {
  const clamped = reachClamp(shoulder, hand, upper + fore - 0.5);
  const elbow = solveElbow(shoulder, clamped, upper, fore, pole);
  shadedLimb(ctx, shoulder, elbow, 6.5 * s, 5.5 * s, sh);
  shadedLimb(ctx, elbow, clamped, 5.5 * s, 4.5 * s, sh);
  jointBlob(ctx, elbow, 3.6 * s, sh);
  return { hand: clamped, elbow };
};
