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
  // Feet in the lower third so the fighters own the frame and the bottom is not a
  // dead flat band. Headroom stays for the overhead wind-up (weapon above helm).
  groundY: Math.round(h * 0.79),
  knightScale: h / 500,
  shakeX,
  shakeY,
});

/** Arena x (0..ARENA.width) -> screen x, honouring shake. */
export const sx = (view: View, arenaX: number): number =>
  (arenaX / ARENA.width) * view.w + view.shakeX;

export const groundOffset = (view: View, dy: number): number => view.groundY + dy + view.shakeY;
