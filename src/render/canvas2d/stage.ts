import { PALETTE } from '../../config/index.ts';
import { sx, type View } from './view.ts';

// Camera staging: the sim keeps fighters at melee-tight arena gaps, but on a
// phone that reads as an overlap. We spread the pair to a comfortable on-screen
// separation, keep them framed, and expose a world->screen map so FX, chevrons
// and projectiles stay glued to the separated bodies.

export interface Anchors {
  readonly px: number;
  readonly pe: number;
  readonly pAx: number;
  readonly eAx: number;
}

export const separate = (view: View, playerAx: number, enemyAx: number): Anchors => {
  const rawP = sx(view, playerAx);
  const rawE = sx(view, enemyAx);
  const mid = (rawP + rawE) / 2;
  const sgn = rawE >= rawP ? 1 : -1;
  const half = Math.max(Math.abs(rawE - rawP) / 2, view.w * 0.2);
  const p = mid - sgn * half;
  const e = mid + sgn * half;
  const margin = view.w * 0.14;
  const lo = Math.min(p, e);
  const hi = Math.max(p, e);
  const shift = lo < margin ? margin - lo : hi > view.w - margin ? view.w - margin - hi : 0;
  return { px: p + shift, pe: e + shift, pAx: playerAx, eAx: enemyAx };
};

/** Arena x -> screen x through the separated anchors (keeps FX aligned). */
export const mapWorldX = (a: Anchors, ax: number): number =>
  a.eAx === a.pAx ? a.px : a.px + (a.pe - a.px) * ((ax - a.pAx) / (a.eAx - a.pAx));

/** The weapon-tip motion trail: bright leading edge fading to a coloured swoosh. */
export const drawTrail = (ctx: CanvasRenderingContext2D, trail: readonly [number, number][], warm: boolean): void => {
  if (trail.length < 2) {
    return;
  }
  ctx.lineCap = 'butt';
  for (let i = 1; i < trail.length; i += 1) {
    const a = trail[i - 1] as [number, number];
    const b = trail[i] as [number, number];
    ctx.globalAlpha = (1 - i / trail.length) * 0.5;
    ctx.strokeStyle = i < 2 ? PALETTE.tellWhite : warm ? PALETTE.warmRim : PALETTE.tellRed;
    ctx.lineWidth = Math.max(1, (trail.length - i) * 0.7);
    ctx.beginPath();
    ctx.moveTo(Math.round(a[0]), Math.round(a[1]));
    ctx.lineTo(Math.round(b[0]), Math.round(b[1]));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};
