// Arena spatial units. The sim thinks in an abstract 1D lane; the renderer
// maps these to pixels. Keeps sim resolution-independent and testable.

export const ARENA = {
  width: 220,
  /** Fighters cannot pass each other; minimum centre-to-centre gap. */
  minGap: 30,
  /** Starting positions along the lane. */
  playerStartX: 78,
  enemyStartX: 150,
  /** Ground line in arena units (for skeleton foot placement). */
  floorY: 120,
} as const;

/** Ranged projectile speed (arena units per tick) for the Crossbow Knight. */
export const PROJECTILE_SPEED = 4.2;
export const PROJECTILE_DAMAGE = 12;

/** Enemy locomotion. */
export const ENEMY_SPEED = 1.15;
/** Ranged enemies try to hold this centre-to-centre gap. */
export const RANGED_KEEP = 120;
/** Melee enemies close to within this gap before committing. */
export const MELEE_CLOSE = 42;

/** Houndmaster/Dread add-attack cadence and bite damage. */
export const HOUND_INTERVAL = 150;
export const HOUND_DAMAGE = 5;
