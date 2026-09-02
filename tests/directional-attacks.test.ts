import { describe, it, expect } from 'vitest';
import { makeDuel, step } from './helpers.ts';
import type { DuelState } from '../src/sim/state.ts';
import type { Dir4 } from '../src/core/types.ts';
import { DIR4 } from '../src/core/types.ts';
import { styleForDir, attackRig, type AttackStyle } from '../src/render/canvas2d/attack.ts';
import { computePlayerPose, computeEnemyPose } from '../src/render/canvas2d/pose.ts';
import { counterDirForAttack } from '../src/sim/counter.ts';

// Round 3 contract: the SKELETON carries the attack direction, and the pose can
// never disagree with the telegraph/indicator (same Dir4 drives both) nor with
// the resolved hit direction (same Dir4 the sim uses to damage).

describe('directional attack rig', () => {
  it('maps the four directions to four distinct, facing-relative styles', () => {
    // up=rising, down=overhead are facing-independent; horizontal is forward/back.
    expect(styleForDir('up', 1)).toBe('rising');
    expect(styleForDir('down', 1)).toBe('overhead');
    expect(styleForDir('up', -1)).toBe('rising');
    expect(styleForDir('down', -1)).toBe('overhead');
    // Player faces +x: right = toward opponent = thrust, left = away = backhand.
    expect(styleForDir('right', 1)).toBe('thrust');
    expect(styleForDir('left', 1)).toBe('backhand');
    // Enemy faces -x: mirrored - left = toward opponent = thrust, right = backhand.
    expect(styleForDir('left', -1)).toBe('thrust');
    expect(styleForDir('right', -1)).toBe('backhand');
  });

  it('gives each style a genuinely different strike path (not one arc rotated)', () => {
    const styles: AttackStyle[] = ['rising', 'overhead', 'thrust', 'backhand'];
    const sig = styles.map((st) => {
      const r = attackRig(st, 'active', 1);
      return `${r.handFx.toFixed(2)},${r.handFy.toFixed(2)},${r.aimFx.toFixed(2)},${r.aimFy.toFixed(2)}`;
    });
    expect(new Set(sig).size).toBe(styles.length);
  });

  it('already telegraphs the direction in the wind-up (cock pose differs per style)', () => {
    const styles: AttackStyle[] = ['rising', 'overhead', 'thrust', 'backhand'];
    const sig = styles.map((st) => {
      const r = attackRig(st, 'windup', 1);
      return `${r.handFx.toFixed(2)},${r.handFy.toFixed(2)}`;
    });
    expect(new Set(sig).size).toBe(styles.length);
  });
});

describe('player pose matches the strike input and indicator', () => {
  for (const dir of DIR4) {
    it(`strike ${dir} -> pose.attackDir === action.dir === ${dir}`, () => {
      const d = makeDuel({ rung: 1 });
      d.player.x = 120;
      step(d, 1, [{ kind: 'strike', dir }]);
      const pose = computePlayerPose(d.player, d.tick);
      // indicators.ts draws the chevron straight from action.dir, so asserting the
      // pose equals action.dir proves pose and indicator can never disagree.
      expect(d.player.action?.dir).toBe(dir);
      expect(pose.attackDir).toBe(dir);
      expect(pose.attackPhase).not.toBeNull();
    });
  }
});

describe('enemy: telegraphed direction === pose direction === resolved hit direction', () => {
  it('a squire overhead reads the same value everywhere it is used', () => {
    const d = makeDuel({ rung: 1 });
    d.player.x = 110;
    let telegraphDir: Dir4 | null = null;
    let telegraphPoseDir: Dir4 | null = null;
    let resolvedDir: Dir4 | null = null;
    let activePoseDir: Dir4 | null = null;

    for (let i = 0; i < 4000 && resolvedDir === null; i += 1) {
      d.player.x = 110; // pin in range so the enemy commits
      step(d, 1);
      if (telegraphDir === null && d.enemy.phase === 'telegraph' && d.enemy.move !== null) {
        const ev = d.events.find((e) => e.kind === 'telegraph');
        telegraphDir = ev?.dir ?? null;
        telegraphPoseDir = computeEnemyPose(d.enemy, d.tick).attackDir;
      }
      if (telegraphDir !== null && d.enemy.phase === 'active' && activePoseDir === null) {
        activePoseDir = computeEnemyPose(d.enemy, d.tick).attackDir;
        const ev = d.events.find((e) => e.kind === 'enemyAttack');
        resolvedDir = ev?.dir ?? null;
      }
    }

    expect(telegraphDir).not.toBeNull();
    expect(resolvedDir).not.toBeNull();
    // The telegraph the player reads, the pose that animates, and the direction
    // the sim resolves the hit with are one and the same value.
    expect(telegraphPoseDir).toBe(telegraphDir);
    expect(activePoseDir).toBe(telegraphDir);
    expect(resolvedDir).toBe(telegraphDir);
    expect(styleForDir(resolvedDir as Dir4, d.enemy.facing)).toBe('overhead');
  });
});

describe('enemy counters the player on the correct line (Addendum 2)', () => {
  const forceCounter = (dir: Dir4): DuelState => {
    const d = makeDuel({ rung: 1 });
    d.player.x = 108;
    d.enemy.x = 150;
    d.enemy.phase = 'idle';
    d.enemy.cooldown = 999; // never launch its own attack during the read
    d.enemy.counterSkill = 1; // always commits, always reads true
    step(d, 1, [{ kind: 'strike', dir }]);
    for (let i = 0; i < 6 && String(d.enemy.phase) !== 'counter'; i += 1) {
      step(d, 1);
    }
    return d;
  };

  for (const dir of DIR4) {
    it(`player ${dir} -> counterDir === counterDirForAttack(${dir}) and pose matches`, () => {
      const d = forceCounter(dir);
      expect(d.enemy.phase).toBe('counter');
      // The enemy's chosen counter is the shared-mapping answer, not a second table.
      expect(d.enemy.counterDir).toBe(counterDirForAttack(dir));
      expect(d.enemy.counterDir).toBe(dir);
      // The counter POSE animates the same direction (pose can't disagree).
      expect(computeEnemyPose(d.enemy, d.tick).counterDir).toBe(dir);
    });
  }

  it('a matched counter deflects the strike but leaves the enemy exposed (2d)', () => {
    const d = forceCounter('up');
    const hp0 = d.enemy.hp;
    // Let the player's committed strike run into the counter; it is deflected.
    for (let i = 0; i < 12 && !(d.enemy.phase === 'recovery' && d.player.action?.phase === 'recovery'); i += 1) {
      step(d, 1);
    }
    expect(d.enemy.hp).toBe(hp0); // no damage - the counter caught the strike
    expect(d.enemy.phase).toBe('recovery'); // ...but the enemy is now exposed
    // The exposed window is real: a follow-up strike lands into the open enemy.
    d.player.x = 108;
    for (let i = 0; i < 30 && d.player.action !== null; i += 1) {
      step(d, 1);
    }
    step(d, 1, [{ kind: 'strike', dir: 'up' }]);
    step(d, 20);
    expect(d.enemy.hp).toBeLessThan(hp0); // the player punished the opening
  });
});
