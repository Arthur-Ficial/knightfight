import { clamp01, easeOutCubic, easeInCubic, lerp } from '../../core/math.ts';
import type { Dir4 } from '../../core/types.ts';

// THE single source of truth for "attack direction -> body pose". Player and
// enemy both feed a Dir4 + their facing through here and get the SAME four
// motions, mirrored by facing. Four genuinely different keyframe paths - every
// joint (shoulder via hand target, elbow via reach, wrist via aim, spine, hips,
// both feet) carries its own per-direction curve. The wind-up already tells the
// direction: rising coils LOW, overhead raises HIGH, thrust retracts to the ribs,
// backhand cocks behind the far shoulder.

/** The four readable attack shapes. Horizontal reads as forward/back vs facing. */
export type AttackStyle = 'rising' | 'overhead' | 'thrust' | 'backhand';
export type AttackPhase = 'windup' | 'active' | 'recovery';

/** up=rising from below, down=overhead chop. Horizontal is facing-relative:
 *  toward the opponent = thrust, away = backhand. Facing folds the screen Dir4
 *  into the same body-space verb for player (faces +x) and enemy (faces -x). */
export const styleForDir = (dir: Dir4, facing: number): AttackStyle => {
  if (dir === 'up') {
    return 'rising';
  }
  if (dir === 'down') {
    return 'overhead';
  }
  const towardOpponent = (dir === 'right') === (facing >= 0);
  return towardOpponent ? 'thrust' : 'backhand';
};

/**
 * One frame of the arm+body rig, in BODY-LOCAL units. `fx` = forward (toward the
 * opponent), `fy` = up. The renderer flips fx by facing so the same rig mirrors.
 * Hand/aim are fractions of arm length; body deltas are small local scalars.
 */
export interface AttackRig {
  handFx: number;
  handFy: number;
  aimFx: number;
  aimFy: number;
  reach: number;
  lean: number;
  pitch: number;
  crouch: number;
  torsoRise: number;
  hipShift: number;
  footFront: number;
  footBack: number;
  backHeel: number;
  bodyShift: number;
}

const NEUTRAL: AttackRig = {
  handFx: 0.56, handFy: -0.08, aimFx: 0.92, aimFy: 0.22, reach: 0.78,
  lean: 0.05, pitch: 0, crouch: 0.05, torsoRise: 0, hipShift: 0,
  footFront: 0, footBack: 0, backHeel: 0, bodyShift: 0,
};

// Per style: the wind-up "cock" pose and the "strike" pose. Anticipation frames
// differ per direction BEFORE the strike lands - that is what makes it fair.
interface Key { cock: AttackRig; strike: AttackRig }

const rig = (p: Partial<AttackRig>): AttackRig => ({ ...NEUTRAL, ...p });

const KEYS: Record<AttackStyle, Key> = {
  // Rising: coil deep and low, then uppercut up through the body line.
  rising: {
    cock: rig({ handFx: 0.30, handFy: -0.86, aimFx: 0.55, aimFy: -0.85, reach: 0.68,
      lean: -0.12, pitch: -0.05, crouch: 0.38, hipShift: -0.06, footFront: 2, footBack: -1, backHeel: 0.2 }),
    strike: rig({ handFx: 0.44, handFy: 0.96, aimFx: 0.32, aimFy: 1.0, reach: 0.9,
      lean: 0.16, pitch: -0.02, crouch: 0.04, torsoRise: 0.55, hipShift: 0.1, footFront: 3, footBack: 1, backHeel: 0.85, bodyShift: 2 }),
  },
  // Overhead: raise fully above the helm (tipped back), then chop the vertical.
  overhead: {
    cock: rig({ handFx: -0.06, handFy: 0.98, aimFx: -0.22, aimFy: 1.0, reach: 0.86,
      lean: -0.14, pitch: -0.12, crouch: 0.1, hipShift: -0.08, footFront: -1, footBack: -2, backHeel: 0.1, bodyShift: -1 }),
    strike: rig({ handFx: 0.7, handFy: -0.42, aimFx: 0.85, aimFy: -0.52, reach: 0.9,
      lean: 0.14, pitch: 0.36, crouch: 0.36, hipShift: 0.12, footFront: 2, footBack: 1, backHeel: 0.2, bodyShift: 3 }),
  },
  // Thrust: retract to the ribs, then extend the whole body forward in a lunge.
  thrust: {
    cock: rig({ handFx: -0.22, handFy: -0.04, aimFx: 1.0, aimFy: 0.02, reach: 0.54,
      lean: -0.14, pitch: 0, crouch: 0.12, hipShift: -0.1, footFront: -2, footBack: -2, backHeel: 0.1, bodyShift: -2 }),
    strike: rig({ handFx: 1.0, handFy: -0.05, aimFx: 1.0, aimFy: 0.0, reach: 0.93,
      lean: 0.3, pitch: 0.05, crouch: 0.1, hipShift: 0.3, footFront: 11, footBack: -3, backHeel: 0.5, bodyShift: 9 }),
  },
  // Backhand: step back, rotate away, cock behind the far shoulder, sweep across.
  backhand: {
    cock: rig({ handFx: -0.56, handFy: 0.46, aimFx: -0.82, aimFy: 0.6, reach: 0.74,
      lean: -0.32, pitch: -0.08, crouch: 0.18, hipShift: -0.16, footFront: -3, footBack: -9, backHeel: 0.0, bodyShift: -8 }),
    strike: rig({ handFx: 0.62, handFy: 0.12, aimFx: 0.9, aimFy: 0.12, reach: 0.9,
      lean: 0.18, pitch: 0.0, crouch: 0.1, hipShift: 0.1, footFront: 2, footBack: -2, backHeel: 0.3, bodyShift: 0 }),
  },
};

const mix = (a: AttackRig, b: AttackRig, t: number): AttackRig => ({
  handFx: lerp(a.handFx, b.handFx, t),
  handFy: lerp(a.handFy, b.handFy, t),
  aimFx: lerp(a.aimFx, b.aimFx, t),
  aimFy: lerp(a.aimFy, b.aimFy, t),
  reach: lerp(a.reach, b.reach, t),
  lean: lerp(a.lean, b.lean, t),
  pitch: lerp(a.pitch, b.pitch, t),
  crouch: lerp(a.crouch, b.crouch, t),
  torsoRise: lerp(a.torsoRise, b.torsoRise, t),
  hipShift: lerp(a.hipShift, b.hipShift, t),
  footFront: lerp(a.footFront, b.footFront, t),
  footBack: lerp(a.footBack, b.footBack, t),
  backHeel: lerp(a.backHeel, b.backHeel, t),
  bodyShift: lerp(a.bodyShift, b.bodyShift, t),
});

/**
 * Resolve the rig for a style at a phase. windup: neutral->cock (anticipation),
 * active: cock->strike (snappy release), recovery: strike->neutral (settle).
 */
export const attackRig = (style: AttackStyle, phase: AttackPhase, prog: number): AttackRig => {
  const k = KEYS[style];
  const t = clamp01(prog);
  if (phase === 'windup') {
    return mix(NEUTRAL, k.cock, easeInCubic(t));
  }
  if (phase === 'active') {
    return mix(k.cock, k.strike, easeOutCubic(t));
  }
  return mix(k.strike, NEUTRAL, easeOutCubic(t));
};

// The four DEFENSIVE counter braces, keyed by the direction of the attack being
// answered (the shared Dir4). Each is its own readable pose: a rising cut is met
// with a LOW parry, an overhead with a HIGH catch, a thrust with a lean-back
// SIDESTEP/deflect, a back sweep by TURNING IN to close the distance.
const GUARDS: Record<Dir4, AttackRig> = {
  up: rig({ handFx: 0.36, handFy: -0.5, aimFx: 0.7, aimFy: -0.55, reach: 0.7,
    lean: 0.12, crouch: 0.42, hipShift: 0.05, footFront: 2, backHeel: 0.1 }),
  down: rig({ handFx: 0.14, handFy: 0.72, aimFx: 0.92, aimFy: 0.25, reach: 0.72,
    lean: -0.05, crouch: 0.08, hipShift: -0.03, backHeel: 0.1 }),
  right: rig({ handFx: 0.6, handFy: 0.05, aimFx: 1.0, aimFy: 0.05, reach: 0.8,
    lean: -0.16, crouch: 0.14, hipShift: -0.1, footBack: -3, backHeel: 0.3, bodyShift: -3 }),
  left: rig({ handFx: 0.42, handFy: 0.18, aimFx: 0.85, aimFy: 0.2, reach: 0.78,
    lean: 0.16, crouch: 0.1, hipShift: 0.12, footFront: 3, bodyShift: 4 }),
};

/** The counter brace snaps in over the first half of the hold, then holds. */
export const defenseRig = (dir: Dir4, prog: number): AttackRig =>
  mix(NEUTRAL, GUARDS[dir], easeOutCubic(clamp01(prog * 2.2)));
