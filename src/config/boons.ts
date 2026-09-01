import { asBoonId, type BoonId } from '../core/types.ts';

// In-run roguelite boons. Picked 1-of-3 after each victory. Every boon is a bag
// of modifier deltas the combat math reads. Multiplicative keys stack additively
// as percentages (predictable synergy); additive keys simply sum.

export type ModKey =
  | 'damageMult'
  | 'lightDamageMult'
  | 'heavyDamageMult'
  | 'riposteDamageMult'
  | 'guardDamageMult'
  | 'critChance'
  | 'critMult'
  | 'maxHp'
  | 'maxStamina'
  | 'staminaRegenMult'
  | 'staminaCostMult'
  | 'maxRage'
  | 'rageGainMult'
  | 'parryWindow'
  | 'dodgeIframes'
  | 'comboMaxMult'
  | 'lifesteal'
  | 'thorns'
  | 'bleed'
  | 'chipReduction';

export type ModBag = Partial<Record<ModKey, number>>;
export type BoonKind = 'relic' | 'rune' | 'blessing' | 'curse';
export type Rarity = 'common' | 'rare' | 'epic';

export interface BoonDef {
  readonly id: BoonId;
  readonly name: string;
  readonly kind: BoonKind;
  readonly rarity: Rarity;
  readonly mods: ModBag;
  readonly description: string;
}

const b = (
  id: string,
  name: string,
  kind: BoonKind,
  rarity: Rarity,
  mods: ModBag,
  description: string,
): BoonDef => ({ id: asBoonId(id), name, kind, rarity, mods, description });

export const BOONS: readonly BoonDef[] = [
  b('widows-ring', "Widow's Ring", 'relic', 'rare', { riposteDamageMult: 0.4 }, '+40% riposte damage.'),
  b('iron-fang', 'Iron Fang', 'rune', 'common', { lightDamageMult: 0.25 }, '+25% light-strike damage.'),
  b('warhammer-rune', 'Warhammer Rune', 'rune', 'common', { heavyDamageMult: 0.3 }, '+30% heavy damage.'),
  b('keen-edge', 'Keen Edge', 'rune', 'common', { critChance: 0.1 }, '+10% crit chance.'),
  b('assassins-mark', "Assassin's Mark", 'relic', 'rare', { critChance: 0.06, critMult: 0.6 }, '+6% crit, +60% crit damage.'),
  b('bulwark', 'Bulwark Blessing', 'blessing', 'common', { maxHp: 25 }, '+25 max HP.'),
  b('deep-lungs', 'Deep Lungs', 'blessing', 'common', { maxStamina: 30 }, '+30 max stamina.'),
  b('second-wind', 'Second Wind', 'blessing', 'rare', { staminaRegenMult: 0.5 }, '+50% stamina regeneration.'),
  b('feather-step', 'Feather Step', 'relic', 'common', { staminaCostMult: -0.2 }, '-20% stamina cost on all actions.'),
  b('metronome', 'The Metronome', 'relic', 'epic', { parryWindow: 4, riposteDamageMult: 0.3 }, 'Wider parry window and +30% riposte. (Secret relic.)'),
  b('phantom-dodge', 'Phantom Dodge', 'relic', 'rare', { dodgeIframes: 4 }, 'Longer dodge invulnerability.'),
  b('rhythm-heart', 'Rhythm Heart', 'relic', 'rare', { comboMaxMult: 0.6 }, 'Combos scale to a higher ceiling.'),
  b('bloodthirst', 'Bloodthirst', 'relic', 'rare', { lifesteal: 0.12 }, 'Heal 12% of damage dealt.'),
  b('thorn-mail', 'Thorn Mail', 'blessing', 'common', { thorns: 0.2 }, 'Reflect 20% of damage taken.'),
  b('serrated', 'Serrated Blade', 'rune', 'common', { bleed: 3 }, 'Every hit applies bleed.'),
  b('aegis', 'Aegis Wards', 'blessing', 'rare', { chipReduction: 0.5 }, 'Halve chip damage through blocks.'),
  b('war-drums', 'War Drums', 'relic', 'rare', { rageGainMult: 0.5 }, '+50% rage generation.'),
  b('rage-font', 'Font of Rage', 'blessing', 'common', { maxRage: 40 }, '+40 max rage.'),
  b('honed-steel', 'Honed Steel', 'rune', 'rare', { damageMult: 0.15 }, '+15% all damage.'),
  b('guard-crusher', 'Guard Crusher', 'rune', 'common', { guardDamageMult: 0.5 }, '+50% guard damage.'),
  b('duelists-poise', "Duelist's Poise", 'relic', 'rare', { parryWindow: 3, critChance: 0.05 }, 'Wider parry, +5% crit.'),
  b('vampire-fang', 'Vampire Fang', 'relic', 'epic', { lifesteal: 0.2, damageMult: -0.1 }, 'Heal 20% of damage, but -10% damage.'),
  b('berserkers-pact', "Berserker's Pact", 'curse', 'epic', { damageMult: 0.5, maxHp: -30 }, '+50% damage, -30 max HP.'),
  b('glass-edge', 'Glass Edge', 'curse', 'epic', { critChance: 0.25, critMult: 1.0, maxHp: -40 }, '+25% crit and +100% crit damage, but -40 max HP.'),
  b('reckless-charge', 'Reckless Charge', 'curse', 'rare', { heavyDamageMult: 0.6, staminaCostMult: 0.3 }, '+60% heavy damage, but +30% stamina cost.'),
  b('bloodpact', 'Blood Pact', 'curse', 'rare', { damageMult: 0.25, chipReduction: -0.5 }, '+25% damage, but you take 50% more chip.'),
  b('frenzy-brand', 'Frenzy Brand', 'curse', 'epic', { rageGainMult: 1.0, staminaRegenMult: -0.4 }, 'Double rage gain, but -40% stamina regen.'),
  b('executioners-oath', "Executioner's Oath", 'relic', 'epic', { heavyDamageMult: 0.4, guardDamageMult: 0.4 }, '+40% heavy and guard damage.'),
  b('winds-favor', "Wind's Favor", 'blessing', 'rare', { dodgeIframes: 3, staminaCostMult: -0.15 }, 'Longer i-frames and cheaper actions.'),
  b('lions-heart', "Lion's Heart", 'blessing', 'epic', { maxHp: 40, damageMult: 0.1 }, '+40 max HP and +10% damage.'),
  b('quicksilver', 'Quicksilver', 'relic', 'rare', { staminaRegenMult: 0.35, staminaCostMult: -0.1 }, 'Faster regen, cheaper actions.'),
  b('crimson-crown', 'Crimson Crown', 'relic', 'epic', { lifesteal: 0.08, critChance: 0.08, damageMult: 0.1 }, 'Lifesteal, crit, and raw damage - the royal package.'),
  b('unbreakable', 'Unbreakable', 'blessing', 'rare', { maxStamina: 20, chipReduction: 0.3 }, '+20 stamina and -30% chip.'),
];

export const BOON_BY_ID: ReadonlyMap<BoonId, BoonDef> = new Map(BOONS.map((x) => [x.id, x]));
