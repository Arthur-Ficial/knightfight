import { describe, it, expect } from 'vitest';
import { pushComboToken } from '../src/sim/combos.ts';
import { RHYTHM_WINDOW } from '../src/config/index.ts';
import type { ComboTracker } from '../src/sim/state.ts';

const tracker = (): ComboTracker => ({ tokens: [], lastInputTick: -9999 });

describe('combo detection', () => {
  it('fires Rising Lion on left, right, high within the rhythm window', () => {
    const c = tracker();
    expect(pushComboToken(c, 'strikeL', 0, RHYTHM_WINDOW)).toBeNull();
    expect(pushComboToken(c, 'strikeR', 5, RHYTHM_WINDOW)).toBeNull();
    const fired = pushComboToken(c, 'strikeU', 10, RHYTHM_WINDOW);
    expect(fired?.name).toBe('Rising Lion');
  });

  it('expires the chain when an input arrives after the rhythm window', () => {
    const c = tracker();
    pushComboToken(c, 'strikeL', 0, RHYTHM_WINDOW);
    pushComboToken(c, 'strikeR', 5, RHYTHM_WINDOW);
    const fired = pushComboToken(c, 'strikeU', 5 + RHYTHM_WINDOW + 1, RHYTHM_WINDOW);
    expect(fired).toBeNull();
  });

  it('does not false-positive on an undefined sequence', () => {
    const c = tracker();
    pushComboToken(c, 'strikeL', 0, RHYTHM_WINDOW);
    expect(pushComboToken(c, 'strikeU', 3, RHYTHM_WINDOW)).toBeNull();
  });

  it('resets the chain after firing so it cannot double-fire', () => {
    const c = tracker();
    pushComboToken(c, 'strikeD', 0, RHYTHM_WINDOW);
    const first = pushComboToken(c, 'heavy', 5, RHYTHM_WINDOW);
    expect(first?.name).toBe('Earthbreaker');
    expect(c.tokens).toEqual([]);
  });

  it('detects the longest matching combo', () => {
    const c = tracker();
    pushComboToken(c, 'parry', 0, RHYTHM_WINDOW);
    pushComboToken(c, 'strikeR', 5, RHYTHM_WINDOW);
    pushComboToken(c, 'strikeL', 10, RHYTHM_WINDOW);
    const fired = pushComboToken(c, 'strikeU', 15, RHYTHM_WINDOW);
    expect(fired?.name).toBe('Riposte Royale');
  });
});
