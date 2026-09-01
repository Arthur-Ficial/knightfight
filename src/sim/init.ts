import { PLAYER } from '../config/index.ts';
import { ARENA } from '../config/units.ts';
import type { Rng } from '../core/rng.ts';
import type { GestureUnlock } from '../config/meta.ts';
import { buildEnemy } from './ladder.ts';
import type { DuelState, EffectiveStats, PlayerState } from './state.ts';

// Construct fresh sim state for a duel. No side effects.

export const createPlayer = (
  stats: EffectiveStats,
  unlocked: ReadonlySet<GestureUnlock>,
): PlayerState => ({
  hp: stats.maxHp,
  stamina: stats.maxStamina,
  rage: 0,
  poise: PLAYER.maxPoise,
  x: ARENA.playerStartX,
  facing: 1,
  iframes: 0,
  idleTicks: 0,
  action: null,
  chargeTicks: 0,
  charging: false,
  blocking: false,
  riposteWindow: 0,
  stunTicks: 0,
  focusTicks: 0,
  bleedOnEnemy: stats.bleed,
  combo: { tokens: [], lastInputTick: -9999 },
  stats,
  unlocked,
});

export const createDuel = (
  rung: number,
  rng: Rng,
  stats: EffectiveStats,
  unlocked: ReadonlySet<GestureUnlock>,
): DuelState => ({
  tick: 0,
  rung,
  outcome: 'fighting',
  player: createPlayer(stats, unlocked),
  enemy: buildEnemy(rung, rng),
  projectiles: [],
  rng,
  hitstop: 0,
  slowmo: 0,
  shake: 0,
  perfectParryStreak: 0,
  events: [],
});
