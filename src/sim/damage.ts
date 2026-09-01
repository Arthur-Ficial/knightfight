import {
  ATTACK,
  STRIKE,
  CHARGE_TIER_DAMAGE,
  CHARGE_GUARDBREAK_TIER,
  HITSTOP,
} from '../config/index.ts';
import { chance, type Rng } from '../core/rng.ts';
import type { AttackStats } from '../config/combat.ts';
import type { ActiveAction, EffectiveStats } from './state.ts';

// Pure damage maths for a connecting player strike. No state mutation.

export interface DamageResult {
  readonly damage: number;
  readonly crit: boolean;
  readonly guardDamage: number;
  readonly guardBreak: boolean;
  readonly stagger: boolean;
  readonly launcher: boolean;
  readonly hitstop: number;
}

const statFor = (action: ActiveAction): AttackStats =>
  action.name === 'strike' || action.name === 'dodge' || action.name === 'parry'
    ? STRIKE[action.dir]
    : ATTACK[action.name];

const weightOf = (action: ActiveAction): number => {
  if (action.riposte) {
    return HITSTOP.parry;
  }
  if (action.name === 'heavy' || action.name === 'whirlwind') {
    return HITSTOP.heavy;
  }
  if (action.dir === 'up' || action.dir === 'down') {
    return HITSTOP.medium;
  }
  return HITSTOP.light;
};

export const computePlayerDamage = (
  action: ActiveAction,
  stats: EffectiveStats,
  rng: Rng,
): DamageResult => {
  const stat = statFor(action);
  const tierMult = action.name === 'heavy' ? (CHARGE_TIER_DAMAGE[action.chargeTier] ?? 1) : 1;
  let mult = stats.damageMult * action.comboMult * tierMult;
  if (action.name === 'strike' || action.name === 'feint') {
    mult *= stats.lightMult;
  }
  if (action.name === 'heavy') {
    mult *= stats.heavyMult;
  }
  const crit = chance(rng, stats.critChance);
  if (crit) {
    mult *= stats.critMult;
  }
  if (action.riposte) {
    mult *= stats.riposteMult;
  }
  const effect = action.comboEffect;
  const bleed = stats.bleed + (effect?.bleed ? stats.bleed + 4 : 0);
  return {
    damage: stat.damage * mult + bleed,
    crit,
    guardDamage: stat.guardDamage * stats.guardMult * tierMult,
    guardBreak: (effect?.guardBreak ?? false) || (action.name === 'heavy' && action.chargeTier >= CHARGE_GUARDBREAK_TIER),
    stagger: effect?.stagger ?? false,
    launcher: effect?.launcher ?? false,
    hitstop: weightOf(action),
  };
};
