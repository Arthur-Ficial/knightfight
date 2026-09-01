import { PALETTE } from '../../config/index.ts';
import { asArchetypeId, type ArchetypeId } from '../../core/types.ts';
import type { Shade } from './limb.ts';

// Each archetype is identifiable by SILHOUETTE and palette. This maps an
// archetype to its helm, weapon, shield, scale and armour shading.

export type HelmType = 'great' | 'horned' | 'barbute' | 'beaked' | 'crown' | 'hood';
export type WeaponType = 'sword' | 'greatsword' | 'dagger2' | 'halberd' | 'crossbow' | 'mace' | 'chicken';
export type ShieldType = 'kite' | 'round' | null;

export interface KnightVisual {
  readonly shade: Shade;
  readonly accent: string;
  readonly helm: HelmType;
  readonly weapon: WeaponType;
  readonly shield: ShieldType;
  readonly scale: number;
  readonly hound: boolean;
}

const shade = (base: string, shadow: string): Shade => ({
  base, shadow, warm: PALETTE.warmRim, cool: PALETTE.steelLight,
});

const v = (
  s: Shade, accent: string, helm: HelmType, weapon: WeaponType, shield: ShieldType, scale: number, hound = false,
): KnightVisual => ({ shade: s, accent, helm, weapon, shield, scale, hound });

export const HERO_VISUAL: KnightVisual = v(
  { base: PALETTE.hero1, shadow: '#2a3a6a', warm: PALETTE.heroRim, cool: PALETTE.hero0 },
  PALETTE.heraldGold, 'great', 'sword', null, 1,
);

export const HERO_CHICKEN: KnightVisual = { ...HERO_VISUAL, weapon: 'chicken', accent: PALETTE.tellRed };

const STEEL = shade(PALETTE.steelMid, PALETTE.ironDark);
const RED_STEEL = shade('#9a5a56', '#3a1f1f');
const IRON = shade(PALETTE.ironDark, '#0d0e18');
const LEATHER = shade(PALETTE.leather, '#2a1c12');

const BY_ID: Record<string, KnightVisual> = {
  squire: v(STEEL, PALETTE.foe1, 'great', 'sword', null, 0.95),
  bandit: v(LEATHER, '#7a2a2a', 'hood', 'sword', null, 0.92),
  'man-at-arms': v(RED_STEEL, PALETTE.foe1, 'great', 'sword', 'round', 1),
  shieldman: v(shade('#6a7088', PALETTE.ironDark), PALETTE.foe1, 'great', 'mace', 'kite', 1.1),
  'twin-daggers': v(LEATHER, '#b83b3b', 'barbute', 'dagger2', null, 0.9),
  halberdier: v(RED_STEEL, PALETTE.foe1, 'great', 'halberd', null, 1.05),
  crossbow: v(LEATHER, '#b8863b', 'barbute', 'crossbow', null, 1),
  flagellant: v(shade('#7a5040', '#241610'), PALETTE.foeRim, 'hood', 'mace', null, 1),
  houndmaster: v(RED_STEEL, PALETTE.foe1, 'great', 'sword', null, 1, true),
  'black-knight': v(IRON, PALETTE.tellRed, 'horned', 'greatsword', null, 1.1),
  kingsguard: v(shade('#8a7a4a', '#3a3020'), PALETTE.heraldGold, 'crown', 'sword', 'kite', 1.05),
  'plague-knight': v(shade(PALETTE.plagueDark, '#16220f'), PALETTE.plague, 'beaked', 'mace', null, 1),
  champion: v(shade('#b0b6d0', '#4a4e6a'), PALETTE.heraldGold, 'crown', 'greatsword', null, 1.3),
  'dread-knight': v(shade(PALETTE.dread, '#2a0810'), PALETTE.tellRed, 'horned', 'greatsword', null, 1.4),
};

export const visualFor = (id: ArchetypeId): KnightVisual =>
  BY_ID[id] ?? v(RED_STEEL, PALETTE.foe1, 'great', 'sword', null, 1);

export const CHICKEN_ID = asArchetypeId('__chicken');
