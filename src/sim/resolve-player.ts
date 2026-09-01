import {
  ATTACK,
  LUNGE_STEP,
  ARENA,
  PARRY_STAGGER_TICKS,
  SLOWMO,
  HITSTOP,
  GUARDED_DAMAGE,
  EXECUTION_MULT,
} from '../config/index.ts';
import { chance } from '../core/rng.ts';
import { clamp } from '../core/math.ts';
import { computePlayerDamage, type DamageResult } from './damage.ts';
import { staggerEnemy } from './effects.ts';
import type { DuelState } from './state.ts';

// Resolves the player's active strike against the enemy: reach/whiff, the
// enemy's guard, stagger and execution windows, kill juice.

const gap = (duel: DuelState): number => Math.abs(duel.player.x - duel.enemy.x);

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

const applyToEnemy = (duel: DuelState, res: DamageResult): void => {
  const { player: p, enemy: e } = duel;
  const executing = e.phase === 'staggered';
  let guarded = !executing && e.guard > 0;
  if (guarded) {
    e.guard = Math.max(0, e.guard - res.guardDamage);
    if (res.guardBreak || e.guard <= 0) {
      e.guard = 0;
      guarded = false;
      duel.events.push({ kind: 'guardBreak', x: e.x });
      staggerEnemy(duel, PARRY_STAGGER_TICKS);
    }
  }
  const dmg = res.damage * (guarded ? GUARDED_DAMAGE : 1) * (executing ? EXECUTION_MULT : 1);
  e.hp -= dmg;
  const a = p.action;
  const rageGain = a ? ATTACK[a.name === 'dodge' || a.name === 'parry' ? 'light' : a.name].rageGain : 0;
  p.rage = Math.min(p.stats.maxRage, p.rage + rageGain * p.stats.rageGainMult);
  p.hp = Math.min(p.stats.maxHp, p.hp + dmg * p.stats.lifesteal);
  duel.hitstop = Math.max(duel.hitstop, res.hitstop);
  duel.shake = Math.max(duel.shake, dmg * 0.35 + (res.crit ? 4 : 0));
  if (a?.riposte) {
    duel.slowmo = Math.max(duel.slowmo, SLOWMO.parryTicks);
    duel.events.push({ kind: 'riposte', amount: dmg, x: e.x });
  } else {
    duel.events.push({ kind: 'playerHit', amount: dmg, crit: res.crit, x: e.x });
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

export const resolvePlayerAttack = (duel: DuelState): void => {
  const a = duel.player.action;
  if (a === null || a.phase !== 'active' || a.hasHit || a.name === 'dodge' || a.name === 'parry') {
    return;
  }
  const reach = ATTACK[a.name].reach;
  if (gap(duel) > reach) {
    a.hasHit = true;
    lunge(duel);
    duel.events.push({ kind: 'whiff' });
    return;
  }
  a.hasHit = true;
  if (mirrorParried(duel)) {
    return;
  }
  applyToEnemy(duel, computePlayerDamage(a, duel.player.stats, duel.rng));
};
