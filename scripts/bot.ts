import type { DuelState } from '../src/sim/state.ts';
import type { Intent } from '../src/core/types.ts';
import { chance, type Rng } from '../src/core/rng.ts';

// A heuristic bot that plays the REAL sim through the REAL intent surface, so
// selfplay measures the same game a human plays. Skill knobs vary reaction and
// defensive accuracy to map the difficulty curve.

export interface Skill {
  readonly name: string;
  readonly reactTicks: number;
  readonly defAccuracy: number;
  readonly parry: boolean;
  readonly restBelow: number;
}

export const SKILLS: readonly Skill[] = [
  { name: 'novice', reactTicks: 2, defAccuracy: 0.42, parry: false, restBelow: 22 },
  { name: 'decent', reactTicks: 4, defAccuracy: 0.74, parry: false, restBelow: 15 },
  { name: 'expert', reactTicks: 6, defAccuracy: 0.96, parry: true, restBelow: 10 },
];

const dodgeAwayFrom = (duel: DuelState): Intent => ({
  kind: 'dodge',
  dir: duel.enemy.x >= duel.player.x ? 'left' : 'right',
});

const incomingBolt = (duel: DuelState): boolean =>
  duel.projectiles.some((p) => Math.abs(p.x - duel.player.x) < 70 && Math.sign(p.vx) === Math.sign(duel.player.x - p.x));

const defend = (duel: DuelState, skill: Skill, rng: Rng): Intent[] | null => {
  const e = duel.enemy;
  const telegraphing = e.phase === 'telegraph' && e.move !== null && e.timer <= skill.reactTicks;
  if (!telegraphing && !incomingBolt(duel)) {
    return null;
  }
  if (!chance(rng, skill.defAccuracy)) {
    return [];
  }
  if (e.tell === 'gold' && skill.parry && duel.player.unlocked.has('parry')) {
    return [{ kind: 'parry' }];
  }
  return [dodgeAwayFrom(duel)];
};

const attack = (duel: DuelState, skill: Skill, rng: Rng): Intent[] => {
  const p = duel.player;
  const e = duel.enemy;
  if (p.stamina < skill.restBelow) {
    return [];
  }
  const gap = Math.abs(p.x - e.x);
  if (gap > 46) {
    return [{ kind: 'light', side: 'center' }];
  }
  if (e.phase === 'staggered') {
    return [{ kind: 'light', side: 'center' }];
  }
  if (e.guard > 12 && chance(rng, 0.4)) {
    return [{ kind: 'sweep' }];
  }
  return [{ kind: 'light', side: 'center' }];
};

export const botDecide = (duel: DuelState, skill: Skill, rng: Rng): Intent[] => {
  if (duel.player.stunTicks > 0) {
    return [];
  }
  return defend(duel, skill, rng) ?? attack(duel, skill, rng);
};
