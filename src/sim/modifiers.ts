import { clamp01 } from '../core/math.ts';
import {
  PLAYER,
  CRIT,
  PARRY,
  DODGE,
  COMBO_MAX_MULT,
  RIPOSTE_DAMAGE_MULT,
} from '../config/index.ts';
import type { ModBag, ModKey } from '../config/boons.ts';
import type { EffectiveStats } from './state.ts';

// Resolve a stack of modifier bags (boons + meta upgrades) into final player
// stats. Multiplicative keys stack additively as percentages; additive keys sum.

export const sumMods = (bags: readonly ModBag[]): Map<ModKey, number> => {
  const total = new Map<ModKey, number>();
  for (const bag of bags) {
    for (const key of Object.keys(bag) as ModKey[]) {
      total.set(key, (total.get(key) ?? 0) + (bag[key] ?? 0));
    }
  }
  return total;
};

const get = (mods: Map<ModKey, number>, key: ModKey): number => mods.get(key) ?? 0;

export const resolveStats = (bags: readonly ModBag[]): EffectiveStats => {
  const m = sumMods(bags);
  return {
    maxHp: PLAYER.maxHp + get(m, 'maxHp'),
    maxStamina: PLAYER.maxStamina + get(m, 'maxStamina'),
    maxRage: PLAYER.maxRage + get(m, 'maxRage'),
    staminaRegen: PLAYER.staminaRegenPerTick * (1 + get(m, 'staminaRegenMult')),
    staminaCostMult: Math.max(0.2, 1 + get(m, 'staminaCostMult')),
    damageMult: Math.max(0.1, 1 + get(m, 'damageMult')),
    lightMult: 1 + get(m, 'lightDamageMult'),
    heavyMult: 1 + get(m, 'heavyDamageMult'),
    riposteMult: RIPOSTE_DAMAGE_MULT * (1 + get(m, 'riposteDamageMult')),
    guardMult: 1 + get(m, 'guardDamageMult'),
    critChance: clamp01(CRIT.baseChance + get(m, 'critChance')),
    critMult: CRIT.multiplier + get(m, 'critMult'),
    parryWindow: PARRY.window + Math.round(get(m, 'parryWindow')),
    dodgeIframes: DODGE.iframes + Math.round(get(m, 'dodgeIframes')),
    comboMaxMult: COMBO_MAX_MULT + get(m, 'comboMaxMult'),
    rageGainMult: 1 + get(m, 'rageGainMult'),
    lifesteal: Math.max(0, get(m, 'lifesteal')),
    thorns: Math.max(0, get(m, 'thorns')),
    bleed: Math.max(0, get(m, 'bleed')),
    chipReduction: clamp01(get(m, 'chipReduction')),
  };
};
