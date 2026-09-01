import { BOON_BY_ID, BOONS, type BoonDef } from '../config/index.ts';
import type { ModBag } from '../config/boons.ts';
import type { BoonId, Seed } from '../core/types.ts';
import { createRng, shuffle, type Rng } from '../core/rng.ts';
import { resolveStats } from './modifiers.ts';
import { metaModBags, unlockedGestures, type MetaState } from './meta.ts';
import { valorForRung } from './ladder.ts';
import type { EffectiveStats } from './state.ts';
import type { GestureUnlock } from '../config/meta.ts';

// One run = a ladder climb. Holds in-run boons and the run RNG. Combines with
// persistent meta to produce the player's effective stats and gesture unlocks.

export interface RunState {
  rung: number;
  boonIds: BoonId[];
  seed: Seed;
  rng: Rng;
  revives: number;
}

export const createRun = (seed: Seed, revives: number): RunState => ({
  rung: 1,
  boonIds: [],
  seed,
  rng: createRng(seed),
  revives,
});

const boonBags = (run: RunState): ModBag[] =>
  run.boonIds.map((id) => BOON_BY_ID.get(id)?.mods ?? {});

export const runStats = (run: RunState, meta: MetaState): EffectiveStats =>
  resolveStats([...metaModBags(meta), ...boonBags(run)]);

export const runUnlocks = (meta: MetaState): ReadonlySet<GestureUnlock> => unlockedGestures(meta);

/** Offer three distinct boons the player does not already own. */
export const offerBoons = (run: RunState, rng: Rng): BoonDef[] => {
  const owned = new Set(run.boonIds);
  const pool = BOONS.filter((b) => !owned.has(b.id));
  return shuffle(rng, pool).slice(0, 3);
};

export const takeBoon = (run: RunState, boon: BoonDef): void => {
  run.boonIds.push(boon.id);
};

export const advanceRung = (run: RunState): void => {
  run.rung += 1;
};

export const runValor = (run: RunState): number => valorForRung(run.rung);
