import { TICK_MS } from '../core/loop.ts';
import { ARENA } from '../config/units.ts';
import {
  PLAYER_TIMING,
  ATTACK,
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
import type { Intent, Side } from '../core/types.ts';
import { pushComboToken } from './combos.ts';
import type { DuelState, PlayerState } from './state.ts';

// Turns Intents into committed player actions, respecting stamina, gesture
// unlocks and action-cancel rules. The only place a player action is born.

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

const beginAttack = (
  duel: DuelState,
  name: PlayerActionName,
  side: Side,
  token: ComboToken,
  tier: number,
): void => {
  const p = duel.player;
  const t = PLAYER_TIMING[name];
  const fired = pushComboToken(p.combo, token, duel.tick, RHYTHM_WINDOW);
  p.action = {
    name, phase: 'windup', timer: t.windup, windupLen: t.windup, activeLen: t.active, recoveryLen: t.recovery,
    hasHit: false, side, chargeTier: tier, comboMult: fired ? fired.multiplier : 1,
    comboEffect: fired ? fired.effect : null, riposte: p.riposteWindow > 0,
  };
  if (fired) {
    p.rage = Math.min(p.stats.maxRage, p.rage + fired.rageBonus * p.stats.rageGainMult);
    duel.events.push({ kind: 'comboFire', label: fired.name, amount: fired.multiplier });
  }
};

const startStrike = (duel: DuelState, name: PlayerActionName, side: Side, token: ComboToken): void => {
  const p = duel.player;
  if (!canAct(p) || !spend(p, ATTACK[name].stamina)) {
    return;
  }
  beginAttack(duel, name, side, token, 0);
};

const releaseHeavy = (duel: DuelState): void => {
  const p = duel.player;
  const tier = chargeTier(p.chargeTicks);
  p.charging = false;
  p.chargeTicks = 0;
  if (p.action !== null || !spend(p, ATTACK.heavy.stamina)) {
    return;
  }
  beginAttack(duel, 'heavy', 'center', 'heavy', tier);
  duel.events.push({ kind: 'chargeRelease', amount: tier });
};

const startDodge = (duel: DuelState, dir: 'left' | 'right'): void => {
  const p = duel.player;
  if (!canDodge(p) || !spend(p, DODGE_STAMINA)) {
    return;
  }
  p.iframes = p.stats.dodgeIframes;
  p.action = {
    name: 'dodge', phase: 'active', timer: p.stats.dodgeIframes, windupLen: 0,
    activeLen: p.stats.dodgeIframes, recoveryLen: Math.round(p.stats.dodgeIframes * 0.7),
    hasHit: false, side: 'center', chargeTier: 0, comboMult: 1, comboEffect: null, riposte: false,
  };
  p.x = clamp(p.x + (dir === 'left' ? -DODGE_STEP : DODGE_STEP), 8, ARENA.width - 8);
  pushComboToken(p.combo, dir === 'left' ? 'dodgeL' : 'dodgeR', duel.tick, RHYTHM_WINDOW);
  duel.events.push({ kind: 'dodge', x: p.x });
};

const startParry = (duel: DuelState): void => {
  const p = duel.player;
  if (!p.unlocked.has('parry') || !canAct(p)) {
    return;
  }
  p.action = {
    name: 'parry', phase: 'active', timer: p.stats.parryWindow, windupLen: 0,
    activeLen: p.stats.parryWindow, recoveryLen: PARRY.recovery, hasHit: false, side: 'center',
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
  beginAttack(duel, 'whirlwind', 'center', 'whirlwind', 0);
};

export const applyIntent = (duel: DuelState, intent: Intent): void => {
  const p = duel.player;
  switch (intent.kind) {
    case 'light': return startStrike(duel, 'light', intent.side, 'tap');
    case 'feint': return startStrike(duel, 'feint', 'center', 'feint');
    case 'overhead': return startStrike(duel, 'overhead', 'center', 'overhead');
    case 'sweep': return startStrike(duel, 'sweep', 'center', 'sweep');
    case 'slash': return startStrike(duel, 'slash', 'center', 'slash');
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
