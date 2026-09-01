import type { PlayerActionName } from './timings.ts';

// All combat magnitudes. No damage/stamina/guard number may appear anywhere
// else in the codebase. This is the combat SSOT.

export const PLAYER = {
  maxHp: 100,
  maxStamina: 100,
  maxRage: 100,
  /** Stamina regenerated per tick once the idle delay has elapsed. */
  staminaRegenPerTick: 0.9,
  /** Ticks of inaction required before stamina begins to regen. */
  staminaRegenDelay: 24,
  /** Rage decays slowly when not fighting. */
  rageDecayPerTick: 0.03,
  /** Poise: absorbs stagger; recovers over time. */
  maxPoise: 60,
  poiseRegenPerTick: 0.4,
} as const;

/** Base damage + stamina cost + rage gain per player action. */
export interface AttackStats {
  readonly damage: number;
  readonly stamina: number;
  readonly rageGain: number;
  /** Damage dealt to the enemy guard meter when blocked/on guard. */
  readonly guardDamage: number;
  /** Melee reach in arena units. */
  readonly reach: number;
}

export const ATTACK: Record<PlayerActionName, AttackStats> = {
  light: { damage: 7, stamina: 6, rageGain: 5, guardDamage: 6, reach: 46 },
  feint: { damage: 11, stamina: 8, rageGain: 7, guardDamage: 8, reach: 46 },
  overhead: { damage: 18, stamina: 20, rageGain: 12, guardDamage: 22, reach: 50 },
  sweep: { damage: 12, stamina: 16, rageGain: 10, guardDamage: 30, reach: 44 },
  slash: { damage: 14, stamina: 12, rageGain: 9, guardDamage: 14, reach: 48 },
  heavy: { damage: 26, stamina: 24, rageGain: 16, guardDamage: 40, reach: 52 },
  whirlwind: { damage: 40, stamina: 0, rageGain: 0, guardDamage: 60, reach: 60 },
};

/** Charge tier 0..3 multiplies heavy damage and guard damage. */
export const CHARGE_TIER_DAMAGE = [1, 1.35, 1.8, 2.6] as const;
/** Tier 3 heavy breaks guard outright. */
export const CHARGE_GUARDBREAK_TIER = 3;

export const DODGE_STAMINA = 12;
export const BLOCK = {
  /** Stamina drained per tick while blocking. */
  drainPerTick: 0.8,
  /** Fraction of incoming damage that leaks through a block as chip. */
  chipFraction: 0.15,
  /** Block breaks if a single hit's guard damage exceeds remaining stamina. */
  breakStaminaFloor: 8,
} as const;

export const CRIT = {
  baseChance: 0.08,
  multiplier: 1.9,
} as const;

/** While an enemy's guard holds, hits are largely absorbed - break it first. */
export const GUARDED_DAMAGE = 0.4;
/** Execution damage bonus while an enemy is staggered / guard-broken. */
export const EXECUTION_MULT = 1.4;
/** Enemy guard recovers slowly while idle. */
export const GUARD_REGEN = 0.25;

/** Riposte massively amplifies the strike that follows a parry. */
export const RIPOSTE_DAMAGE_MULT = 3.2;
/** Perfect-parry rewards. */
export const PARRY_RAGE_GAIN = 22;
export const PARRY_STAGGER_TICKS = 42;

/** Combo multiplier ramps with chain length; capped so it stays fair. */
export const COMBO_STEP_MULT = 0.12;
export const COMBO_MAX_MULT = 2.4;

/** Lunge forward (arena units) when an attack is thrown out of reach. Must let
 *  the player close on a kiting ranged enemy faster than it can retreat. */
export const LUNGE_STEP = 20;
/** Sideways/backward travel of a dodge. */
export const DODGE_STEP = 26;

/** Getting hit mid-action (windup/active/recovery) is punished. */
export const PUNISH_MULT = 1.5;
/** Poise breaking stuns the player briefly. */
export const PLAYER_STUN_TICKS = 18;
export const POISE_HIT = 18;

/** Plague Knight poison damage-over-time on the player. */
export const POISON = {
  dps: 0.25,
  ticks: 180,
  maxStacks: 4,
} as const;

