import { describe, it, expect } from 'vitest';
import { makeDuel, step } from './helpers.ts';
import { resolveEnemyHit } from '../src/sim/defense.ts';

describe('parry and directional defence', () => {
  it('a parry inside the window staggers the enemy and negates damage', () => {
    const d = makeDuel({ unlocked: ['parry'] });
    step(d, 1, [{ kind: 'parry' }]);
    expect(d.player.action?.name).toBe('parry');
    const hp0 = d.player.hp;
    resolveEnemyHit(d, 15, 'gold', 'up');
    expect(d.enemy.phase).toBe('staggered');
    expect(d.player.hp).toBe(hp0);
    expect(d.player.riposteWindow).toBeGreaterThan(0);
  });

  it('a gold hit after the parry window lands', () => {
    const d = makeDuel({ unlocked: ['parry'] });
    step(d, 1, [{ kind: 'parry' }]);
    step(d, 30);
    const hp0 = d.player.hp;
    resolveEnemyHit(d, 15, 'gold', 'up');
    expect(d.player.hp).toBeLessThan(hp0);
  });

  it('a red attack cannot be parried - it must be dodged', () => {
    const d = makeDuel({ unlocked: ['parry'] });
    step(d, 1, [{ kind: 'parry' }]);
    const hp0 = d.player.hp;
    resolveEnemyHit(d, 15, 'red', 'up');
    expect(d.player.hp).toBeLessThan(hp0);
  });

  it('a matching-direction dodge negates the hit and opens a riposte', () => {
    const d = makeDuel();
    step(d, 1, [{ kind: 'dodge', dir: 'right' }]);
    const hp0 = d.player.hp;
    resolveEnemyHit(d, 20, 'red', 'right');
    expect(d.player.hp).toBe(hp0);
    expect(d.player.riposteWindow).toBeGreaterThan(0);
  });

  it('a wrong-direction dodge eats the hit', () => {
    const d = makeDuel();
    step(d, 1, [{ kind: 'dodge', dir: 'right' }]);
    const hp0 = d.player.hp;
    resolveEnemyHit(d, 20, 'red', 'left');
    expect(d.player.hp).toBeLessThan(hp0);
  });
});
