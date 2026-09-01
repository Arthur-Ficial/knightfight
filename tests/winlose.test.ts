import { describe, it, expect } from 'vitest';
import { makeDuel } from './helpers.ts';
import { stepDuel } from '../src/sim/step.ts';
import { oppositeDir, type Intent } from '../src/core/types.ts';

describe('a duel can be won and lost', () => {
  it('an aggressive player defeats the Squire', () => {
    const d = makeDuel({ rung: 1 });
    d.player.x = 118;
    for (let t = 0; t < 1600 && d.outcome === 'fighting'; t += 1) {
      const intents: Intent[] = t % 8 === 0 ? [{ kind: 'strike', dir: oppositeDir(d.enemy.guardDir) }] : [];
      stepDuel(d, intents);
    }
    expect(d.outcome).toBe('won');
  });

  it('an idle player eventually dies to a dangerous enemy', () => {
    const d = makeDuel({ rung: 12 });
    for (let t = 0; t < 8000 && d.outcome === 'fighting'; t += 1) {
      stepDuel(d, []);
    }
    expect(d.outcome).toBe('lost');
  });
});
