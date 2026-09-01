import { describe, it, expect } from 'vitest';
import { makeDuel, step } from './helpers.ts';
import { resolveStats } from '../src/sim/modifiers.ts';

describe('combat maths', () => {
  it('a directional strike in range damages the enemy', () => {
    const d = makeDuel({ rung: 1 });
    d.player.x = 120;
    const hp0 = d.enemy.hp;
    step(d, 1, [{ kind: 'strike', dir: 'left' }]);
    step(d, 16);
    expect(d.enemy.hp).toBeLessThan(hp0);
  });

  it('spends stamina on an action and regenerates it while idle', () => {
    const d = makeDuel();
    const full = d.player.stamina;
    step(d, 1, [{ kind: 'strike', dir: 'up' }]);
    const spent = d.player.stamina;
    expect(spent).toBeLessThan(full);
    step(d, 160);
    expect(d.player.stamina).toBeGreaterThan(spent);
  });

  it('grants i-frames on a dodge and records its direction', () => {
    const d = makeDuel();
    step(d, 1, [{ kind: 'dodge', dir: 'left' }]);
    expect(d.player.iframes).toBeGreaterThan(0);
    expect(d.player.dodgeDir).toBe('left');
    expect(d.player.x).toBeLessThan(78);
  });

  it('erodes the guard meter on strikes', () => {
    const d = makeDuel({ rung: 4 });
    d.player.x = 120;
    const guard0 = d.enemy.guard;
    step(d, 1, [{ kind: 'strike', dir: 'down' }]);
    step(d, 24);
    expect(d.enemy.guard).toBeLessThan(guard0);
  });

  it('boon modifiers stack additively', () => {
    const base = resolveStats([]);
    const one = resolveStats([{ damageMult: 0.15 }]);
    const two = resolveStats([{ damageMult: 0.15 }, { damageMult: 0.15 }]);
    expect(one.damageMult).toBeCloseTo(1.15);
    expect(two.damageMult).toBeCloseTo(1.3);
    expect(resolveStats([{ maxHp: 25 }]).maxHp).toBe(base.maxHp + 25);
  });
});
