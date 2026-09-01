import { POISON, HOUND_INTERVAL, HOUND_DAMAGE, SLOWMO } from '../config/index.ts';
import { resolveEnemyHit } from './defense.ts';
import type { DuelState } from './state.ts';

// Archetype specials that run passively each tick: poison DoT, enrage, boss
// phase changes, and summoned-add attacks.

const poisonTick = (duel: DuelState): void => {
  const e = duel.enemy;
  const p = duel.player;
  if (e.poisonOnPlayer <= 0) {
    return;
  }
  p.hp -= POISON.dps;
  e.poisonOnPlayer -= 1;
  if (e.poisonOnPlayer % 20 === 0) {
    duel.events.push({ kind: 'poison', x: p.x });
  }
  if (p.hp <= 0 && duel.outcome === 'fighting') {
    p.hp = 0;
    duel.outcome = 'lost';
    duel.slowmo = Math.max(duel.slowmo, SLOWMO.killTicks);
    duel.events.push({ kind: 'death', x: p.x });
  }
};

const enrageTick = (duel: DuelState): void => {
  const e = duel.enemy;
  if (e.phaseTwo || e.hp > e.maxHp * 0.5) {
    return;
  }
  if (e.special === 'enrageOnLowHp') {
    e.phaseTwo = true;
    e.tempo *= 1.25;
    e.aggression = Math.min(0.9, e.aggression + 0.15);
    e.telegraphMult *= 0.85;
    duel.events.push({ kind: 'special', label: 'enrage', x: e.x });
  } else if (e.special === 'multiphase' || e.special === 'allMechanics') {
    e.phaseTwo = true;
    e.tempo *= 1.2;
    e.aggression = Math.min(0.9, e.aggression + 0.15);
    e.feintChance = Math.min(0.6, e.feintChance + 0.15);
    duel.events.push({ kind: 'special', label: 'phase', x: e.x });
  }
};

const addsTick = (duel: DuelState): void => {
  const e = duel.enemy;
  if (e.special !== 'adds' && e.special !== 'allMechanics') {
    return;
  }
  e.addTimer -= 1;
  if (e.addTimer === 20) {
    duel.events.push({ kind: 'telegraph', tell: 'gold', dir: 'down', label: 'hound', x: duel.player.x });
  }
  if (e.addTimer <= 0) {
    e.addTimer = HOUND_INTERVAL;
    resolveEnemyHit(duel, HOUND_DAMAGE, 'gold', 'down');
  }
};

export const applySpecials = (duel: DuelState): void => {
  poisonTick(duel);
  if (duel.outcome !== 'fighting') {
    return;
  }
  enrageTick(duel);
  addsTick(duel);
};
