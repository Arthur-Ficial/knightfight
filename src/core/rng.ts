import type { Seed } from './types.ts';

/**
 * mulberry32: a tiny, fast, well-distributed 32-bit PRNG. The whole game's
 * randomness flows through one of these so that seed + intent log fully
 * determines a fight (replays + deterministic tests).
 */
export interface Rng {
  state: number;
}

export const createRng = (seed: Seed): Rng => ({ state: seed >>> 0 });

export const cloneRng = (rng: Rng): Rng => ({ state: rng.state });

/** Advance the generator and return a float in [0, 1). Mutates `rng`. */
export const nextFloat = (rng: Rng): number => {
  rng.state = (rng.state + 0x6d2b79f5) | 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Integer in [min, max] inclusive. */
export const nextInt = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(nextFloat(rng) * (max - min + 1));

/** Float in [min, max). */
export const nextRange = (rng: Rng, min: number, max: number): number =>
  min + nextFloat(rng) * (max - min);

export const chance = (rng: Rng, probability: number): boolean =>
  nextFloat(rng) < probability;

export const pick = <T>(rng: Rng, items: readonly T[]): T => {
  if (items.length === 0) {
    throw new Error('pick from empty array');
  }
  const index = Math.floor(nextFloat(rng) * items.length);
  return items[index] as T;
};

/** In-place Fisher-Yates using the seeded generator. Returns a new array. */
export const shuffle = <T>(rng: Rng, items: readonly T[]): T[] => {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextFloat(rng) * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
};
