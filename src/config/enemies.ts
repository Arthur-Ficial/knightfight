import { asArchetypeId, type ArchetypeId, type Dir4, type TellColour } from '../core/types.ts';
import { msToTicks } from './timings.ts';

// The 14 enemy archetypes. Each is pure data: stats, a move set (each move is a
// telegraphed attack), and AI parameters the ladder scales per rung.

export type EnemySpecial =
  | 'enrageOnLowHp'
  | 'adds'
  | 'mirrorParry'
  | 'adaptive'
  | 'poison'
  | 'multiphase'
  | 'allMechanics';

export interface EnemyMove {
  readonly id: string;
  readonly windup: number;
  readonly active: number;
  readonly recovery: number;
  readonly damage: number;
  readonly tell: TellColour;
  readonly reach: number;
  readonly ranged: boolean;
  readonly canFeint: boolean;
  /** Direction the attack comes from - the player dodges the matching way. */
  readonly dir: Dir4;
}

export interface ArchetypeDef {
  readonly id: ArchetypeId;
  readonly name: string;
  readonly rung: number;
  readonly maxHp: number;
  readonly guardMax: number;
  readonly aggression: number;
  readonly feintChance: number;
  readonly tempo: number;
  readonly approachBias: number;
  /** Base tendency to read the player's wind-up and counter it (0..1). Scaled
   *  up per rung by the ladder. Defensive archetypes counter far more. */
  readonly counterSkill: number;
  readonly teaches: string;
  readonly moves: readonly EnemyMove[];
  readonly special: EnemySpecial | null;
}

const mv = (
  id: string,
  windupMs: number,
  activeMs: number,
  recoveryMs: number,
  damage: number,
  tell: TellColour,
  reach: number,
  dir: Dir4,
  flags: { ranged?: true; canFeint?: true } = {},
): EnemyMove => ({
  id,
  windup: msToTicks(windupMs),
  active: msToTicks(activeMs),
  recovery: msToTicks(recoveryMs),
  damage,
  tell,
  reach,
  dir,
  ranged: flags.ranged ?? false,
  canFeint: flags.canFeint ?? false,
});

const arch = (
  id: string,
  name: string,
  rung: number,
  maxHp: number,
  guardMax: number,
  ai: { aggression: number; feintChance: number; tempo: number; approachBias: number; counterSkill?: number },
  teaches: string,
  moves: readonly EnemyMove[],
  special: EnemySpecial | null = null,
): ArchetypeDef => ({
  id: asArchetypeId(id),
  name,
  rung,
  maxHp,
  guardMax,
  aggression: ai.aggression,
  feintChance: ai.feintChance,
  tempo: ai.tempo,
  approachBias: ai.approachBias,
  counterSkill: ai.counterSkill ?? 0.12,
  teaches,
  moves,
  special,
});

export const ARCHETYPES: readonly ArchetypeDef[] = [
  arch('squire', 'Squire', 1, 45, 24, { aggression: 0.25, feintChance: 0, tempo: 0.7, approachBias: 0.6, counterSkill: 0.03 },
    'A slow overhead chop you can read and answer.',
    [mv('chop', 900, 80, 520, 9, 'white', 46, 'down')]),
  arch('bandit', 'Bandit', 2, 55, 28, { aggression: 0.55, feintChance: 0.1, tempo: 1.15, approachBias: 0.8, counterSkill: 0.06 },
    'Fast side jabs - dodge the way they come.',
    [mv('jab', 420, 60, 300, 8, 'gold', 44, 'left'), mv('lunge', 520, 70, 340, 11, 'gold', 50, 'right')]),
  arch('man-at-arms', 'Man-at-Arms', 3, 70, 40, { aggression: 0.5, feintChance: 0.12, tempo: 1, approachBias: 0.7, counterSkill: 0.2 },
    'Blockable left-right combos.',
    [mv('slash', 560, 70, 360, 10, 'white', 46, 'right'), mv('cross', 500, 70, 360, 11, 'white', 46, 'left')]),
  arch('shieldman', 'Shieldman', 4, 80, 90, { aggression: 0.35, feintChance: 0.1, tempo: 0.85, approachBias: 0.5, counterSkill: 0.28 },
    'Huge guard - strike the open side.',
    [mv('bash', 620, 80, 420, 12, 'white', 44, 'down'), mv('shove', 700, 90, 460, 14, 'gold', 46, 'left')]),
  arch('twin-daggers', 'Twin Daggers', 5, 60, 32, { aggression: 0.7, feintChance: 0.2, tempo: 1.35, approachBias: 0.9, counterSkill: 0.1 },
    'Rapid gold flurries - fast rising cuts, parry the rhythm.',
    [mv('flurry1', 360, 50, 220, 6, 'gold', 42, 'up', { canFeint: true }), mv('flurry2', 320, 50, 220, 7, 'gold', 42, 'right')]),
  arch('halberdier', 'Halberdier', 6, 85, 48, { aggression: 0.5, feintChance: 0.15, tempo: 0.9, approachBias: 0.3 },
    'Long spear thrusts and red low sweeps - dodge low.',
    [mv('thrust', 640, 80, 420, 13, 'white', 62, 'left'), mv('reap', 760, 100, 520, 20, 'red', 66, 'down')]),
  arch('crossbow', 'Crossbow Knight', 7, 65, 32, { aggression: 0.6, feintChance: 0.05, tempo: 0.8, approachBias: -0.7 },
    'Ranged red bolts - close the gap, then fight.',
    [mv('bolt', 700, 40, 520, 12, 'red', 200, 'left', { ranged: true }), mv('kick', 420, 60, 320, 9, 'white', 42, 'down')]),
  arch('flagellant', 'Flagellant', 8, 75, 38, { aggression: 0.6, feintChance: 0.1, tempo: 1.05, approachBias: 0.85 },
    'Grows faster and wilder as his HP drops.',
    [mv('whip', 520, 70, 340, 11, 'gold', 50, 'left'), mv('rend', 620, 80, 400, 15, 'red', 48, 'up')], 'enrageOnLowHp'),
  arch('houndmaster', 'Houndmaster', 9, 80, 40, { aggression: 0.55, feintChance: 0.12, tempo: 1, approachBias: 0.7 },
    'Fights with hounds - two threats at once.',
    [mv('command', 560, 70, 380, 10, 'white', 48, 'up'), mv('maul', 480, 60, 320, 9, 'gold', 40, 'down')], 'adds'),
  arch('black-knight', 'Black Knight', 10, 100, 52, { aggression: 0.55, feintChance: 0.25, tempo: 1.05, approachBias: 0.7, counterSkill: 0.42 },
    'Mirror match. Parries YOUR attacks, punishes spam.',
    [mv('riposte', 500, 70, 340, 14, 'gold', 48, 'right', { canFeint: true }), mv('cleave', 680, 90, 460, 18, 'red', 52, 'up')], 'mirrorParry'),
  arch('kingsguard', 'Kingsguard', 11, 105, 52, { aggression: 0.5, feintChance: 0.45, tempo: 1.1, approachBias: 0.6, counterSkill: 0.45 },
    'Feint-heavy. Reads and adapts.',
    [mv('bait', 420, 60, 300, 12, 'gold', 48, 'left', { canFeint: true }), mv('punish', 560, 80, 380, 17, 'red', 50, 'right', { canFeint: true })], 'adaptive'),
  arch('plague-knight', 'Plague Knight', 12, 95, 48, { aggression: 0.6, feintChance: 0.15, tempo: 1, approachBias: 0.7 },
    'Poison forces you to stay aggressive.',
    [mv('venom', 560, 70, 380, 10, 'gold', 48, 'down'), mv('miasma', 700, 90, 460, 14, 'red', 54, 'up')], 'poison'),
  arch('champion', 'The Champion', 13, 160, 66, { aggression: 0.6, feintChance: 0.3, tempo: 1.1, approachBias: 0.75, counterSkill: 0.35 },
    'Boss. Changes at half health.',
    [mv('sword', 520, 70, 340, 14, 'gold', 50, 'right', { canFeint: true }), mv('smash', 720, 100, 480, 22, 'red', 54, 'up'), mv('flurry', 360, 50, 240, 9, 'gold', 46, 'left')], 'multiphase'),
  arch('dread-knight', 'Dread Knight', 14, 200, 76, { aggression: 0.65, feintChance: 0.4, tempo: 1.2, approachBias: 0.8, counterSkill: 0.55 },
    'Endless boss. Every mechanic at once.',
    [mv('rime', 480, 60, 320, 15, 'gold', 50, 'up', { canFeint: true }), mv('doom', 760, 100, 500, 26, 'red', 56, 'down'), mv('volley', 680, 40, 480, 13, 'red', 200, 'left', { ranged: true })], 'allMechanics'),
];

export const ARCHETYPE_BY_ID: ReadonlyMap<ArchetypeId, ArchetypeDef> = new Map(
  ARCHETYPES.map((a) => [a.id, a]),
);
