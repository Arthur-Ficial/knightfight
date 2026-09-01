import { describe, it, expect } from 'vitest';
import { pushComboToken } from '../src/sim/combos.ts';
import { RHYTHM_WINDOW } from '../src/config/index.ts';
import type { ComboTracker } from '../src/sim/state.ts';

const tracker = (): ComboTracker => ({ tokens: [], lastInputTick: -9999 });

describe('combo detection', () => {
  it('fires Rising Lion on tap, tap, overhead within the rhythm window', () => {
    const c = tracker();
    expect(pushComboToken(c, 'tap', 0, RHYTHM_WINDOW)).toBeNull();
    expect(pushComboToken(c, 'tap', 5, RHYTHM_WINDOW)).toBeNull();
    const fired = pushComboToken(c, 'overhead', 10, RHYTHM_WINDOW);
    expect(fired?.name).toBe('Rising Lion');
  });

  it('expires the chain when an input arrives after the rhythm window', () => {
    const c = tracker();
    pushComboToken(c, 'tap', 0, RHYTHM_WINDOW);
    pushComboToken(c, 'tap', 5, RHYTHM_WINDOW);
    const fired = pushComboToken(c, 'overhead', 5 + RHYTHM_WINDOW + 1, RHYTHM_WINDOW);
    expect(fired).toBeNull();
  });

  it('does not false-positive on an undefined sequence', () => {
    const c = tracker();
    pushComboToken(c, 'tap', 0, RHYTHM_WINDOW);
    expect(pushComboToken(c, 'overhead', 3, RHYTHM_WINDOW)).toBeNull();
  });

  it('resets the chain after firing so it cannot double-fire', () => {
    const c = tracker();
    pushComboToken(c, 'sweep', 0, RHYTHM_WINDOW);
    const first = pushComboToken(c, 'heavy', 5, RHYTHM_WINDOW);
    expect(first?.name).toBe('Earthbreaker');
    expect(c.tokens).toEqual([]);
  });

  it('detects the longest matching combo', () => {
    const c = tracker();
    pushComboToken(c, 'parry', 0, RHYTHM_WINDOW);
    pushComboToken(c, 'tap', 5, RHYTHM_WINDOW);
    pushComboToken(c, 'tap', 10, RHYTHM_WINDOW);
    const fired = pushComboToken(c, 'slash', 15, RHYTHM_WINDOW);
    expect(fired?.name).toBe('Riposte Royale');
  });
});
