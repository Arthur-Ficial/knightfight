import { describe, it, expect } from 'vitest';
import { archetypeForRung, affixesForRung, buildEnemy } from '../src/sim/ladder.ts';
import { createRng } from '../src/core/rng.ts';
import { asSeed } from '../src/core/types.ts';

describe('ladder progression', () => {
  it('introduces archetypes in order', () => {
    expect(archetypeForRung(1).name).toBe('Squire');
    expect(archetypeForRung(2).name).toBe('Bandit');
    expect(archetypeForRung(6).name).toBe('Halberdier');
    expect(archetypeForRung(13).name).toBe('The Champion');
    expect(archetypeForRung(14).name).toBe('Dread Knight');
  });

  it('spawns the Dread Knight boss every 10 rungs after 14', () => {
    expect(archetypeForRung(24).name).toBe('Dread Knight');
    expect(archetypeForRung(34).name).toBe('Dread Knight');
    expect(archetypeForRung(25).name).not.toBe('Dread Knight');
  });

  it('adds affixes only past the affix start rung', () => {
    expect(affixesForRung(1, createRng(asSeed(1)))).toHaveLength(0);
    expect(affixesForRung(20, createRng(asSeed(1))).length).toBeGreaterThan(0);
  });

  it('scales stats upward with the rung', () => {
    const low = buildEnemy(2, createRng(asSeed(1)));
    const high = buildEnemy(30, createRng(asSeed(1)));
    expect(high.maxHp).toBeGreaterThan(low.maxHp);
    expect(high.name.length).toBeGreaterThan(0);
  });

  it('builds enemies deterministically for a seed', () => {
    const a = buildEnemy(20, createRng(asSeed(123)));
    const b = buildEnemy(20, createRng(asSeed(123)));
    expect(a.name).toBe(b.name);
    expect(a.maxHp).toBe(b.maxHp);
  });
});
