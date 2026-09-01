// Difficulty-curve knobs. The ladder scales these per rung so rung 1-3 is easy,
// rung 10 needs real skill and rung 20+ is expert - without ever becoming unfair.

export const LADDER = {
  /** Enemy HP / guard / damage grow gently with distance past the intro rung. */
  hpPerRung: 0.05,
  guardPerRung: 0.04,
  damagePerRung: 0.035,
  /** Telegraphs shrink (attacks read faster) but never below the floor. */
  telegraphShrinkPerRung: 0.012,
  telegraphFloor: 0.55,
  /** Attack tempo and feint probability rise with the rung. */
  tempoPerRung: 0.008,
  tempoCap: 1.6,
  feintPerRung: 0.012,
  feintCap: 0.6,
  aggressionPerRung: 0.006,
  aggressionCap: 0.85,
  /** Valor earned scales with rung reached. */
  valorPerRung: 8,
  valorFlat: 5,
  /** Endless structure. */
  archetypeCount: 14,
  dreadBossEvery: 10,
  affixStartRung: 15,
  /** One additional affix every this-many rungs past the affix start. */
  affixRungsPerExtra: 9,
  maxAffixes: 3,
} as const;
