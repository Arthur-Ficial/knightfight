import { describe, it, expect } from 'vitest';
import { createRng, cloneRng, nextFloat, nextInt } from '../src/core/rng.ts';
import { asSeed } from '../src/core/types.ts';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(asSeed(42));
    const b = createRng(asSeed(42));
    const seqA = Array.from({ length: 16 }, () => nextFloat(a));
    const seqB = Array.from({ length: 16 }, () => nextFloat(b));
    expect(seqA).toEqual(seqB);
  });

  it('produces different streams for different seeds', () => {
    const a = createRng(asSeed(1));
    const b = createRng(asSeed(2));
    expect(nextFloat(a)).not.toEqual(nextFloat(b));
  });

  it('supports save and restore via clone', () => {
    const live = createRng(asSeed(7));
    nextFloat(live);
    nextFloat(live);
    const snapshot = cloneRng(live);
    const expected = nextFloat(live);
    const restored = cloneRng(snapshot);
    expect(nextFloat(restored)).toEqual(expected);
  });

  it('keeps floats in [0, 1)', () => {
    const r = createRng(asSeed(99));
    for (let i = 0; i < 2000; i += 1) {
      const v = nextFloat(r);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('bounds integers inclusively', () => {
    const r = createRng(asSeed(5));
    for (let i = 0; i < 2000; i += 1) {
      const v = nextInt(r, 3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });
});
