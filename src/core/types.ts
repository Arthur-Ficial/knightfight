// Shared contracts. The neutral vocabulary that input, sim and render all speak.

declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

/** Deterministic RNG seed. */
export type Seed = Brand<number, 'Seed'>;
/** A single fixed-timestep simulation tick (1/60 s). */
export type Tick = Brand<number, 'Tick'>;
/** Stable identity of an enemy archetype. */
export type ArchetypeId = Brand<string, 'ArchetypeId'>;
/** Stable identity of a boon. */
export type BoonId = Brand<string, 'BoonId'>;
/** Stable identity of a named combo. */
export type ComboId = Brand<string, 'ComboId'>;
/** Stable identity of a meta upgrade node. */
export type UpgradeId = Brand<string, 'UpgradeId'>;

export const asSeed = (n: number): Seed => n as Seed;
export const asArchetypeId = (s: string): ArchetypeId => s as ArchetypeId;
export const asBoonId = (s: string): BoonId => s as BoonId;
export const asComboId = (s: string): ComboId => s as ComboId;
export const asUpgradeId = (s: string): UpgradeId => s as UpgradeId;

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export type Side = 'left' | 'right' | 'center';
export type Direction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'upLeft'
  | 'upRight'
  | 'downLeft'
  | 'downRight';

/** The four cardinal directions - the shared language of strikes and guards. */
export type Dir4 = 'up' | 'down' | 'left' | 'right';
export const DIR4: readonly Dir4[] = ['up', 'down', 'left', 'right'];
export const oppositeDir = (d: Dir4): Dir4 =>
  d === 'up' ? 'down' : d === 'down' ? 'up' : d === 'left' ? 'right' : 'left';

/**
 * The ONLY thing the sim ever receives from the player. The gesture recognizer
 * is the sole producer; the sim is the sole consumer. No DOM leaks across.
 * Strikes and dodges are directional - that is the core read of the fight.
 */
export type Intent =
  | { readonly kind: 'strike'; readonly dir: Dir4 }
  | { readonly kind: 'feint' }
  | { readonly kind: 'chargeStart' }
  | { readonly kind: 'chargeRelease' }
  | { readonly kind: 'dodge'; readonly dir: Dir4 }
  | { readonly kind: 'parry' }
  | { readonly kind: 'blockStart' }
  | { readonly kind: 'blockEnd' }
  | { readonly kind: 'whirlwind' }
  | { readonly kind: 'focus' };

export type IntentKind = Intent['kind'];

/** Telegraph colour = how the incoming enemy attack must be answered. */
export type TellColour = 'white' | 'gold' | 'red';
