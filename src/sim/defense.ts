import {
  PARRY_RAGE_GAIN,
  PARRY_STAGGER_TICKS,
  RIPOSTE_WINDOW,
  HITSTOP,
  SLOWMO,
  BLOCK,
  PUNISH_MULT,
  POISE_HIT,
  POISON,
} from '../config/index.ts';
import type { Dir4, TellColour } from '../core/types.ts';
import { staggerEnemy, stunPlayer } from './effects.ts';
import type { DuelState, PlayerState } from './state.ts';

// Resolves an enemy strike landing on the player. The read is colour + direction:
// dodge the MATCHING direction to beat anything (incl. red) and open a riposte;
// parry (gold/white) or block (white) as colour answers; wrong read = you eat it.

const METRONOME_STREAK = 7;

const isParrying = (p: PlayerState): boolean =>
  p.action !== null && p.action.name === 'parry' && p.action.phase === 'active';

const dodgingMatch = (p: PlayerState, dir: Dir4): boolean =>
  p.iframes > 0 && p.dodgeDir === dir;

const onCleanDodge = (duel: DuelState, dir: Dir4): void => {
  const p = duel.player;
  p.riposteWindow = RIPOSTE_WINDOW;
  duel.hitstop = Math.max(duel.hitstop, HITSTOP.light);
  duel.events.push({ kind: 'dodge', dir, label: 'clean', x: p.x });
};

const onParry = (duel: DuelState): void => {
  const p = duel.player;
  p.rage = Math.min(p.stats.maxRage, p.rage + PARRY_RAGE_GAIN * p.stats.rageGainMult);
  duel.hitstop = Math.max(duel.hitstop, HITSTOP.parry);
  duel.slowmo = Math.max(duel.slowmo, SLOWMO.parryTicks);
  duel.shake = Math.max(duel.shake, 6);
  duel.perfectParryStreak += 1;
  staggerEnemy(duel, PARRY_STAGGER_TICKS);
  duel.events.push({ kind: 'parry', x: p.x });
  if (duel.perfectParryStreak === METRONOME_STREAK) {
    duel.events.push({ kind: 'special', label: 'metronome' });
  }
};

const onBlock = (duel: DuelState, damage: number): void => {
  const p = duel.player;
  const chip = damage * BLOCK.chipFraction * (1 - p.stats.chipReduction);
  p.hp -= chip;
  p.stamina -= damage;
  if (p.stamina <= BLOCK.breakStaminaFloor) {
    p.stamina = Math.max(0, p.stamina);
    p.blocking = false;
    stunPlayer(duel);
    duel.events.push({ kind: 'blockBreak', x: p.x });
  } else {
    duel.events.push({ kind: 'block', x: p.x });
  }
};

const applyHit = (duel: DuelState, damage: number, dir: Dir4): void => {
  const p = duel.player;
  const e = duel.enemy;
  let dmg = damage * e.damageMult;
  if (p.action !== null && p.action.name !== 'dodge') {
    dmg *= PUNISH_MULT;
  }
  p.hp -= dmg;
  p.poise -= POISE_HIT;
  p.blocking = false;
  duel.perfectParryStreak = 0;
  duel.shake = Math.max(duel.shake, dmg * 0.5);
  duel.hitstop = Math.max(duel.hitstop, HITSTOP.light);
  duel.events.push({ kind: 'enemyHitPlayer', amount: dmg, dir, x: p.x });
  if (e.special === 'poison') {
    e.poisonOnPlayer = Math.min(POISON.ticks * POISON.maxStacks, e.poisonOnPlayer + POISON.ticks);
  }
  if (p.poise <= 0) {
    stunPlayer(duel);
  }
  if (p.hp <= 0) {
    p.hp = 0;
    duel.outcome = 'lost';
    duel.slowmo = Math.max(duel.slowmo, SLOWMO.killTicks);
    duel.events.push({ kind: 'death', x: p.x });
  }
};

export const resolveEnemyHit = (duel: DuelState, damage: number, tell: TellColour, dir: Dir4): void => {
  const p = duel.player;
  if (dodgingMatch(p, dir)) {
    onCleanDodge(duel, dir);
    return;
  }
  if (tell !== 'red' && isParrying(p)) {
    onParry(duel);
    return;
  }
  if (tell !== 'red' && p.blocking) {
    onBlock(duel, damage);
    return;
  }
  applyHit(duel, damage, dir);
};
