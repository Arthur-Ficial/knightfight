import {
  ENEMY_SPEED,
  RANGED_KEEP,
  MELEE_CLOSE,
  ARENA,
  PROJECTILE_SPEED,
  PROJECTILE_DAMAGE,
  GUARD_REGEN,
} from '../config/index.ts';
import { clamp, sign } from '../core/math.ts';
import { decideEnemy } from './ai.ts';
import { resolveEnemyHit } from './defense.ts';
import type { DuelState, EnemyState } from './state.ts';

// Enemy locomotion + finite-state machine. Telegraph -> (feint | active) ->
// recovery -> idle. Movement only happens while idle so attacks are committed.

const faceAndMove = (duel: DuelState): void => {
  const e = duel.enemy;
  const p = duel.player;
  e.facing = p.x < e.x ? -1 : 1;
  if (e.phase !== 'idle') {
    return;
  }
  const s = sign(e.x - p.x) || 1;
  const dist = Math.abs(e.x - p.x);
  const speed = ENEMY_SPEED * e.tempo;
  if (e.approachBias < 0) {
    if (dist < RANGED_KEEP) {
      e.x += s * speed;
    } else if (dist > RANGED_KEEP + 40) {
      e.x -= s * speed;
    }
  } else if (dist > MELEE_CLOSE) {
    e.x -= s * speed;
  }
  const floor = s > 0 ? p.x + ARENA.minGap : 8;
  const ceil = s > 0 ? ARENA.width - 8 : p.x - ARENA.minGap;
  e.x = clamp(e.x, floor, ceil);
};

const fireProjectile = (duel: DuelState): void => {
  const e = duel.enemy;
  const dir = duel.player.x < e.x ? -1 : 1;
  duel.projectiles.push({ x: e.x, vx: dir * PROJECTILE_SPEED, damage: PROJECTILE_DAMAGE * e.damageMult, alive: true });
  duel.events.push({ kind: 'projectile', x: e.x });
};

const enterActive = (duel: DuelState): void => {
  const e = duel.enemy;
  if (e.move === null) {
    e.phase = 'idle';
    return;
  }
  if (e.willFeint) {
    e.phase = 'feint';
    e.timer = Math.max(4, Math.round(10 / e.tempo));
    e.willFeint = false;
    duel.events.push({ kind: 'feint', x: e.x });
    return;
  }
  e.phase = 'active';
  e.timer = e.move.active;
  e.hasHit = false;
  duel.events.push({ kind: 'enemyAttack', x: e.x });
  if (e.move.ranged) {
    fireProjectile(duel);
    e.hasHit = true;
  }
};

const resolveActiveHit = (duel: DuelState): void => {
  const e = duel.enemy;
  if (e.hasHit || e.move === null || e.move.ranged) {
    return;
  }
  if (Math.abs(e.x - duel.player.x) <= e.move.reach) {
    resolveEnemyHit(duel, e.move.damage, e.move.tell);
    e.hasHit = true;
  }
};

const idleCooldown = (e: EnemyState, base: number): number => Math.max(4, Math.round(base / e.tempo));

const advancePhase = (duel: DuelState): void => {
  const e = duel.enemy;
  if (e.timer > 0) {
    e.timer -= 1;
  }
  switch (e.phase) {
    case 'idle':
      if (e.cooldown > 0) {
        e.cooldown -= 1;
      } else {
        decideEnemy(duel);
      }
      return;
    case 'telegraph':
      if (e.timer <= 0) { enterActive(duel); }
      return;
    case 'active':
      resolveActiveHit(duel);
      if (e.timer <= 0 && e.move !== null) { e.phase = 'recovery'; e.timer = e.move.recovery; }
      return;
    case 'recovery':
      if (e.timer <= 0) { e.phase = 'idle'; e.move = null; e.tell = null; e.cooldown = idleCooldown(e, 20); }
      return;
    case 'staggered':
      if (e.timer <= 0) { e.phase = 'idle'; e.cooldown = idleCooldown(e, 16); }
      return;
    case 'feint':
      if (e.timer <= 0) { e.phase = 'idle'; e.move = null; e.tell = null; e.cooldown = idleCooldown(e, 12); }
      return;
  }
};

export const tickEnemy = (duel: DuelState): void => {
  faceAndMove(duel);
  advancePhase(duel);
  const e = duel.enemy;
  if (e.phase === 'idle' && e.guard < e.guardMax) {
    e.guard = Math.min(e.guardMax, e.guard + GUARD_REGEN);
  }
};

