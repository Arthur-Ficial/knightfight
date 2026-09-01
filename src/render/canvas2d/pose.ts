import { clamp01, easeOutCubic, lerp } from '../../core/math.ts';
import { TICK_MS } from '../../core/loop.ts';
import { CHARGE_MAX_MS } from '../../config/index.ts';
import type { EnemyState, PlayerState } from '../../sim/state.ts';

// Procedural animation: turn a fighter's sim state into weighty pose parameters
// (anticipation on windup, follow-through on recovery, recoil on hit). The
// skeleton renderer turns these into joint angles.

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
});

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
  applyAttackPose(pose, a.phase, a.timer, a.windupLen, a.activeLen, a.recoveryLen);
  if (a.name === 'heavy' && a.phase === 'windup') {
    pose.crouch = Math.max(pose.crouch, 0.45);
    pose.lean = Math.min(pose.lean, -0.35);
  }
  return pose;
};

const applyAttackPose = (
  pose: Pose,
  phase: string,
  timer: number,
  windupLen: number,
  activeLen: number,
  recoveryLen: number,
): void => {
  if (phase === 'windup') {
    const prog = 1 - timer / Math.max(1, windupLen);
    pose.swing = -0.5 * prog;
    pose.lean = -0.3 * prog;
    pose.crouch = 0.15 * prog;
  } else if (phase === 'active') {
    const prog = easeOutCubic(1 - timer / Math.max(1, activeLen));
    pose.swing = lerp(-0.5, 1, prog);
    pose.lean = lerp(-0.3, 0.6, prog);
    pose.active = true;
  } else {
    const prog = 1 - timer / Math.max(1, recoveryLen);
    pose.swing = 1 - 0.25 * prog;
    pose.lean = 0.4 * (1 - prog);
  }
};

export const computeEnemyPose = (e: EnemyState, tick: number): Pose => {
  const pose = base(tick);
  const total = e.move ? Math.max(1, e.move.windup * e.telegraphMult) : 1;
  if (e.phase === 'telegraph') {
    const prog = clamp01(1 - e.timer / total);
    pose.swing = -0.6 * prog;
    pose.lean = -0.35 * prog;
    pose.crouch = 0.2 * prog;
  } else if (e.phase === 'active') {
    const prog = easeOutCubic(1 - e.timer / Math.max(1, e.move ? e.move.active : 1));
    pose.swing = lerp(-0.6, 1, prog);
    pose.lean = lerp(-0.35, 0.7, prog);
    pose.active = true;
  } else if (e.phase === 'recovery') {
    pose.swing = 0.7;
    pose.lean = 0.2;
  } else if (e.phase === 'staggered') {
    pose.hurt = 1;
    pose.lean = -0.5;
    pose.crouch = 0.3;
  } else if (e.phase === 'feint') {
    pose.swing = -0.25;
  } else {
    pose.stride = Math.sin(tick * 0.16);
  }
  return pose;
};
