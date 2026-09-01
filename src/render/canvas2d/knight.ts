import { lerp } from '../../core/math.ts';
import { PALETTE } from '../../config/index.ts';
import { shadedLimb, jointBlob, plate, blob, type Shade, type Vec } from './limb.ts';
import { drawHelm, drawTorso, drawPauldron } from './armor.ts';
import { drawWeapon, drawShield } from './weapon.ts';
import type { KnightVisual } from './style.ts';
import type { Pose } from './pose.ts';

// Assembles a full armoured knight from pose + planted feet. Draws back-to-front
// with a contact shadow. Returns the weapon tip for the motion trail.

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

const contactShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void => {
  ctx.fillStyle = PALETTE.contact;
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.22, 0, 0, Math.PI * 2);
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
    ctx.lineTo(p[0] + 9, p[1]);
  }
  ctx.closePath();
  ctx.fillStyle = sh.shadow;
  ctx.fill();
};

const drawLeg = (ctx: CanvasRenderingContext2D, hip: Vec, footX: number, groundY: number, dir: number, s: number, sh: Shade): void => {
  const foot: Vec = [footX, groundY];
  const knee: Vec = [(hip[0] + foot[0]) / 2 + dir * 4 * s, (hip[1] + foot[1]) / 2];
  shadedLimb(ctx, hip, knee, 9 * s, 6 * s, sh);
  shadedLimb(ctx, knee, foot, 6 * s, 5 * s, sh);
  jointBlob(ctx, knee, 4.5 * s, sh);
  plate(ctx, [foot, [foot[0] + dir * 13 * s, foot[1]], [foot[0] + dir * 12 * s, foot[1] - 5 * s], [foot[0] - dir * 4 * s, foot[1] - 6 * s]], sh.base, sh.warm);
};

const drawArm = (ctx: CanvasRenderingContext2D, shoulder: Vec, u: Vec, s: number, sh: Shade): Vec => {
  const elbow: Vec = [shoulder[0] + u[0] * 20 * s, shoulder[1] + u[1] * 20 * s];
  const hand: Vec = [elbow[0] + u[0] * 20 * s, elbow[1] + u[1] * 20 * s];
  shadedLimb(ctx, shoulder, elbow, 7 * s, 6 * s, sh);
  shadedLimb(ctx, elbow, hand, 6 * s, 5 * s, sh);
  jointBlob(ctx, hand, 5 * s, sh);
  return hand;
};

const drawHound = (ctx: CanvasRenderingContext2D, x: number, groundY: number, dir: number, s: number, sh: Shade): void => {
  const bx = x + dir * 34 * s;
  const by = groundY - 10 * s;
  contactShadow(ctx, bx, groundY, 16 * s);
  shadedLimb(ctx, [bx - dir * 14 * s, by], [bx + dir * 12 * s, by], 8 * s, 7 * s, sh);
  for (const fx of [-10, -4, 6, 12]) {
    shadedLimb(ctx, [bx + dir * fx * s, by], [bx + dir * fx * s, groundY], 3 * s, 3 * s, sh);
  }
  blob(ctx, [bx + dir * 15 * s, by - 4 * s], 6 * s, sh.base);
  plate(ctx, [[bx + dir * 18 * s, by - 8 * s], [bx + dir * 22 * s, by - 12 * s], [bx + dir * 20 * s, by - 6 * s]], sh.base, sh.warm);
};

export const drawKnight = (ctx: CanvasRenderingContext2D, d: KnightDraw): { tipX: number; tipY: number; active: boolean } => {
  const { pose: po, scale: s, facing: dir } = d;
  const vis = d.visual;
  const sh = vis.shade;
  const hipY = d.groundY - 60 * s * (1 - 0.24 * po.crouch) + po.bob * 0.4;
  const pelvis: Vec = [d.x, hipY];
  const chest: Vec = [d.x + po.lean * 22 * s * dir, hipY - 48 * s * (1 - 0.12 * po.crouch)];
  const head: Vec = [chest[0] + po.lean * 9 * s * dir, chest[1] - 24 * s];
  const shoulderW = 15 * s;

  contactShadow(ctx, d.x, d.groundY, 26 * s * vis.scale);
  drawCape(ctx, d.cape, sh);
  if (vis.hound) {
    drawHound(ctx, d.x, d.groundY, -dir, s, sh);
  }
  drawLeg(ctx, [pelvis[0] - shoulderW * 0.5, pelvis[1]], d.feet[0], d.groundY, dir, s, sh);
  drawLeg(ctx, [pelvis[0] + shoulderW * 0.5, pelvis[1]], d.feet[1], d.groundY, dir, s, sh);

  const backSh: Vec = [chest[0] - dir * shoulderW, chest[1] + 3 * s];
  if (vis.shield !== null) {
    drawShield(ctx, [backSh[0] - dir * 6 * s, backSh[1] + 12 * s], s, vis.shield, sh, vis.accent);
  } else {
    drawArm(ctx, backSh, [-dir * 0.3, 1], s, sh);
  }
  drawTorso(ctx, chest, pelvis, shoulderW, dir, sh, vis.accent);
  drawPauldron(ctx, backSh, 8 * s, sh);

  const theta = lerp(-2.3, 1.05, (po.swing + 0.6) / 1.6);
  const u: Vec = [Math.sin(theta) * dir, Math.cos(theta)];
  const frontSh: Vec = [chest[0] + dir * shoulderW, chest[1] + 3 * s];
  drawPauldron(ctx, frontSh, 8 * s, sh);
  drawHelm(ctx, head[0], head[1], 13 * s, dir, vis.helm, sh, vis.accent);
  const hand = drawArm(ctx, frontSh, u, s, sh);
  const tip = drawWeapon(ctx, hand, u, s, d.chicken ? 'chicken' : vis.weapon, sh, vis.accent);
  return { tipX: tip[0], tipY: tip[1], active: po.active };
};
