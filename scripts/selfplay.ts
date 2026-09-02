import { writeFileSync, mkdirSync } from 'node:fs';
import { createRng } from '../src/core/rng.ts';
import { asSeed } from '../src/core/types.ts';
import { createDuel } from '../src/sim/init.ts';
import { stepDuel } from '../src/sim/step.ts';
import { createMeta, type MetaState } from '../src/sim/meta.ts';
import { createRun, runStats, runUnlocks, offerBoons, takeBoon } from '../src/sim/run.ts';
import { botDecide, SKILLS, type Skill } from './bot.ts';

// Headless balance harness: the bot plays N rungs against the REAL sim per skill
// level and reports where runs end and why. Used to tune, then checked in.

const MAX_TICKS = 3600;
const RUNG_CAP = 45;
const SEEDS = 16;

interface DuelResult {
  readonly won: boolean;
  readonly ticks: number;
  readonly starved: number;
  readonly dps: number;
}

interface Climb {
  readonly rung: number;
  readonly cause: string;
  readonly starvedRatio: number;
  readonly avgDps: number;
}

const metaFor = (skill: Skill): MetaState => {
  const meta = createMeta();
  if (skill.parry) {
    meta.upgradeRanks['unlock-parry'] = 1;
  }
  if (skill.name === 'expert') {
    Object.assign(meta.upgradeRanks, {
      vitality: 4, ferocity: 3, endurance: 3, precision: 2, evasion: 2, duelist: 2, swiftness: 2,
    });
  } else if (skill.name === 'decent') {
    Object.assign(meta.upgradeRanks, { vitality: 2, endurance: 1, evasion: 1 });
  }
  return meta;
};

const playDuel = (
  rung: number,
  run: ReturnType<typeof createRun>,
  meta: MetaState,
  skill: Skill,
  botRng: ReturnType<typeof createRng>,
): DuelResult => {
  const duel = createDuel(rung, run.rng, runStats(run, meta), runUnlocks(meta));
  const enemyHp = duel.enemy.maxHp;
  let starved = 0;
  let t = 0;
  for (; t < MAX_TICKS && duel.outcome === 'fighting'; t += 1) {
    if (duel.player.stamina < 6) {
      starved += 1;
    }
    stepDuel(duel, botDecide(duel, skill, botRng));
  }
  const seconds = Math.max(1, t) / 60;
  return { won: duel.outcome === 'won', ticks: t, starved, dps: enemyHp / seconds };
};

const climb = (skill: Skill, seed: number): Climb => {
  const meta = metaFor(skill);
  const run = createRun(asSeed(seed), 0);
  const botRng = createRng(asSeed((seed ^ 0x9e3779b9) >>> 0));
  let starvedTotal = 0;
  let dpsTotal = 0;
  let duels = 0;
  let rung = 1;
  for (; rung <= RUNG_CAP; rung += 1) {
    run.rung = rung;
    const res = playDuel(rung, run, meta, skill, botRng);
    starvedTotal += res.starved / Math.max(1, res.ticks);
    dpsTotal += res.dps;
    duels += 1;
    if (!res.won) {
      const cause = res.ticks >= MAX_TICKS ? 'timeout' : 'combat';
      return { rung, cause, starvedRatio: starvedTotal / duels, avgDps: dpsTotal / duels };
    }
    const boons = offerBoons(run, run.rng);
    if (boons[0] !== undefined) {
      takeBoon(run, boons[0]);
    }
  }
  return { rung: RUNG_CAP, cause: 'capped', starvedRatio: starvedTotal / duels, avgDps: dpsTotal / duels };
};

interface Summary {
  readonly skill: string;
  readonly avgRung: number;
  readonly minRung: number;
  readonly maxRung: number;
  readonly timeouts: number;
  readonly combats: number;
  readonly starved: string;
  readonly dps: string;
}

const summarize = (skill: Skill): Summary => {
  const climbs = Array.from({ length: SEEDS }, (_, i) => climb(skill, 1000 + i * 37));
  const rungs = climbs.map((c) => c.rung);
  const avg = rungs.reduce((a, b) => a + b, 0) / climbs.length;
  return {
    skill: skill.name,
    avgRung: Math.round(avg * 10) / 10,
    minRung: Math.min(...rungs),
    maxRung: Math.max(...rungs),
    timeouts: climbs.filter((c) => c.cause === 'timeout').length,
    combats: climbs.filter((c) => c.cause === 'combat').length,
    starved: `${Math.round((climbs.reduce((a, c) => a + c.starvedRatio, 0) / climbs.length) * 100)}%`,
    dps: (climbs.reduce((a, c) => a + c.avgDps, 0) / climbs.length).toFixed(1),
  };
};

const DIRECTION_DOC = `## Directional attacks - the four shapes (one shared rig)

The strike DIRECTION is carried by the skeleton itself. \`src/render/canvas2d/attack.ts\`
holds the single source of truth; player and enemy run the SAME four motions,
mirrored to facing. \`up\`/\`down\` are facing-independent; horizontal folds to
forward/back relative to who is swinging.

| Input (Dir4) | Player (faces +x) | Enemy (faces -x) | Motion |
|---|---|---|---|
| up | rising | rising | starts low behind the knee, uppercuts high through the body line |
| down | overhead | overhead | raises fully over the helm, chops down the vertical |
| right | thrust (forward) | backhand (back) | player lunges toward the foe; enemy winds back |
| left | backhand (back) | thrust (forward) | player winds back; enemy lunges toward the player |

The wind-up already tells the direction (rising coils LOW, overhead raises HIGH,
thrust retracts to the ribs, backhand cocks behind the far shoulder), so the read
is fair. Pose == telegraph chevron == the Dir4 the sim resolves the hit with.

## Directional counters - the correct answer per line (Addendum 2)

Enemies also DEFEND. During your wind-up the enemy reads your strike direction and,
skill-gated, commits the matching counter from the SAME shared mapping the player
uses to dodge (\`counterDirForAttack\`, identity - you meet an attack on its own
line). Each counter is its own readable brace:

| Your attack | Enemy counter pose |
|---|---|
| up (rising cut) | LOW parry |
| down (overhead) | HIGH catch |
| right (thrust) | SIDESTEP / deflect |
| left (back sweep) | TURN IN to close |

Skill scales with the rung (\`counterSkill\` per archetype in \`config/enemies.ts\`,
ramped by \`LADDER.counterPerRung\`): low rungs counter rarely and read late or
wrong; high rungs counter often and read early - the fight sharpens as you climb.
A matched counter deflects your strike (no damage, you lose tempo) but leaves the
enemy briefly exposed and unable to re-counter: a real punish window, never a wall.
`;

const render = (rows: readonly Summary[]): string => {
  const header = '| Skill | Avg rung | Min | Max | Timeouts | Combat deaths | Stamina-starved | Avg DPS |';
  const sep = '|---|---|---|---|---|---|---|---|';
  const body = rows
    .map((r) => `| ${r.skill} | ${r.avgRung} | ${r.minRung} | ${r.maxRung} | ${r.timeouts} | ${r.combats} | ${r.starved} | ${r.dps} |`)
    .join('\n');
  return `# Knightfight - Balance Report\n\nAuto-generated by \`npm run selfplay\`. ${SEEDS} runs per skill, rung cap ${RUNG_CAP}.\nThe bot plays the real sim through the real intent surface - no shortcuts.\n\n${header}\n${sep}\n${body}\n\n## Reading it\n- **Avg rung** should rise clearly with skill: novice clears the tutorial band, expert reaches the boss and beyond.\n- **Timeouts** flag unwinnable/too-tanky enemies. Zero is the goal.\n- **Stamina-starved** is the fraction of ticks the bot was too exhausted to act; a healthy fight sits low.\n\n${DIRECTION_DOC}`;
};

const rows = SKILLS.map(summarize);
mkdirSync('docs', { recursive: true });
writeFileSync('docs/BALANCE.md', render(rows));
for (const r of rows) {
  process.stdout.write(
    `${r.skill.padEnd(8)} avgRung=${String(r.avgRung).padStart(5)}  min=${r.minRung} max=${r.maxRung}  timeouts=${r.timeouts}  combatDeaths=${r.combats}  starved=${r.starved}  dps=${r.dps}\n`,
  );
}
process.stdout.write('\nWrote docs/BALANCE.md\n');
