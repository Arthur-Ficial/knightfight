import { TICK_MS } from '../core/loop.ts';
import { ARENA } from '../config/units.ts';
import {
  PLAYER_TIMING,
  STRIKE_TIMING,
  ATTACK,
  STRIKE,
  PARRY,
  DODGE_STAMINA,
  DODGE_STEP,
  CHARGE_TIER_MS,
  RHYTHM_WINDOW,
  SLOWMO,
} from '../config/index.ts';
import type { PlayerActionName } from '../config/timings.ts';
import type { ComboToken } from '../config/combos.ts';
import { clamp } from '../core/math.ts';
import type { Dir4, Intent } from '../core/types.ts';
import { pushComboToken } from './combos.ts';
import type { DuelState, PlayerState } from './state.ts';

// Turns Intents into committed player actions. Strikes and dodges are directional
// - the direction is the read. The only place a player action is born.

const STRIKE_TOKEN: Record<Dir4, ComboToken> = { up: 'strikeU', down: 'strikeD', left: 'strikeL', right: 'strikeR' };
const DODGE_TOKEN: Record<Dir4, ComboToken> = { up: 'dodgeU', down: 'dodgeD', left: 'dodgeL', right: 'dodgeR' };

const canAct = (p: PlayerState): boolean =>
  p.stunTicks <= 0 && p.action === null && !p.blocking && !p.charging;
const canDodge = (p: PlayerState): boolean =>
  p.stunTicks <= 0 && !p.blocking && (p.action === null || p.action.phase === 'recovery');

const spend = (p: PlayerState, cost: number): boolean => {
  const real = cost * p.stats.staminaCostMult;
  if (p.stamina < real) {
    return false;
  }
  p.stamina -= real;
  p.idleTicks = 0;
  return true;
};

const chargeTier = (ticks: number): number => {
  const ms = ticks * TICK_MS;
  let tier = 0;
  for (let i = 0; i < CHARGE_TIER_MS.length; i += 1) {
    if (ms >= (CHARGE_TIER_MS[i] ?? 0)) {
      tier = i;
    }
  }
  return tier;
};

const fireCombo = (duel: DuelState, token: ComboToken): { mult: number; effect: ReturnType<typeof pushComboToken> } => {
  const p = duel.player;
  const fired = pushComboToken(p.combo, token, duel.tick, RHYTHM_WINDOW);
  if (fired) {
    p.rage = Math.min(p.stats.maxRage, p.rage + fired.rageBonus * p.stats.rageGainMult);
    duel.events.push({ kind: 'comboFire', label: fired.name, amount: fired.multiplier });
  }
  return { mult: fired ? fired.multiplier : 1, effect: fired };
};

const beginStrike = (duel: DuelState, dir: Dir4): void => {
  const p = duel.player;
  const t = STRIKE_TIMING[dir];
  const c = fireCombo(duel, STRIKE_TOKEN[dir]);
  p.action = {
    name: 'strike', phase: 'windup', timer: t.windup, windupLen: t.windup, activeLen: t.active, recoveryLen: t.recovery,
    hasHit: false, dir, chargeTier: 0, comboMult: c.mult, comboEffect: c.effect?.effect ?? null, riposte: p.riposteWindow > 0,
  };
};

const beginSpecial = (duel: DuelState, name: PlayerActionName, token: ComboToken, tier: number): void => {
  const p = duel.player;
  const t = PLAYER_TIMING[name];
  const c = fireCombo(duel, token);
  p.action = {
    name, phase: 'windup', timer: t.windup, windupLen: t.windup, activeLen: t.active, recoveryLen: t.recovery,
    hasHit: false, dir: 'up', chargeTier: tier, comboMult: c.mult, comboEffect: c.effect?.effect ?? null, riposte: p.riposteWindow > 0,
  };
};

const startStrike = (duel: DuelState, dir: Dir4): void => {
  const p = duel.player;
  if (!canAct(p) || !spend(p, STRIKE[dir].stamina)) {
    return;
  }
  beginStrike(duel, dir);
};

const releaseHeavy = (duel: DuelState): void => {
  const p = duel.player;
  const tier = chargeTier(p.chargeTicks);
  p.charging = false;
  p.chargeTicks = 0;
  if (p.action !== null || !spend(p, ATTACK.heavy.stamina)) {
    return;
  }
  beginSpecial(duel, 'heavy', 'heavy', tier);
  duel.events.push({ kind: 'chargeRelease', amount: tier });
};

const startDodge = (duel: DuelState, dir: Dir4): void => {
  const p = duel.player;
  if (!canDodge(p) || !spend(p, DODGE_STAMINA)) {
    return;
  }
  p.iframes = p.stats.dodgeIframes;
  p.dodgeDir = dir;
  p.action = {
    name: 'dodge', phase: 'active', timer: p.stats.dodgeIframes, windupLen: 0,
    activeLen: p.stats.dodgeIframes, recoveryLen: Math.round(p.stats.dodgeIframes * 0.7),
    hasHit: false, dir, chargeTier: 0, comboMult: 1, comboEffect: null, riposte: false,
  };
  const move = dir === 'left' ? -DODGE_STEP : dir === 'right' ? DODGE_STEP : dir === 'up' ? -p.facing * DODGE_STEP * 0.7 : 0;
  p.x = clamp(p.x + move, 8, ARENA.width - 8);
  pushComboToken(p.combo, DODGE_TOKEN[dir], duel.tick, RHYTHM_WINDOW);
  duel.events.push({ kind: 'dodge', dir, x: p.x });
};

const startParry = (duel: DuelState): void => {
  const p = duel.player;
  if (!p.unlocked.has('parry') || !canAct(p)) {
    return;
  }
  p.action = {
    name: 'parry', phase: 'active', timer: p.stats.parryWindow, windupLen: 0,
    activeLen: p.stats.parryWindow, recoveryLen: PARRY.recovery, hasHit: false, dir: 'up',
    chargeTier: 0, comboMult: 1, comboEffect: null, riposte: false,
  };
  pushComboToken(p.combo, 'parry', duel.tick, RHYTHM_WINDOW);
};

const startWhirlwind = (duel: DuelState): void => {
  const p = duel.player;
  if (!p.unlocked.has('whirlwind') || !canAct(p) || p.rage < p.stats.maxRage) {
    return;
  }
  p.rage = 0;
  beginSpecial(duel, 'whirlwind', 'whirlwind', 0);
};

export const applyIntent = (duel: DuelState, intent: Intent): void => {
  const p = duel.player;
  switch (intent.kind) {
    case 'strike': return startStrike(duel, intent.dir);
    case 'feint': if (canAct(p) && spend(p, ATTACK.feint.stamina)) { beginSpecial(duel, 'feint', 'feint', 0); } return;
    case 'chargeStart': if (canAct(p)) { p.charging = true; p.chargeTicks = 0; } return;
    case 'chargeRelease': if (p.charging) { releaseHeavy(duel); } return;
    case 'dodge': return startDodge(duel, intent.dir);
    case 'parry': return startParry(duel);
    case 'blockStart': if (p.action === null) { p.blocking = true; } return;
    case 'blockEnd': p.blocking = false; return;
    case 'whirlwind': return startWhirlwind(duel);
    case 'focus':
      if (p.unlocked.has('focus')) {
        duel.slowmo = Math.max(duel.slowmo, SLOWMO.focusTicks);
        duel.events.push({ kind: 'focus' });
      }
      return;
  }
};
