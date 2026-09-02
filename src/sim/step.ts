import type { Intent } from '../core/types.ts';
import { logEvent } from '../core/log.ts';
import { applyIntent } from './player-actions.ts';
import { tickPlayer } from './player-tick.ts';
import { tickEnemy } from './enemy.ts';
import { resolvePlayerAttack } from './resolve-player.ts';
import { updateProjectiles } from './projectiles.ts';
import { applySpecials } from './specials.ts';
import type { DuelState } from './state.ts';

// The single deterministic sim entry point. stepDuel(state, intents) advances
// exactly one 1/60s tick. Same seed + same intent stream = same fight.

const SHAKE_DECAY = 0.85;

const drainJuiceOnly = (duel: DuelState): void => {
  if (duel.slowmo > 0) {
    duel.slowmo -= 1;
  }
  duel.shake = duel.shake > 0.1 ? duel.shake * SHAKE_DECAY : 0;
};

const logTick = (duel: DuelState): void => {
  for (const ev of duel.events) {
    // dir is the whole read of the fight: it lets __KF_LOG prove that the strike
    // input, the telegraph, the animation clip and the resolved hit all agree.
    logEvent(duel.tick, ev.kind, {
      amount: ev.amount ?? 0,
      label: ev.label ?? '',
      ...(ev.dir !== undefined ? { dir: ev.dir } : {}),
      ...(ev.tell !== undefined ? { tell: ev.tell } : {}),
    });
  }
  if (duel.tick % 60 === 0) {
    logEvent(duel.tick, 'state', {
      hp: Math.round(duel.player.hp),
      stamina: Math.round(duel.player.stamina),
      rage: Math.round(duel.player.rage),
      enemyHp: Math.round(duel.enemy.hp),
      rung: duel.rung,
    });
  }
};

export const stepDuel = (duel: DuelState, intents: readonly Intent[]): DuelState => {
  duel.events = [];
  if (duel.outcome !== 'fighting') {
    drainJuiceOnly(duel);
    return duel;
  }
  if (duel.hitstop > 0) {
    duel.hitstop -= 1;
    drainJuiceOnly(duel);
    return duel;
  }
  duel.tick += 1;
  drainJuiceOnly(duel);
  for (const intent of intents) {
    applyIntent(duel, intent);
  }
  tickPlayer(duel);
  tickEnemy(duel);
  resolvePlayerAttack(duel);
  updateProjectiles(duel);
  applySpecials(duel);
  logTick(duel);
  return duel;
};
