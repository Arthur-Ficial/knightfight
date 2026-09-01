// Difficulty-curve knobs. The ladder scales these per rung so rung 1-3 is easy,
// rung 10 needs real skill and rung 20+ is expert - without ever becoming unfair.

export const LADDER = {
  /** Enemy HP / guard / damage grow with distance past the intro rung. Tuned so
   *  rung 1-3 is easy, rung 10 needs real skill and rung 20+ is expert. */
  hpPerRung: 0.085,
  guardPerRung: 0.055,
  damagePerRung: 0.1,
  /** Telegraphs shrink (attacks read faster) but never below the floor. */
  telegraphShrinkPerRung: 0.02,
  telegraphFloor: 0.5,
  /** Attack tempo and feint probability rise with the rung. */
  tempoPerRung: 0.013,
  tempoCap: 1.7,
  feintPerRung: 0.016,
  feintCap: 0.65,
  aggressionPerRung: 0.012,
  aggressionCap: 0.92,
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
