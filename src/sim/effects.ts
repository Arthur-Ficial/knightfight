import { RIPOSTE_WINDOW, PLAYER_STUN_TICKS } from '../config/index.ts';
import type { DuelState } from './state.ts';

// Shared state transitions used by both attack and defence resolution.

export const staggerEnemy = (duel: DuelState, ticks: number): void => {
  const e = duel.enemy;
  e.phase = 'staggered';
  e.timer = ticks;
  e.staggerTicks = ticks;
  e.move = null;
  e.tell = null;
  e.hasHit = false;
  duel.player.riposteWindow = RIPOSTE_WINDOW;
  duel.events.push({ kind: 'stagger', x: e.x });
};

export const stunPlayer = (duel: DuelState): void => {
  const p = duel.player;
  p.action = null;
  p.charging = false;
  p.blocking = false;
  p.stunTicks = PLAYER_STUN_TICKS;
  p.poise = 0;
};
