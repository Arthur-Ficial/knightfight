import { ARENA } from '../config/index.ts';
import { resolveEnemyHit } from './defense.ts';
import type { DuelState } from './state.ts';

// Advances crossbow bolts. A bolt is a red (unblockable) threat - it must be
// dodged. It resolves as a hit when it reaches the player's position.

const HIT_RADIUS = 10;

export const updateProjectiles = (duel: DuelState): void => {
  const p = duel.player;
  for (const proj of duel.projectiles) {
    if (!proj.alive) {
      continue;
    }
    proj.x += proj.vx;
    if (Math.abs(proj.x - p.x) <= HIT_RADIUS) {
      proj.alive = false;
      resolveEnemyHit(duel, proj.damage, 'red');
    } else if (proj.x < -20 || proj.x > ARENA.width + 20) {
      proj.alive = false;
    }
  }
  duel.projectiles = duel.projectiles.filter((proj) => proj.alive);
};
