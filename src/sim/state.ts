import type { ArchetypeId, Dir4, TellColour } from '../core/types.ts';
import type { Rng } from '../core/rng.ts';
import type { PlayerActionName } from '../config/timings.ts';
import type { ComboToken, ComboEffect } from '../config/combos.ts';
import type { EnemyMove, EnemySpecial } from '../config/enemies.ts';
import type { GestureUnlock } from '../config/meta.ts';

// Sim state types. Pure data, no DOM. The whole simulation is a function of
// (state, intents) so seed + intent log fully determines a fight.

export type ActionPhase = 'windup' | 'active' | 'recovery';
export type EnemyPhase = 'idle' | 'telegraph' | 'active' | 'recovery' | 'staggered' | 'feint';
export type Outcome = 'fighting' | 'won' | 'lost';

/** Resolved player stats after boons + meta upgrades are applied. */
export interface EffectiveStats {
  readonly maxHp: number;
  readonly maxStamina: number;
  readonly maxRage: number;
  readonly staminaRegen: number;
  readonly staminaCostMult: number;
  readonly damageMult: number;
  readonly lightMult: number;
  readonly heavyMult: number;
  readonly riposteMult: number;
  readonly guardMult: number;
  readonly critChance: number;
  readonly critMult: number;
  readonly parryWindow: number;
  readonly dodgeIframes: number;
  readonly comboMaxMult: number;
  readonly rageGainMult: number;
  readonly lifesteal: number;
  readonly thorns: number;
  readonly bleed: number;
  readonly chipReduction: number;
}

export type ActionName = PlayerActionName | 'strike' | 'dodge' | 'parry';

export interface ActiveAction {
  name: ActionName;
  phase: ActionPhase;
  timer: number;
  windupLen: number;
  activeLen: number;
  recoveryLen: number;
  hasHit: boolean;
  dir: Dir4;
  chargeTier: number;
  comboMult: number;
  comboEffect: ComboEffect | null;
  riposte: boolean;
}

export interface ComboTracker {
  tokens: ComboToken[];
  lastInputTick: number;
}

export interface PlayerState {
  hp: number;
  stamina: number;
  rage: number;
  poise: number;
  x: number;
  facing: number;
  iframes: number;
  idleTicks: number;
  action: ActiveAction | null;
  chargeTicks: number;
  charging: boolean;
  blocking: boolean;
  dodgeDir: Dir4 | null;
  riposteWindow: number;
  stunTicks: number;
  focusTicks: number;
  bleedOnEnemy: number;
  combo: ComboTracker;
  stats: EffectiveStats;
  unlocked: ReadonlySet<GestureUnlock>;
}

export interface EnemyState {
  archetype: ArchetypeId;
  name: string;
  hp: number;
  maxHp: number;
  guard: number;
  guardMax: number;
  guardDir: Dir4;
  guardTimer: number;
  x: number;
  facing: number;
  phase: EnemyPhase;
  timer: number;
  move: EnemyMove | null;
  tell: TellColour | null;
  hasHit: boolean;
  staggerTicks: number;
  cooldown: number;
  aggression: number;
  feintChance: number;
  tempo: number;
  approachBias: number;
  damageMult: number;
  telegraphMult: number;
  special: EnemySpecial | null;
  phaseTwo: boolean;
  willFeint: boolean;
  poisonOnPlayer: number;
  addTimer: number;
}

export interface Projectile {
  x: number;
  vx: number;
  damage: number;
  dir: Dir4;
  alive: boolean;
}

export type SimEventKind =
  | 'playerHit'
  | 'enemyHitPlayer'
  | 'parry'
  | 'block'
  | 'blockBreak'
  | 'clang'
  | 'dodge'
  | 'guardBreak'
  | 'stagger'
  | 'riposte'
  | 'comboFire'
  | 'chargeRelease'
  | 'telegraph'
  | 'enemyAttack'
  | 'feint'
  | 'kill'
  | 'death'
  | 'projectile'
  | 'whiff'
  | 'busy'
  | 'focus'
  | 'poison'
  | 'special';

export interface SimEvent {
  readonly kind: SimEventKind;
  readonly amount?: number;
  readonly crit?: boolean;
  readonly tell?: TellColour;
  readonly dir?: Dir4;
  readonly label?: string;
  readonly x?: number;
}

export interface DuelState {
  tick: number;
  rung: number;
  outcome: Outcome;
  player: PlayerState;
  enemy: EnemyState;
  projectiles: Projectile[];
  rng: Rng;
  hitstop: number;
  slowmo: number;
  shake: number;
  perfectParryStreak: number;
  events: SimEvent[];
}
