import { asSeed, type Intent } from '../src/core/types.ts';
import { createRng } from '../src/core/rng.ts';
import { resolveStats } from '../src/sim/modifiers.ts';
import { createDuel } from '../src/sim/init.ts';
import { stepDuel } from '../src/sim/step.ts';
import type { DuelState } from '../src/sim/state.ts';
import type { ModBag } from '../src/config/boons.ts';
import type { GestureUnlock } from '../src/config/meta.ts';

export interface DuelOpts {
  rung?: number;
  seed?: number;
  mods?: readonly ModBag[];
  unlocked?: readonly GestureUnlock[];
}

export const makeDuel = (opts: DuelOpts = {}): DuelState => {
  const rng = createRng(asSeed(opts.seed ?? 12345));
  const stats = resolveStats(opts.mods ?? []);
  return createDuel(opts.rung ?? 1, rng, stats, new Set(opts.unlocked ?? []));
};

export const step = (duel: DuelState, n = 1, intents: readonly Intent[] = []): void => {
  for (let i = 0; i < n; i += 1) {
    stepDuel(duel, i === 0 ? intents : []);
  }
};
