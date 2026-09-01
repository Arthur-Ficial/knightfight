import type { ModBag, ModKey } from '../config/boons.ts';
import type { ComboToken } from '../config/combos.ts';

// Symbol-first vocabulary: a glyph per stat and per gesture token so selection
// screens read as icons, not sentences. All are basic Unicode (render at 16px).

const MOD_ICON: Record<ModKey, string> = {
  damageMult: '⚔', lightDamageMult: '⚔', heavyDamageMult: '⚔',
  riposteDamageMult: '⚔', guardDamageMult: '⚑', critChance: '✦',
  critMult: '✦', maxHp: '♥', maxStamina: '⚡', staminaRegenMult: '⚡',
  staminaCostMult: '⚡', maxRage: '★', rageGainMult: '★', parryWindow: '⧖',
  dodgeIframes: '»', comboMaxMult: '∞', lifesteal: '✚', thorns: '✵',
  bleed: '†', chipReduction: '⛨',
};

const PERCENT: ReadonlySet<ModKey> = new Set<ModKey>([
  'damageMult', 'lightDamageMult', 'heavyDamageMult', 'riposteDamageMult', 'guardDamageMult',
  'critChance', 'critMult', 'staminaRegenMult', 'staminaCostMult', 'rageGainMult', 'comboMaxMult',
  'lifesteal', 'thorns', 'chipReduction',
]);

const fmt = (key: ModKey, value: number): string => {
  const sign = value >= 0 ? '+' : '−';
  const mag = Math.abs(value);
  const num = PERCENT.has(key) ? `${Math.round(mag * 100)}%` : `${Math.round(mag)}`;
  return `${sign}${num} ${MOD_ICON[key]}`;
};

/** One compact stat line for a boon: its strongest one or two modifiers. */
export const modSummary = (mods: ModBag): string => {
  const entries = (Object.keys(mods) as ModKey[])
    .map((k) => ({ k, v: mods[k] ?? 0 }))
    .filter((e) => e.v !== 0)
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  return entries.slice(0, 2).map((e) => fmt(e.k, e.v)).join('  ');
};

/** The single strongest modifier's glyph, for a boon card's big icon. */
export const dominantIcon = (mods: ModBag): string => {
  const entries = (Object.keys(mods) as ModKey[])
    .map((k) => ({ k, v: Math.abs(mods[k] ?? 0) }))
    .sort((a, b) => b.v - a.v);
  const top = entries[0];
  return top ? MOD_ICON[top.k] : '?';
};

export const TOKEN_ICON: Record<ComboToken, string> = {
  strikeU: '↑', strikeD: '↓', strikeL: '←', strikeR: '→',
  heavy: '◆',
  dodgeU: '⇧', dodgeD: '⇩', dodgeL: '⇦', dodgeR: '⇨',
  parry: '◇', feint: '≈', whirlwind: '◯',
};

export const comboRow = (seq: readonly ComboToken[]): string =>
  seq.map((t) => TOKEN_ICON[t]).join(' ');
