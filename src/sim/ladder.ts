import { ARCHETYPES, ARCHETYPE_BY_ID, LADDER, AFFIXES } from '../config/index.ts';
import type { ArchetypeDef, AffixDef } from '../config/index.ts';
import { asArchetypeId } from '../core/types.ts';
import { type Rng, shuffle } from '../core/rng.ts';
import { ARENA } from '../config/units.ts';
import type { EnemyState } from './state.ts';

// Builds the enemy for a rung: pick archetype, roll affixes, apply the per-rung
// difficulty curve. Endless and fair: recycled archetypes gain affixes and
// rising stat curves past rung 14.

const DREAD = asArchetypeId('dread-knight');
const NON_BOSS = ARCHETYPES.filter((a) => a.special !== 'multiphase' && a.id !== DREAD);

export const archetypeForRung = (rung: number): ArchetypeDef => {
  if (rung <= LADDER.archetypeCount) {
    return ARCHETYPES[rung - 1] as ArchetypeDef;
  }
  if ((rung - LADDER.archetypeCount) % LADDER.dreadBossEvery === 0) {
    return ARCHETYPE_BY_ID.get(DREAD) as ArchetypeDef;
  }
  const index = (rung - LADDER.archetypeCount - 1) % NON_BOSS.length;
  return NON_BOSS[index] as ArchetypeDef;
};

export const affixesForRung = (rung: number, rng: Rng): readonly AffixDef[] => {
  if (rung < LADDER.affixStartRung) {
    return [];
  }
  const extra = Math.floor((rung - LADDER.affixStartRung) / LADDER.affixRungsPerExtra);
  const count = Math.min(LADDER.maxAffixes, 1 + extra);
  return shuffle(rng, AFFIXES).slice(0, count);
};

const combineAffixes = (affixes: readonly AffixDef[]): AffixDef => {
  const base: AffixDef = {
    id: 'none', name: '', hpMult: 1, damageMult: 1, tempoMult: 1,
    guardMult: 1, telegraphMult: 1, feintAdd: 0, description: '',
  };
  return affixes.reduce((acc, af) => ({
    ...acc,
    hpMult: acc.hpMult * af.hpMult,
    damageMult: acc.damageMult * af.damageMult,
    tempoMult: acc.tempoMult * af.tempoMult,
    guardMult: acc.guardMult * af.guardMult,
    telegraphMult: acc.telegraphMult * af.telegraphMult,
    feintAdd: acc.feintAdd + af.feintAdd,
  }), base);
};

export const buildEnemy = (rung: number, rng: Rng): EnemyState => {
  const def = archetypeForRung(rung);
  const affixes = affixesForRung(rung, rng);
  const af = combineAffixes(affixes);
  const delta = Math.max(0, rung - def.rung);
  const l = LADDER;
  const hp = Math.round(def.maxHp * (1 + l.hpPerRung * delta) * af.hpMult);
  const guardMax = Math.round(def.guardMax * (1 + l.guardPerRung * delta) * af.guardMult);
  const prefix = affixes.map((a) => a.name).join(' ');
  return {
    archetype: def.id,
    name: prefix ? `${prefix} ${def.name}` : def.name,
    hp, maxHp: hp,
    guard: guardMax, guardMax,
    x: ARENA.enemyStartX,
    facing: -1,
    phase: 'idle',
    timer: 0,
    move: null,
    tell: null,
    hasHit: false,
    staggerTicks: 0,
    cooldown: 30,
    aggression: Math.min(l.aggressionCap, def.aggression + l.aggressionPerRung * delta),
    feintChance: Math.min(l.feintCap, def.feintChance + l.feintPerRung * delta + af.feintAdd),
    tempo: Math.min(l.tempoCap, def.tempo * (1 + l.tempoPerRung * delta)) * af.tempoMult,
    approachBias: def.approachBias,
    damageMult: (1 + l.damagePerRung * delta) * af.damageMult,
    telegraphMult: Math.max(l.telegraphFloor, 1 - l.telegraphShrinkPerRung * delta) * af.telegraphMult,
    special: def.special,
    phaseTwo: false,
    willFeint: false,
    poisonOnPlayer: 0,
    addTimer: 90,
  };
};

export const valorForRung = (rung: number): number =>
  LADDER.valorFlat + LADDER.valorPerRung * rung;
