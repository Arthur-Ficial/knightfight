import { createRng } from '../src/core/rng.ts';
import { asSeed } from '../src/core/types.ts';
import { createDuel } from '../src/sim/init.ts';
import { stepDuel } from '../src/sim/step.ts';
import { resolveStats } from '../src/sim/modifiers.ts';
import { botDecide, SKILLS } from './bot.ts';

// Root-cause diagnostic for the rung-7 wall. Runs the EXPERT bot on each rung in
// isolation and reports win rate + the closest the player ever got to the enemy.
// If rung 7 shows ~0% wins and a large min-gap, the player cannot close on the
// kiting Crossbow Knight — the wall is real.

const expert = SKILLS[2];
if (expert === undefined) {
  throw new Error('no expert skill');
}

const stats = resolveStats([]);

const trial = (rung: number, seed: number): { won: boolean; minGap: number } => {
  const rng = createRng(asSeed(seed));
  const botRng = createRng(asSeed((seed ^ 0x1234) >>> 0));
  const duel = createDuel(rung, rng, stats, new Set(['parry']));
  let minGap = Infinity;
  for (let t = 0; t < 3600 && duel.outcome === 'fighting'; t += 1) {
    minGap = Math.min(minGap, Math.abs(duel.player.x - duel.enemy.x));
    stepDuel(duel, botDecide(duel, expert, botRng));
  }
  return { won: duel.outcome === 'won', minGap };
};

process.stdout.write('rung | winRate | avgMinGap (units the player closed to)\n');
for (let rung = 4; rung <= 9; rung += 1) {
  const results = Array.from({ length: 30 }, (_, i) => trial(rung, 500 + i * 13));
  const wins = results.filter((r) => r.won).length;
  const avgMin = results.reduce((a, r) => a + r.minGap, 0) / results.length;
  process.stdout.write(`  ${rung}  |  ${Math.round((wins / results.length) * 100)}%  |  ${avgMin.toFixed(1)}\n`);
}
