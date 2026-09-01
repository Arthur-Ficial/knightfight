import { describe, it, expect } from 'vitest';
import { makeDuel, step } from './helpers.ts';
import { resolveEnemyHit } from '../src/sim/defense.ts';

describe('parry window', () => {
  it('a parry inside the window staggers the enemy and negates damage', () => {
    const d = makeDuel({ unlocked: ['parry'] });
    step(d, 1, [{ kind: 'parry' }]);
    expect(d.player.action?.name).toBe('parry');
    const hp0 = d.player.hp;
    resolveEnemyHit(d, 15, 'gold');
    expect(d.enemy.phase).toBe('staggered');
    expect(d.player.hp).toBe(hp0);
    expect(d.player.riposteWindow).toBeGreaterThan(0);
  });

  it('a gold hit after the parry window lands', () => {
    const d = makeDuel({ unlocked: ['parry'] });
    step(d, 1, [{ kind: 'parry' }]);
    step(d, 30);
    const hp0 = d.player.hp;
    resolveEnemyHit(d, 15, 'gold');
    expect(d.player.hp).toBeLessThan(hp0);
  });

  it('a red attack cannot be parried and must be dodged', () => {
    const d = makeDuel({ unlocked: ['parry'] });
    step(d, 1, [{ kind: 'parry' }]);
    const hp0 = d.player.hp;
    resolveEnemyHit(d, 15, 'red');
    expect(d.player.hp).toBeLessThan(hp0);
  });

  it('i-frames negate any hit including red', () => {
    const d = makeDuel();
    step(d, 1, [{ kind: 'dodge', dir: 'right' }]);
    const hp0 = d.player.hp;
    resolveEnemyHit(d, 20, 'red');
    expect(d.player.hp).toBe(hp0);
  });
});
