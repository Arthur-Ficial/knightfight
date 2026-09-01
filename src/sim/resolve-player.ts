import {
  ATTACK,
  STRIKE,
  LUNGE_STEP,
  ARENA,
  PARRY_STAGGER_TICKS,
  SLOWMO,
  HITSTOP,
  GUARDED_DAMAGE,
  EXECUTION_MULT,
  OPEN_HIT_BONUS,
} from '../config/index.ts';
import { chance } from '../core/rng.ts';
import { clamp } from '../core/math.ts';
import { computePlayerDamage, type DamageResult } from './damage.ts';
import { staggerEnemy } from './effects.ts';
import type { ActiveAction, DuelState } from './state.ts';

// Resolves the player's active strike against the enemy. The core read: a strike
// into the GUARDED direction is chipped (clang); a strike into the OPEN direction
// lands full damage and erodes the guard meter toward a break + execution window.

const gap = (duel: DuelState): number => Math.abs(duel.player.x - duel.enemy.x);
const reachOf = (a: ActiveAction): number => (a.name === 'strike' ? STRIKE[a.dir].reach : ATTACK[a.name === 'dodge' || a.name === 'parry' ? 'feint' : a.name].reach);
const rageOf = (a: ActiveAction): number => (a.name === 'strike' ? STRIKE[a.dir].rageGain : ATTACK[a.name === 'dodge' || a.name === 'parry' ? 'feint' : a.name].rageGain);

const lunge = (duel: DuelState): void => {
  const { player: p, enemy: e } = duel;
  const dir = e.x > p.x ? 1 : -1;
  const next = p.x + dir * LUNGE_STEP;
  p.x = clamp(Math.abs(next - e.x) < ARENA.minGap ? e.x - dir * ARENA.minGap : next, 8, ARENA.width - 8);
};

const mirrorParried = (duel: DuelState): boolean => {
  const { player: p, enemy: e } = duel;
  const a = p.action;
  if (a === null || e.special !== 'mirrorParry' || a.riposte || a.name === 'heavy') {
    return false;
  }
  if (e.phase !== 'idle' && e.phase !== 'recovery') {
    return false;
  }
  if (!chance(duel.rng, 0.2 + 0.3 * e.aggression)) {
    return false;
  }
  a.phase = 'recovery';
  a.timer = a.recoveryLen;
  p.poise = Math.max(0, p.poise - 20);
  duel.events.push({ kind: 'parry', label: 'enemy', x: e.x });
  return true;
};

const onBlocked = (duel: DuelState, res: DamageResult, a: ActiveAction): void => {
  const { player: p, enemy: e } = duel;
  e.guard = Math.max(0, e.guard - res.guardDamage * 0.3);
  const dmg = res.damage * GUARDED_DAMAGE;
  e.hp -= dmg;
  p.rage = Math.min(p.stats.maxRage, p.rage + rageOf(a) * 0.4 * p.stats.rageGainMult);
  duel.hitstop = Math.max(duel.hitstop, HITSTOP.light);
  duel.shake = Math.max(duel.shake, 2);
  duel.events.push({ kind: 'clang', dir: a.dir, x: e.x });
};

const finishHit = (duel: DuelState, res: DamageResult, a: ActiveAction, dmg: number): void => {
  const { player: p, enemy: e } = duel;
  e.hp -= dmg;
  p.rage = Math.min(p.stats.maxRage, p.rage + rageOf(a) * p.stats.rageGainMult);
  p.hp = Math.min(p.stats.maxHp, p.hp + dmg * p.stats.lifesteal);
  duel.hitstop = Math.max(duel.hitstop, res.hitstop);
  duel.shake = Math.max(duel.shake, dmg * 0.5 + (res.crit ? 4 : 0));
  if (a.riposte) {
    duel.slowmo = Math.max(duel.slowmo, SLOWMO.parryTicks);
    duel.events.push({ kind: 'riposte', amount: dmg, x: e.x });
  } else {
    duel.events.push({ kind: 'playerHit', amount: dmg, crit: res.crit, dir: a.dir, x: e.x });
  }
  if (e.hp <= 0) {
    e.hp = 0;
    duel.outcome = 'won';
    duel.slowmo = Math.max(duel.slowmo, SLOWMO.killTicks);
    duel.hitstop = Math.max(duel.hitstop, HITSTOP.kill);
    duel.shake = Math.max(duel.shake, 10);
    duel.events.push({ kind: 'kill', x: e.x });
  }
};

const applyToEnemy = (duel: DuelState, res: DamageResult, blocked: boolean): void => {
  const { player: p, enemy: e } = duel;
  const a = p.action;
  if (a === null) {
    return;
  }
  if (blocked) {
    onBlocked(duel, res, a);
    return;
  }
  const executing = e.phase === 'staggered';
  if (!executing && e.guard > 0) {
    e.guard = Math.max(0, e.guard - res.guardDamage);
    if (res.guardBreak || e.guard <= 0) {
      e.guard = 0;
      duel.events.push({ kind: 'guardBreak', x: e.x });
      staggerEnemy(duel, PARRY_STAGGER_TICKS);
    }
  }
  finishHit(duel, res, a, res.damage * (executing ? EXECUTION_MULT : 1) * OPEN_HIT_BONUS);
};

export const resolvePlayerAttack = (duel: DuelState): void => {
  const a = duel.player.action;
  const e = duel.enemy;
  if (a === null || a.phase !== 'active' || a.hasHit || a.name === 'dodge' || a.name === 'parry') {
    return;
  }
  if (gap(duel) > reachOf(a)) {
    a.hasHit = true;
    lunge(duel);
    duel.events.push({ kind: 'whiff' });
    return;
  }
  a.hasHit = true;
  if (mirrorParried(duel)) {
    return;
  }
  const blocked = a.name === 'strike' && a.dir === e.guardDir && e.phase !== 'staggered';
  applyToEnemy(duel, computePlayerDamage(a, duel.player.stats, duel.rng), blocked);
};
