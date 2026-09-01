import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng.ts';
import { asSeed, type Intent } from '../src/core/types.ts';
import { resolveStats } from '../src/sim/modifiers.ts';
import { createDuel } from '../src/sim/init.ts';
import { stepDuel } from '../src/sim/step.ts';

const signature = (seed: number): readonly number[] => {
  const rng = createRng(asSeed(seed));
  const duel = createDuel(3, rng, resolveStats([]), new Set());
  for (let t = 0; t < 900; t += 1) {
    const intents: Intent[] =
      t % 17 === 0 ? [{ kind: 'light', side: 'center' }] : t % 53 === 0 ? [{ kind: 'dodge', dir: 'left' }] : [];
    stepDuel(duel, intents);
  }
  return [
    Math.round(duel.player.hp * 1000),
    Math.round(duel.enemy.hp * 1000),
    Math.round(duel.player.x * 1000),
    Math.round(duel.enemy.x * 1000),
    duel.tick,
  ];
};

describe('sim determinism', () => {
  it('same seed + same intent stream = same fight', () => {
    expect(signature(2026)).toEqual(signature(2026));
  });

  it('different seeds diverge', () => {
    expect(signature(2026)).not.toEqual(signature(9001));
  });
});
