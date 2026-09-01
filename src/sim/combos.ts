import { COMBOS, MAX_COMBO_LEN, type ComboDef, type ComboToken } from '../config/combos.ts';
import type { ComboTracker } from './state.ts';

// Combo recognition. Tokens accumulate as the player acts; if inputs arrive
// inside the rhythm window they chain. A completed sequence fires its combo and
// resets the chain (no overlapping double-fires). Misses just let the tail grow.

const BY_LENGTH: readonly ComboDef[] = [...COMBOS].sort(
  (a, b) => b.sequence.length - a.sequence.length,
);

const tailMatches = (tokens: readonly ComboToken[], seq: readonly ComboToken[]): boolean => {
  if (tokens.length < seq.length) {
    return false;
  }
  const offset = tokens.length - seq.length;
  for (let i = 0; i < seq.length; i += 1) {
    if (tokens[offset + i] !== seq[i]) {
      return false;
    }
  }
  return true;
};

export const pushComboToken = (
  combo: ComboTracker,
  token: ComboToken,
  tick: number,
  rhythmWindow: number,
): ComboDef | null => {
  if (tick - combo.lastInputTick > rhythmWindow) {
    combo.tokens = [];
  }
  combo.lastInputTick = tick;
  combo.tokens.push(token);
  if (combo.tokens.length > MAX_COMBO_LEN) {
    combo.tokens.splice(0, combo.tokens.length - MAX_COMBO_LEN);
  }
  for (const def of BY_LENGTH) {
    if (tailMatches(combo.tokens, def.sequence)) {
      combo.tokens = [];
      return def;
    }
  }
  return null;
};

/** Current chain length (for HUD combo counter and multiplier). */
export const comboChainLength = (combo: ComboTracker, tick: number, rhythmWindow: number): number =>
  tick - combo.lastInputTick > rhythmWindow ? 0 : combo.tokens.length;
