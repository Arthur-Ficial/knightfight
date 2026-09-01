import type { DuelState } from '../sim/state.ts';

// The renderer seam. canvas2d ships; headless is used by tests/selfplay. A swap
// to WebGL later touches only this folder.

export interface Cosmetics {
  readonly bloodMoon: boolean;
  readonly chicken: boolean;
  readonly crt: boolean;
  readonly sitting: boolean;
  readonly sleeping: boolean;
}

export interface RenderView {
  readonly duel: DuelState;
  readonly cosmetics: Cosmetics;
  readonly banner: string | null;
}

export interface Renderer {
  resize(width: number, height: number): void;
  render(view: RenderView): void;
}
