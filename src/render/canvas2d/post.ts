import type { View } from './view.ts';

// Screen-space post: vignette always; CRT scanlines and a faint chromatic edge
// fringe behind the toggle. Cheap and mobile-safe (no offscreen passes).

const drawVignette = (ctx: CanvasRenderingContext2D, view: View): void => {
  const g = ctx.createRadialGradient(
    view.w / 2, view.h / 2, view.h * 0.28,
    view.w / 2, view.h / 2, view.h * 0.72,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, view.w, view.h);
};

const drawScanlines = (ctx: CanvasRenderingContext2D, view: View): void => {
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#000000';
  for (let y = 0; y < view.h; y += 3) {
    ctx.fillRect(0, y, view.w, 1);
  }
  ctx.globalAlpha = 1;
};

const drawChromaEdge = (ctx: CanvasRenderingContext2D, view: View): void => {
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#ff0033';
  ctx.fillRect(0, 0, 3, view.h);
  ctx.fillStyle = '#0033ff';
  ctx.fillRect(view.w - 3, 0, 3, view.h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
};

export const applyPost = (ctx: CanvasRenderingContext2D, view: View, crt: boolean): void => {
  drawVignette(ctx, view);
  if (crt) {
    drawChromaEdge(ctx, view);
    drawScanlines(ctx, view);
  }
};
