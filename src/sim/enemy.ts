import {
  ENEMY_SPEED,
  RANGED_KEEP,
  MELEE_CLOSE,
  ARENA,
  PROJECTILE_SPEED,
  PROJECTILE_DAMAGE,
  GUARD_REGEN,
  COUNTER,
  LADDER,
} from '../config/index.ts';
import { clamp, sign } from '../core/math.ts';
import { chance, pick } from '../core/rng.ts';
import { DIR4, type Dir4 } from '../core/types.ts';
import { decideEnemy } from './ai.ts';
import { counterDirForAttack } from './counter.ts';
import { resolveEnemyHit } from './defense.ts';
import type { DuelState, EnemyState } from './state.ts';

const guardDwell = (rung: number): number =>
  Math.max(LADDER.guardDwellMin, Math.round(LADDER.guardDwellBase - LADDER.guardDwellPerRung * (rung - 1)));

// Reads the player's wind-up and, skill-gated, commits a directional COUNTER on
// the matching line (shared SSOT counterDirForAttack). Low skill reads late and
// often wrong; high skill reads early and true. One read per player wind-up.
const decideCounter = (duel: DuelState): void => {
  const e = duel.enemy;
  const p = duel.player;
  const a = p.action;
  const winding = a !== null && a.name === 'strike' && a.phase === 'windup';
  if (!winding) {
    e.counterArmed = false;
    return;
  }
  if (e.counterArmed || e.counterSkill <= 0 || e.counterCooldown > 0 || (e.phase !== 'idle' && e.phase !== 'recovery')) {
    return;
  }
  if (Math.abs(e.x - p.x) > COUNTER.range) {
    return;
  }
  const prog = 1 - a.timer / Math.max(1, a.windupLen);
  const reactPoint = COUNTER.latestProg - (COUNTER.latestProg - COUNTER.earliestProg) * e.counterSkill;
  if (prog < reactPoint) {
    return;
  }
  e.counterArmed = true; // one read per wind-up, whatever the outcome
  if (!chance(duel.rng, e.counterSkill)) {
    return;
  }
  const correct = counterDirForAttack(a.dir);
  const dir = chance(duel.rng, e.counterSkill)
    ? correct
    : pick(duel.rng, DIR4.filter((d): d is Dir4 => d !== correct));
  e.phase = 'counter';
  e.counterDir = dir;
  e.timer = COUNTER.holdTicks;
  e.move = null;
  duel.events.push({ kind: 'counter', dir, x: e.x });
};

const shiftGuard = (duel: DuelState): void => {
  const e = duel.enemy;
  if (e.phase === 'staggered' || e.phase === 'counter') {
    return;
  }
  e.guardTimer -= 1;
  if (e.guardTimer <= 0) {
    e.guardDir = pick(duel.rng, DIR4.filter((d): d is Dir4 => d !== e.guardDir));
    e.guardTimer = guardDwell(duel.rung);
  }
};

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
    // Kite between shots, but once pinned in melee stop retreating and fight.
    if (dist < RANGED_KEEP && dist > MELEE_CLOSE) {
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

const fireProjectile = (duel: DuelState, attackDir: Dir4): void => {
  const e = duel.enemy;
  const vdir = duel.player.x < e.x ? -1 : 1;
  duel.projectiles.push({ x: e.x, vx: vdir * PROJECTILE_SPEED, damage: PROJECTILE_DAMAGE * e.damageMult, dir: attackDir, alive: true });
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
  duel.events.push({ kind: 'enemyAttack', dir: e.move.dir, x: e.x });
  if (e.move.ranged) {
    fireProjectile(duel, e.move.dir);
    e.hasHit = true;
  }
};

const resolveActiveHit = (duel: DuelState): void => {
  const e = duel.enemy;
  if (e.hasHit || e.move === null || e.move.ranged) {
    return;
  }
  if (Math.abs(e.x - duel.player.x) <= e.move.reach) {
    resolveEnemyHit(duel, e.move.damage, e.move.tell, e.move.dir);
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
    case 'counter':
      // Held the guard but the strike never came (baited/feinted): exposed window.
      if (e.timer <= 0) {
        e.phase = 'recovery';
        e.timer = COUNTER.recoverTicks;
        e.counterDir = null;
        e.counterCooldown = COUNTER.recoverTicks + COUNTER.cooldownTicks;
      }
      return;
  }
};

export const tickEnemy = (duel: DuelState): void => {
  if (duel.enemy.counterCooldown > 0) {
    duel.enemy.counterCooldown -= 1;
  }
  faceAndMove(duel);
  shiftGuard(duel);
  decideCounter(duel);
  advancePhase(duel);
  const e = duel.enemy;
  if (e.phase === 'idle' && e.guard < e.guardMax) {
    e.guard = Math.min(e.guardMax, e.guard + GUARD_REGEN);
  }
};

