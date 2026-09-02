import { clamp, clamp01 } from '../../core/math.ts';
import { PALETTE } from '../../config/index.ts';
import { shadedLimb, jointBlob, plate, blob, type Shade, type Vec } from './limb.ts';
import { drawHelm, drawTorso, drawPauldron } from './armor.ts';
import { drawWeapon, drawShield } from './weapon.ts';
import { solveElbow, reachClamp } from './arm.ts';
import { attackRig, defenseRig, styleForDir, type AttackRig } from './attack.ts';
import type { KnightVisual } from './style.ts';
import type { Pose } from './pose.ts';

// Assembles a full armoured knight: legs with weight shift, breastplate, real
// two-bone IK arms that grip the hilt, off-hand always employed, socketed
// shoulders under pauldrons. When a directional strike is live the weapon arm,
// spine, hips and both feet follow the SHARED directional rig (attack.ts) so the
// motion reads as up/down/forward/back. Returns the weapon tip for the trail.

export interface KnightDraw {
  readonly x: number;
  readonly groundY: number;
  readonly facing: number;
  readonly scale: number;
  readonly pose: Pose;
  readonly visual: KnightVisual;
  readonly cape: readonly Vec[];
  readonly feet: readonly [number, number];
  readonly chicken: boolean;
}

const QUANT = Math.PI / 8;
const contactShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void => {
  ctx.fillStyle = PALETTE.contact;
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y), Math.round(w), Math.max(2, Math.round(w * 0.2)), 0, 0, Math.PI * 2);
  ctx.fill();
};

const drawCape = (ctx: CanvasRenderingContext2D, cape: readonly Vec[], sh: Shade): void => {
  if (cape.length < 2) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(cape[0]?.[0] ?? 0, cape[0]?.[1] ?? 0);
  for (const p of cape) {
    ctx.lineTo(p[0], p[1]);
  }
  for (let i = cape.length - 1; i >= 0; i -= 1) {
    const p = cape[i] as Vec;
    ctx.lineTo(p[0] + 6, p[1]);
  }
  ctx.closePath();
  ctx.fillStyle = sh.shadow;
  ctx.fill();
};

const drawLeg = (ctx: CanvasRenderingContext2D, hip: Vec, footX: number, groundY: number, dir: number, s: number, sh: Shade, lift = 0): void => {
  const foot: Vec = [footX, groundY - lift];
  const knee: Vec = [(hip[0] + foot[0]) / 2 + dir * 3 * s, (hip[1] + foot[1]) / 2 + 2 * s];
  shadedLimb(ctx, hip, knee, 8 * s, 6 * s, sh);
  shadedLimb(ctx, knee, foot, 6 * s, 5 * s, sh);
  jointBlob(ctx, knee, 4 * s, sh);
  const toe = lift > 0 ? dir * 9 * s : dir * 11 * s;
  plate(ctx, [foot, [foot[0] + toe, foot[1] + lift * 0.5], [foot[0] + dir * 10 * s, foot[1] - 4 * s], [foot[0] - dir * 3 * s, foot[1] - 5 * s]], sh.base, sh.warm);
};

const drawBones = (ctx: CanvasRenderingContext2D, sh: Shade, shoulder: Vec, hand: Vec, upper: number, fore: number, pole: Vec, s: number): void => {
  const h = reachClamp(shoulder, hand, upper + fore - 0.5);
  const elbow = solveElbow(shoulder, h, upper, fore, pole);
  shadedLimb(ctx, shoulder, elbow, 6 * s, 5 * s, sh);
  shadedLimb(ctx, elbow, h, 5 * s, 4 * s, sh);
  jointBlob(ctx, elbow, 3.4 * s, sh);
};

const drawHound = (ctx: CanvasRenderingContext2D, x: number, groundY: number, dir: number, s: number, sh: Shade): void => {
  const bx = x + dir * 30 * s;
  const by = groundY - 9 * s;
  contactShadow(ctx, bx, groundY, 13 * s);
  shadedLimb(ctx, [bx - dir * 12 * s, by], [bx + dir * 10 * s, by], 7 * s, 6 * s, sh);
  for (const fx of [-9, -3, 5, 10]) {
    shadedLimb(ctx, [bx + dir * fx * s, by], [bx + dir * fx * s, groundY], 2.5 * s, 2.5 * s, sh);
  }
  blob(ctx, [bx + dir * 13 * s, by - 3 * s], 5 * s, sh.base);
  plate(ctx, [[bx + dir * 15 * s, by - 7 * s], [bx + dir * 19 * s, by - 10 * s], [bx + dir * 17 * s, by - 5 * s]], sh.base, sh.warm);
};

interface Frame {
  readonly bodyX: number;
  readonly lean: number;
  readonly crouch: number;
  readonly rise: number;
  readonly pitch: number;
  readonly hipF: number;
  readonly weightBack: number;
}

/** Resolve the body frame + optional attack rig from the pose. */
const resolveFrame = (po: Pose, dir: number, t: number): { frame: Frame; rig: AttackRig | null } => {
  const rig = po.counterDir !== null
    ? defenseRig(po.counterDir, po.attackProg)
    : po.attackDir !== null && po.attackPhase !== null
      ? attackRig(styleForDir(po.attackDir, dir), po.attackPhase, po.attackProg)
      : null;
  const lean = rig ? rig.lean : po.lean;
  const crouch = rig ? Math.max(po.crouch, rig.crouch) : po.crouch;
  const weightBack = rig ? (po.active ? 0 : 0.55 * (1 - clamp01(po.attackProg))) : (po.active ? 0 : 1 - t);
  return {
    frame: {
      bodyX: rig ? rig.bodyShift : 0,
      lean, crouch, rise: rig ? rig.torsoRise : 0, pitch: rig ? rig.pitch : 0,
      hipF: rig ? rig.hipShift : 0, weightBack,
    },
    rig,
  };
};

/** Weapon-arm hand target + aim: the rig path when striking, else the idle arc. */
const armTarget = (rig: AttackRig | null, frontSh: Vec, chestT: number, dir: number, upper: number, fore: number): { hand: Vec; aim: Vec } => {
  const L = upper + fore;
  if (rig !== null) {
    const raw: Vec = [frontSh[0] + rig.handFx * L * dir, frontSh[1] - rig.handFy * L];
    const hand = reachClamp(frontSh, raw, L * clamp(rig.reach, 0.32, 0.97));
    const al = Math.hypot(rig.aimFx, rig.aimFy) || 1;
    return { hand, aim: [(rig.aimFx / al) * dir, -rig.aimFy / al] };
  }
  const ang = -1.5 + 3 * chestT;
  const reach = L * (0.72 + 0.24 * chestT);
  const raw: Vec = [frontSh[0] + Math.sin(ang) * dir * reach, frontSh[1] - Math.cos(ang) * reach];
  const hand = reachClamp(frontSh, raw, L - 0.5);
  return { hand, aim: [Math.sin(ang) * dir, -Math.cos(ang)] };
};

export const drawKnight = (ctx: CanvasRenderingContext2D, d: KnightDraw): { tipX: number; tipY: number; active: boolean } => {
  const { pose: po, scale: s, facing: dir } = d;
  const vis = d.visual;
  const sh = vis.shade;
  const weapon = d.chicken ? 'chicken' : vis.weapon;
  const twoH = vis.weapon === 'greatsword' || vis.weapon === 'halberd';
  const t = clamp01((po.swing + 0.6) / 1.6);
  const { frame: f, rig } = resolveFrame(po, dir, t);

  const cx = d.x + f.bodyX * s * dir;
  const hipY = d.groundY - 58 * s * (1 - 0.24 * f.crouch) + po.bob * 0.4 - f.rise * 7 * s;
  const pelvis: Vec = [cx - dir * 2 * s * f.weightBack + f.hipF * 9 * s * dir, hipY];
  const chest: Vec = [cx + f.lean * 20 * s * dir - dir * 2 * s * f.weightBack + f.hipF * 3 * s * dir, hipY - 46 * s * (1 - 0.12 * f.crouch) - f.rise * 10 * s];
  const head: Vec = [chest[0] + (f.lean + f.pitch) * 8 * s * dir, chest[1] - 22 * s + f.pitch * 12 * s - f.rise * 2 * s];
  const shW = 13 * s;
  const upper = 16 * s;
  const fore = 15 * s;

  contactShadow(ctx, cx, d.groundY, 22 * s * vis.scale);
  drawCape(ctx, d.cape, sh);
  if (vis.hound) {
    drawHound(ctx, d.x, d.groundY, -dir, s, sh);
  }
  const footBack = (dir > 0 ? d.feet[0] : d.feet[1]) + (rig ? rig.footBack : 0) * s * dir;
  const footFront = (dir > 0 ? d.feet[1] : d.feet[0]) + dir * 4 * s + (rig ? rig.footFront : 0) * s * dir;
  drawLeg(ctx, [pelvis[0] - dir * shW * 0.6, pelvis[1]], footBack, d.groundY, dir, s, sh, (rig ? rig.backHeel : 0) * 6 * s);

  const frontSh: Vec = [chest[0] + dir * shW * 0.5, chest[1] + 3 * s];
  const { hand, aim: aimRaw } = armTarget(rig, frontSh, t, dir, upper, fore);
  const qa = Math.round(Math.atan2(aimRaw[1], aimRaw[0]) / QUANT) * QUANT;
  const aim: Vec = [Math.cos(qa), Math.sin(qa)];

  // off-hand: shield / two-handed haft grip / braced on the belt - always within
  // reach so the elbow bends (never a straight noodle to a far-away target).
  const backSh: Vec = [chest[0] - dir * shW * 0.5, chest[1] + 3 * s];
  const offPole: Vec = [backSh[0] + dir * 6 * s, backSh[1] + 16 * s];
  const shieldGrip: Vec = [chest[0] + dir * 2 * s, chest[1] + 15 * s];
  const offHand: Vec = vis.shield !== null ? shieldGrip
    : twoH ? [hand[0] - aim[0] * 8 * s, hand[1] - aim[1] * 8 * s]
      : [chest[0] + dir * 3 * s, chest[1] + 16 * s];
  drawBones(ctx, sh, backSh, offHand, upper, fore, offPole, s);
  jointBlob(ctx, offHand, 3.4 * s, sh);

  drawTorso(ctx, chest, pelvis, shW, dir, sh, vis.accent);
  drawPauldron(ctx, backSh, 7 * s, sh);
  drawLeg(ctx, [pelvis[0] + dir * shW * 0.6, pelvis[1]], footFront, d.groundY, dir, s, sh);
  if (vis.shield !== null) {
    drawShield(ctx, shieldGrip, s, vis.shield, sh, vis.accent);
  }
  drawHelm(ctx, head[0], head[1], 12 * s, dir, vis.helm, sh, vis.accent);

  drawBones(ctx, sh, frontSh, hand, upper, fore, [frontSh[0] + dir * 5 * s, frontSh[1] + 22 * s], s);
  drawPauldron(ctx, frontSh, 7 * s, sh);
  jointBlob(ctx, hand, 3.6 * s, sh);
  const tip = drawWeapon(ctx, hand, aim, s, weapon, sh, vis.accent);
  return { tipX: tip[0], tipY: tip[1], active: po.active };
};
