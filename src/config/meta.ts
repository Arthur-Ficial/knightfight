import { asUpgradeId, type UpgradeId } from '../core/types.ts';
import type { ModBag } from './boons.ts';

// Persistent meta-progression. Valor earned per run buys permanent upgrades.
// Crucially, some gestures START LOCKED and must be earned - the moveset itself
// is progression. Ranks/titles are derived from best rung reached.

export type GestureUnlock = 'parry' | 'whirlwind' | 'focus';

export type UpgradeEffect =
  | { readonly kind: 'mod'; readonly mods: ModBag }
  | { readonly kind: 'unlock'; readonly gesture: GestureUnlock };

export interface UpgradeDef {
  readonly id: UpgradeId;
  readonly name: string;
  readonly cost: number;
  readonly maxRank: number;
  readonly effect: UpgradeEffect;
  readonly prereq: UpgradeId | null;
  readonly description: string;
}

const modNode = (
  id: string,
  name: string,
  cost: number,
  maxRank: number,
  mods: ModBag,
  description: string,
): UpgradeDef => ({ id: asUpgradeId(id), name, cost, maxRank, effect: { kind: 'mod', mods }, prereq: null, description });

const unlockNode = (
  id: string,
  name: string,
  cost: number,
  gesture: GestureUnlock,
  description: string,
): UpgradeDef => ({ id: asUpgradeId(id), name, cost, maxRank: 1, effect: { kind: 'unlock', gesture }, prereq: null, description });

export const UPGRADES: readonly UpgradeDef[] = [
  unlockNode('unlock-parry', 'Way of the Parry', 60, 'parry', 'Unlock the two-finger parry and its riposte.'),
  unlockNode('unlock-whirlwind', 'Whirlwind Art', 130, 'whirlwind', 'Unlock the circle-gesture whirlwind special.'),
  unlockNode('unlock-focus', 'Focus', 190, 'focus', 'Unlock the pinch focus - brief slow-motion.'),
  modNode('vitality', 'Vitality', 45, 4, { maxHp: 15 }, '+15 max HP per rank.'),
  modNode('endurance', 'Endurance', 40, 4, { maxStamina: 12 }, '+12 max stamina per rank.'),
  modNode('swiftness', 'Swiftness', 55, 3, { staminaRegenMult: 0.15 }, '+15% stamina regen per rank.'),
  modNode('precision', 'Precision', 70, 3, { critChance: 0.04 }, '+4% crit chance per rank.'),
  modNode('ferocity', 'Ferocity', 80, 3, { damageMult: 0.06 }, '+6% damage per rank.'),
  modNode('evasion', 'Evasion', 65, 3, { dodgeIframes: 2 }, 'Longer dodge i-frames per rank.'),
  modNode('duelist', "Duelist's Timing", 75, 3, { parryWindow: 2 }, 'Wider parry window per rank (needs the parry).'),
  modNode('bloodline', 'Bloodline', 110, 2, { lifesteal: 0.05 }, 'Heal 5% of damage dealt per rank.'),
];

export const UPGRADE_BY_ID: ReadonlyMap<UpgradeId, UpgradeDef> = new Map(UPGRADES.map((u) => [u.id, u]));

/** Rank titles by best rung reached. */
export const TITLES: readonly { readonly rung: number; readonly title: string }[] = [
  { rung: 0, title: 'Peasant' },
  { rung: 3, title: 'Squire' },
  { rung: 6, title: 'Knight' },
  { rung: 10, title: 'Knight-Errant' },
  { rung: 13, title: 'Champion' },
  { rung: 20, title: 'Warlord' },
  { rung: 30, title: 'Blademaster' },
  { rung: 40, title: 'Legend' },
  { rung: 50, title: 'Immortal' },
];

export const titleForRung = (best: number): string => {
  let title = TITLES[0]?.title ?? 'Peasant';
  for (const entry of TITLES) {
    if (best >= entry.rung) {
      title = entry.title;
    }
  }
  return title;
};
