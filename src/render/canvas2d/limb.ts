// Volumetric drawing primitives. Limbs are tapered capsules with joint bulk and
// two-tone shading: a warm torch-side rim and a cool moon-side sheen. Armour is
// filled polygons with a warm rim edge. Never single-width lines.

export type Vec = readonly [number, number];

export interface Shade {
  readonly base: string;
  readonly shadow: string;
  readonly warm: string;
  readonly cool: string;
}

const circle = (ctx: CanvasRenderingContext2D, p: Vec, r: number, color: string): void => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
  ctx.fill();
};

export const capsule = (ctx: CanvasRenderingContext2D, a: Vec, b: Vec, wa: number, wb: number, color: string): void => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * 0.5;
  const py = (dx / len) * 0.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(a[0] + px * wa, a[1] + py * wa);
  ctx.lineTo(b[0] + px * wb, b[1] + py * wb);
  ctx.lineTo(b[0] - px * wb, b[1] - py * wb);
  ctx.lineTo(a[0] - px * wa, a[1] - py * wa);
  ctx.closePath();
  ctx.fill();
  circle(ctx, a, wa * 0.5, color);
  circle(ctx, b, wb * 0.5, color);
};

/** A shaded, jointed limb from a to b. Warm rim toward torch, cool toward moon. */
export const shadedLimb = (ctx: CanvasRenderingContext2D, a: Vec, b: Vec, wa: number, wb: number, sh: Shade): void => {
  const off = Math.min(wa, wb) * 0.22;
  capsule(ctx, [a[0] + off, a[1] + off], [b[0] + off, b[1] + off], wa, wb, sh.shadow);
  capsule(ctx, a, b, wa * 0.92, wb * 0.92, sh.base);
  ctx.globalAlpha = 0.5;
  capsule(ctx, [a[0] - off, a[1] - off], [b[0] - off, b[1] - off], wa * 0.34, wb * 0.34, sh.cool);
  ctx.globalAlpha = 0.7;
  capsule(ctx, [a[0] + off * 0.8, a[1] + off * 1.2], [b[0] + off * 0.8, b[1] + off * 1.2], wa * 0.24, wb * 0.24, sh.warm);
  ctx.globalAlpha = 1;
};

export const jointBlob = (ctx: CanvasRenderingContext2D, p: Vec, r: number, sh: Shade): void => {
  circle(ctx, [p[0] + r * 0.2, p[1] + r * 0.2], r, sh.shadow);
  circle(ctx, p, r * 0.9, sh.base);
  ctx.globalAlpha = 0.5;
  circle(ctx, [p[0] - r * 0.35, p[1] - r * 0.35], r * 0.4, sh.cool);
  ctx.globalAlpha = 1;
};

/** Filled armour plate with a warm rim edge. */
export const plate = (ctx: CanvasRenderingContext2D, pts: readonly Vec[], base: string, rim: string): void => {
  if (pts.length < 3) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0]?.[0] ?? 0, pts[0]?.[1] ?? 0);
  for (const p of pts) {
    ctx.lineTo(p[0], p[1]);
  }
  ctx.closePath();
  ctx.fillStyle = base;
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rim;
  ctx.globalAlpha = 0.7;
  ctx.stroke();
  ctx.globalAlpha = 1;
};

export const blob = circle;
