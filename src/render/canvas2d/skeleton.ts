import { lerp } from '../../core/math.ts';
import { PALETTE } from '../../config/index.ts';
import type { Pose } from './pose.ts';

// Draws a knight from pose parameters using forward kinematics: torso, head,
// two legs with stance, a weapon arm swung by the pose, plus cape and rim light.
// Zero sprites - the whole figure is code.

export interface KnightStyle {
  readonly body: string;
  readonly rim: string;
  readonly steel: string;
}

export interface KnightDraw {
  readonly x: number;
  readonly groundY: number;
  readonly facing: number;
  readonly scale: number;
  readonly pose: Pose;
  readonly style: KnightStyle;
  readonly cape: readonly (readonly [number, number])[];
  readonly chicken: boolean;
}

const limb = (ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, w: number, c: string): void => {
  ctx.lineCap = 'round';
  ctx.lineWidth = w;
  ctx.strokeStyle = c;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
};

const dot = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: string): void => {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

const drawCape = (ctx: CanvasRenderingContext2D, cape: readonly (readonly [number, number])[], c: string): void => {
  if (cape.length < 2) {
    return;
  }
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(cape[0]?.[0] ?? 0, cape[0]?.[1] ?? 0);
  for (const p of cape) {
    ctx.lineTo(p[0], p[1]);
  }
  for (let i = cape.length - 1; i >= 0; i -= 1) {
    const p = cape[i] as readonly [number, number];
    ctx.lineTo(p[0] + 5, p[1]);
  }
  ctx.closePath();
  ctx.fill();
};

export const drawKnight = (ctx: CanvasRenderingContext2D, d: KnightDraw): { tipX: number; tipY: number } => {
  const { pose: po, style, scale: s, facing: dir } = d;
  const footY = d.groundY;
  const hipY = footY - 62 * s * (1 - 0.22 * po.crouch) + po.bob * 0.4;
  const hipX = d.x;
  const chestX = hipX + po.lean * 22 * s * dir;
  const chestY = hipY - 50 * s * (1 - 0.1 * po.crouch);
  const headX = chestX + po.lean * 8 * s * dir;
  const headY = chestY - 22 * s;

  drawCape(ctx, d.cape, style.body);

  const stance = (16 + po.crouch * 8) * s;
  const stride = po.stride * 12 * s;
  limb(ctx, hipX, hipY, hipX - stance - stride, footY, 8 * s, style.steel);
  limb(ctx, hipX, hipY, hipX + stance + stride, footY, 8 * s, style.steel);
  limb(ctx, hipX, hipY, chestX, chestY, 12 * s, style.body);

  const shX = chestX + 3 * s * dir;
  const shY = chestY + 5 * s;
  const theta = lerp(-2.3, 1.05, (po.swing + 0.6) / 1.6);
  const armLen = 30 * s;
  const ux = Math.sin(theta) * dir;
  const uy = Math.cos(theta);
  const handX = shX + ux * armLen;
  const handY = shY + uy * armLen;
  if (po.guard > 0.5) {
    limb(ctx, shX, shY, chestX - 10 * s * dir, chestY + 4 * s, 8 * s, style.steel);
    dot(ctx, chestX - 12 * s * dir, chestY + 6 * s, 11 * s, style.steel);
  } else {
    limb(ctx, shX, shY, chestX - 8 * s * dir, hipY - 4 * s, 7 * s, style.body);
  }
  limb(ctx, shX, shY, handX, handY, 8 * s, style.body);

  const bladeLen = d.chicken ? 34 * s : 58 * s;
  const tipX = handX + ux * bladeLen;
  const tipY = handY + uy * bladeLen;
  limb(ctx, handX, handY, tipX, tipY, d.chicken ? 8 * s : 4 * s, d.chicken ? PALETTE.torch0 : style.rim);
  limb(ctx, handX - ux * 3 * s, handY - uy * 3 * s, handX + ux * 8 * s, handY + uy * 8 * s, 10 * s, style.steel);

  dot(ctx, headX, headY, 12 * s, style.body);
  dot(ctx, headX + 4 * s * dir, headY - 2 * s, 3 * s, style.rim);
  if (d.chicken) {
    dot(ctx, headX, headY - 12 * s, 4 * s, PALETTE.tellRed);
  }
  limb(ctx, chestX + 4 * s * dir, chestY, hipX + 3 * s * dir, hipY, 2.5 * s, style.rim);
  return { tipX, tipY };
};
