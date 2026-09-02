import { clamp01, lerp } from '../../core/math.ts';
import { TICK_MS } from '../../core/loop.ts';
import { CHARGE_MAX_MS, COUNTER } from '../../config/index.ts';
import type { Dir4 } from '../../core/types.ts';
import type { AttackPhase } from './attack.ts';
import type { EnemyState, PlayerState } from '../../sim/state.ts';

// Procedural animation: turn a fighter's sim state into weighty pose parameters.
// The ambient fields (bob/guard/hurt/charge/stride) drive idle + defence. When a
// directional strike is live, attackDir + attackPhase + attackProg are set and
// knight.ts drives the skeleton through the SHARED directional rig (attack.ts) -
// the same four motions for player and enemy, so the pose ALWAYS matches the
// telegraph/indicator direction.

export interface Pose {
  bob: number;
  crouch: number;
  lean: number;
  swing: number;
  guard: number;
  hurt: number;
  stride: number;
  charge: number;
  active: boolean;
  attackDir: Dir4 | null;
  attackPhase: AttackPhase | null;
  attackProg: number;
  /** Non-null while the fighter holds a directional counter brace (the answer to
   *  the opponent's attack on that line). Drives the defensive rig. */
  counterDir: Dir4 | null;
}

const base = (tick: number): Pose => ({
  bob: Math.sin(tick * 0.08) * 1.6,
  crouch: 0,
  lean: 0,
  swing: 0,
  guard: 0,
  hurt: 0,
  stride: 0,
  charge: 0,
  active: false,
  attackDir: null,
  attackPhase: null,
  attackProg: 0,
  counterDir: null,
});

/** Fraction 0..1 through a countdown phase (timer runs len -> 0). */
const phaseProg = (timer: number, len: number): number => clamp01(1 - timer / Math.max(1, len));

export const computePlayerPose = (p: PlayerState, tick: number): Pose => {
  const pose = base(tick);
  if (p.blocking) {
    pose.guard = 1;
    pose.crouch = 0.18;
  }
  if (p.charging) {
    pose.charge = clamp01((p.chargeTicks * TICK_MS) / CHARGE_MAX_MS);
    pose.swing = -0.5 * pose.charge;
    pose.lean = -0.25 * pose.charge;
    pose.crouch = 0.25 * pose.charge;
  }
  if (p.stunTicks > 0) {
    pose.hurt = 1;
    pose.lean = -0.4;
  }
  const a = p.action;
  if (a === null) {
    return pose;
  }
  if (a.name === 'dodge') {
    pose.crouch = 0.4;
    pose.stride = 1;
    return pose;
  }
  if (a.name === 'parry') {
    pose.guard = 1;
    pose.swing = -0.2;
    return pose;
  }
  if (a.name === 'strike' || a.name === 'heavy') {
    pose.attackDir = a.dir;
    pose.attackPhase = a.phase;
    pose.attackProg = phaseProg(a.timer, a.phase === 'windup' ? a.windupLen : a.phase === 'active' ? a.activeLen : a.recoveryLen);
    pose.active = a.phase === 'active';
    return pose;
  }
  // feint / whirlwind: a non-directional flourish keeps the old single arc.
  applyFlourish(pose, a.phase, a.timer, a.windupLen, a.activeLen, a.recoveryLen);
  return pose;
};

const applyFlourish = (
  pose: Pose, phase: string, timer: number, windupLen: number, activeLen: number, recoveryLen: number,
): void => {
  if (phase === 'windup') {
    const prog = phaseProg(timer, windupLen);
    pose.swing = -0.5 * prog;
    pose.lean = -0.3 * prog;
  } else if (phase === 'active') {
    const prog = phaseProg(timer, activeLen);
    pose.swing = lerp(-0.5, 1, prog);
    pose.lean = lerp(-0.3, 0.6, prog);
    pose.active = true;
  } else {
    const prog = phaseProg(timer, recoveryLen);
    pose.swing = 1 - 0.75 * prog;
    pose.lean = 0.4 * (1 - prog);
  }
};

export const computeEnemyPose = (e: EnemyState, tick: number): Pose => {
  const pose = base(tick);
  if (e.phase === 'counter' && e.counterDir !== null) {
    pose.counterDir = e.counterDir;
    pose.attackProg = phaseProg(e.timer, COUNTER.holdTicks);
    return pose;
  }
  const m = e.move;
  if (m !== null && (e.phase === 'telegraph' || e.phase === 'active' || e.phase === 'recovery')) {
    pose.attackDir = m.dir;
    if (e.phase === 'telegraph') {
      pose.attackPhase = 'windup';
      pose.attackProg = phaseProg(e.timer, Math.max(1, m.windup * e.telegraphMult));
    } else if (e.phase === 'active') {
      pose.attackPhase = 'active';
      pose.attackProg = phaseProg(e.timer, m.active);
      pose.active = true;
    } else {
      pose.attackPhase = 'recovery';
      pose.attackProg = phaseProg(e.timer, m.recovery);
    }
    return pose;
  }
  if (e.phase === 'staggered') {
    pose.hurt = 1;
    pose.lean = -0.5;
    pose.crouch = 0.3;
  } else if (e.phase === 'feint') {
    pose.swing = -0.25;
    pose.lean = -0.2;
  } else {
    pose.stride = Math.sin(tick * 0.16);
  }
  return pose;
};
