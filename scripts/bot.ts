import type { DuelState } from '../src/sim/state.ts';
import type { Dir4, Intent } from '../src/core/types.ts';
import { DIR4, oppositeDir } from '../src/core/types.ts';
import { chance, pick, type Rng } from '../src/core/rng.ts';

// A heuristic bot that plays the REAL sim through the REAL intent surface. It
// reads the enemy guard direction (strikes the OPEN side) and the incoming
// attack direction (dodges the MATCHING way). Skill = how accurately it reads.

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

const wrongDir = (rng: Rng, correct: Dir4): Dir4 => pick(rng, DIR4.filter((d): d is Dir4 => d !== correct));

const incomingBolt = (duel: DuelState): { dir: Dir4 } | null => {
  const b = duel.projectiles.find((p) => Math.abs(p.x - duel.player.x) < 70 && Math.sign(p.vx) === Math.sign(duel.player.x - p.x));
  return b ? { dir: b.dir } : null;
};

const defend = (duel: DuelState, skill: Skill, rng: Rng): Intent[] | null => {
  const e = duel.enemy;
  const telegraphing = e.phase === 'telegraph' && e.move !== null && e.timer <= skill.reactTicks;
  const bolt = incomingBolt(duel);
  if (!telegraphing && bolt === null) {
    return null;
  }
  const dir = telegraphing && e.move !== null ? e.move.dir : bolt?.dir ?? 'right';
  const read = chance(rng, skill.defAccuracy);
  if (telegraphing && e.tell === 'gold' && skill.parry && duel.player.unlocked.has('parry') && read) {
    return [{ kind: 'parry' }];
  }
  return [{ kind: 'dodge', dir: read ? dir : wrongDir(rng, dir) }];
};

const openStrike = (duel: DuelState, rng: Rng, skill: Skill): Intent => {
  const guard = duel.enemy.guardDir;
  const dir: Dir4 = chance(rng, skill.defAccuracy) ? oppositeDir(guard) : pick(rng, DIR4);
  return { kind: 'strike', dir };
};

const attack = (duel: DuelState, skill: Skill, rng: Rng): Intent[] => {
  const p = duel.player;
  const e = duel.enemy;
  if (p.stamina < skill.restBelow) {
    return [];
  }
  if (Math.abs(p.x - e.x) > 46) {
    return [{ kind: 'strike', dir: 'right' }];
  }
  if (e.phase === 'staggered') {
    return [{ kind: 'strike', dir: 'up' }];
  }
  return [openStrike(duel, rng, skill)];
};

export const botDecide = (duel: DuelState, skill: Skill, rng: Rng): Intent[] => {
  if (duel.player.stunTicks > 0) {
    return [];
  }
  return defend(duel, skill, rng) ?? attack(duel, skill, rng);
};
