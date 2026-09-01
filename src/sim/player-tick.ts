import { PLAYER, BLOCK } from '../config/index.ts';
import type { DuelState, PlayerState } from './state.ts';

// Advances the player each tick: action phase machine, stamina/rage/poise
// economy, i-frame and window countdowns. No hit resolution here (see combat).

const advanceAction = (p: PlayerState): void => {
  const a = p.action;
  if (a === null) {
    return;
  }
  a.timer -= 1;
  if (a.timer > 0) {
    return;
  }
  if (a.phase === 'windup') {
    a.phase = 'active';
    a.timer = a.activeLen;
    a.hasHit = false;
  } else if (a.phase === 'active') {
    a.phase = 'recovery';
    a.timer = a.recoveryLen;
  } else {
    p.action = null;
  }
};

export const tickPlayer = (duel: DuelState): void => {
  const p = duel.player;
  if (p.charging) {
    p.chargeTicks += 1;
    p.idleTicks = 0;
  }
  if (p.stunTicks > 0) {
    p.stunTicks -= 1;
  }
  advanceAction(p);
  if (p.iframes > 0) {
    p.iframes -= 1;
  }
  if (p.riposteWindow > 0) {
    p.riposteWindow -= 1;
  }
  if (p.blocking) {
    p.stamina = Math.max(0, p.stamina - BLOCK.drainPerTick);
    if (p.stamina <= 0) {
      p.blocking = false;
    }
  }
  const acting = p.action !== null || p.charging || p.blocking;
  if (acting) {
    p.idleTicks = 0;
  } else {
    p.idleTicks += 1;
  }
  if (p.idleTicks >= PLAYER.staminaRegenDelay) {
    p.stamina = Math.min(p.stats.maxStamina, p.stamina + p.stats.staminaRegen);
  }
  p.rage = Math.max(0, p.rage - PLAYER.rageDecayPerTick);
  p.poise = Math.min(PLAYER.maxPoise, p.poise + PLAYER.poiseRegenPerTick);
};
