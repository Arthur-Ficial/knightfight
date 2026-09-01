import { ARENA } from '../../config/index.ts';

// Maps abstract arena units to screen pixels for a portrait canvas, plus the
// current camera shake offset. Fighters live on a single ground line.

export interface View {
  readonly w: number;
  readonly h: number;
  readonly groundY: number;
  readonly knightScale: number;
  readonly shakeX: number;
  readonly shakeY: number;
}

export const makeView = (w: number, h: number, shakeX: number, shakeY: number): View => ({
  w,
  h,
  // Bigger fighters, feet low enough that the PAIR is centred (~mid-screen) with
  // balanced headroom/foreground - not floating high, not sunk to the bottom.
  groundY: Math.round(h * 0.67),
  knightScale: h / 470,
  shakeX,
  shakeY,
});

/** Arena x (0..ARENA.width) -> screen x, honouring shake. */
export const sx = (view: View, arenaX: number): number =>
  (arenaX / ARENA.width) * view.w + view.shakeX;

export const groundOffset = (view: View, dy: number): number => view.groundY + dy + view.shakeY;
