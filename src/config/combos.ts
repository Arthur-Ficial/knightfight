import { asComboId, type ComboId } from '../core/types.ts';

// Combo definitions. A combo fires when its exact token sequence is entered
// with each input inside the rhythm window. The finishing strike gets the
// multiplier and effects. Discovered combos are recorded in the Combo Codex.

// Tokens use the directional language of the fight: strikes and dodges carry a
// cardinal direction, so a combo reads as a row of gesture pictograms.
export type ComboToken =
  | 'strikeU'
  | 'strikeD'
  | 'strikeL'
  | 'strikeR'
  | 'heavy'
  | 'dodgeU'
  | 'dodgeD'
  | 'dodgeL'
  | 'dodgeR'
  | 'parry'
  | 'feint'
  | 'whirlwind';

export interface ComboEffect {
  readonly launcher?: true;
  readonly guardBreak?: true;
  readonly stagger?: true;
  readonly dodgeCancel?: true;
  readonly bleed?: true;
}

export interface ComboDef {
  readonly id: ComboId;
  readonly name: string;
  readonly sequence: readonly ComboToken[];
  readonly multiplier: number;
  readonly rageBonus: number;
  readonly effect: ComboEffect;
  readonly description: string;
}

const combo = (
  id: string,
  name: string,
  sequence: readonly ComboToken[],
  multiplier: number,
  rageBonus: number,
  effect: ComboEffect,
  description: string,
): ComboDef => ({ id: asComboId(id), name, sequence, multiplier, rageBonus, effect, description });

export const COMBOS: readonly ComboDef[] = [
  combo('rising-lion', 'Rising Lion', ['strikeL', 'strikeR', 'strikeU'], 1.6, 12, { launcher: true },
    'Left, right, then a rising high cut that launches the foe.'),
  combo('earthbreaker', 'Earthbreaker', ['strikeD', 'heavy'], 1.8, 16, { guardBreak: true, stagger: true },
    'A low cut into a charged fall that shatters guard and staggers.'),
  combo('riposte-royale', 'Riposte Royale', ['parry', 'strikeR', 'strikeL', 'strikeU'], 2.6, 24,
    { }, 'The crown jewel: parry, two side cuts, a killing high. Highest DPS in the game.'),
  combo('dancers-cut', "Dancer's Cut", ['dodgeL', 'dodgeR', 'strikeR'], 1.5, 10, { dodgeCancel: true },
    'Weave left, weave right, cancel straight into a strike.'),
  combo('feintbreaker', 'Feintbreaker', ['feint', 'heavy'], 1.7, 14, { guardBreak: true },
    'Bait the parry with a feint, then crush the opening with a charged blow.'),
  combo('whirlwind-finish', 'Whirlwind Finish', ['whirlwind', 'strikeR'], 1.4, 8, { },
    'Spin the blade wide, then punctuate with a clean finisher.'),
  combo('bladestorm', 'Bladestorm', ['strikeL', 'strikeR', 'strikeL'], 1.9, 16, { bleed: true },
    'Left-right-left cuts that carve a bleeding lattice.'),
  combo('skyfall', 'Skyfall', ['strikeU', 'heavy'], 2.0, 18, { guardBreak: true },
    'A high cut into a plummeting charge - guard cannot hold.'),
  combo('serpents-bite', "Serpent's Bite", ['strikeD', 'strikeR', 'strikeL'], 1.5, 10, { stagger: true },
    'A low cut opens the guard for two venomous side cuts.'),
  combo('steel-rain', 'Steel Rain', ['parry', 'strikeR', 'strikeL', 'strikeR'], 1.8, 18, { },
    'Parry then a relentless triple of steel.'),
  combo('windrunner', 'Windrunner', ['dodgeL', 'strikeR', 'dodgeR', 'strikeL'], 1.6, 12, { dodgeCancel: true },
    'A dodge-strike rhythm that never lets the foe breathe.'),
  combo('executioner', 'Executioner', ['heavy', 'heavy'], 2.2, 20, { guardBreak: true, stagger: true },
    'Two charged blows back to back - punishing on stamina, devastating on impact.'),
  combo('lions-roar', "Lion's Roar", ['strikeU', 'strikeU', 'strikeU'], 2.0, 18, { launcher: true },
    'A triple high crescendo into a roaring launcher.'),
  combo('reapers-waltz', "Reaper's Waltz", ['dodgeR', 'strikeD', 'heavy'], 2.1, 20,
    { guardBreak: true, stagger: true, dodgeCancel: true },
    'Sidestep, low cut, and reap - the full harvest.'),
];

export const COMBO_BY_ID: ReadonlyMap<ComboId, ComboDef> = new Map(
  COMBOS.map((c) => [c.id, c]),
);

/** Longest combo length; the combo detector keeps this many recent tokens. */
export const MAX_COMBO_LEN = COMBOS.reduce((max, c) => Math.max(max, c.sequence.length), 0);
