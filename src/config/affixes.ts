// Affixes recycle the archetypes after rung 14 with modifiers that keep the
// endless curve fresh and fair. Each is a set of multipliers on enemy stats.

export interface AffixDef {
  readonly id: string;
  readonly name: string;
  readonly hpMult: number;
  readonly damageMult: number;
  readonly tempoMult: number;
  readonly guardMult: number;
  readonly telegraphMult: number;
  readonly feintAdd: number;
  readonly description: string;
}

const af = (
  id: string,
  name: string,
  hpMult: number,
  damageMult: number,
  tempoMult: number,
  guardMult: number,
  telegraphMult: number,
  feintAdd: number,
  description: string,
): AffixDef => ({ id, name, hpMult, damageMult, tempoMult, guardMult, telegraphMult, feintAdd, description });

export const AFFIXES: readonly AffixDef[] = [
  af('swift', 'Swift', 0.9, 1, 1.3, 1, 0.8, 0, 'Faster, shorter telegraphs.'),
  af('ironclad', 'Ironclad', 1.5, 1, 0.9, 1.6, 1, 0, 'Far tougher, heavier guard.'),
  af('vengeful', 'Vengeful', 1, 1.4, 1, 1, 1, 0.1, 'Hits much harder.'),
  af('twinned', 'Twinned', 1.2, 1, 1.1, 1, 1, 0.15, 'Doubled aggression and feints.'),
  af('cursed', 'Cursed', 1.1, 1.2, 1.1, 1.1, 0.9, 0.2, 'Everything, a little worse for you.'),
  af('bloodthirsty', 'Bloodthirsty', 1.1, 1.3, 1.15, 0.9, 0.85, 0.05, 'Relentless and vicious.'),
  af('unyielding', 'Unyielding', 1.7, 0.95, 0.85, 1.8, 1.05, 0, 'A wall of iron that will not break.'),
];

export const AFFIX_BY_ID: ReadonlyMap<string, AffixDef> = new Map(AFFIXES.map((a) => [a.id, a]));
