import { ARCHETYPE_BY_ID } from '../config/index.ts';
import type { EnemyMove } from '../config/enemies.ts';
import { chance, nextFloat, type Rng } from '../core/rng.ts';
import type { DuelState, EnemyState } from './state.ts';

// Enemy decision-making. Pure choices; the FSM in enemy.ts applies them.

const movesFor = (e: EnemyState): readonly EnemyMove[] => {
  const def = ARCHETYPE_BY_ID.get(e.archetype);
  return def ? def.moves : [];
};

/** Pick an in-range move, weighted toward heavier hits when the player is open. */
export const chooseMove = (e: EnemyState, gap: number, rng: Rng): EnemyMove | null => {
  const inRange = movesFor(e).filter((m) => m.reach >= gap);
  if (inRange.length === 0) {
    return null;
  }
  const index = Math.floor(nextFloat(rng) * inRange.length);
  return inRange[index] ?? null;
};

const decisionCooldown = (e: EnemyState): number => Math.round(24 / e.tempo);

export const decideEnemy = (duel: DuelState): void => {
  const e = duel.enemy;
  const gap = Math.abs(e.x - duel.player.x);
  const move = chooseMove(e, gap, duel.rng);
  if (move === null) {
    e.cooldown = 6;
    return;
  }
  if (!chance(duel.rng, e.aggression)) {
    e.cooldown = decisionCooldown(e);
    return;
  }
  e.move = move;
  e.tell = move.tell;
  e.phase = 'telegraph';
  e.timer = Math.max(3, Math.round(move.windup * e.telegraphMult));
  e.hasHit = false;
  e.willFeint = move.canFeint && chance(duel.rng, e.feintChance);
  duel.events.push({ kind: 'telegraph', tell: move.tell, label: move.id, x: e.x });
};
