import type { View } from './view.ts';

// Screen-space post: vignette always; CRT scanlines and a faint chromatic edge
// fringe behind the toggle. Cheap and mobile-safe (no offscreen passes).

const drawVignette = (ctx: CanvasRenderingContext2D, view: View): void => {
  const g = ctx.createRadialGradient(
    view.w / 2, view.h / 2, view.h * 0.28,
    view.w / 2, view.h / 2, view.h * 0.72,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, view.w, view.h);
};

const drawScanlines = (ctx: CanvasRenderingContext2D, view: View): void => {
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#000000';
  for (let y = 0; y < view.h; y += 3) {
    ctx.fillRect(0, y, view.w, 1);
  }
  ctx.globalAlpha = 1;
};

export const applyPost = (ctx: CanvasRenderingContext2D, view: View, crt: boolean): void => {
  drawVignette(ctx, view);
  if (crt) {
    drawScanlines(ctx, view);
  }
};
