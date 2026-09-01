import { PALETTE } from '../../config/index.ts';
import { dpr } from '../../platform/viewport.ts';
import type { DuelState, SimEvent } from '../../sim/state.ts';
import type { Renderer, RenderView } from '../renderer.ts';
import { makeView, sx, type View } from './view.ts';
import { drawBackground, drawForeground } from './background.ts';
import { drawHud } from './hud.ts';
import { applyPost } from './post.ts';
import { FxSystem } from './fx.ts';
import { Cape } from './cape.ts';
import { Legs } from './legs.ts';
import { computePlayerPose, computeEnemyPose } from './pose.ts';
import { drawKnight } from './knight.ts';
import { visualFor, HERO_VISUAL, HERO_CHICKEN } from './style.ts';

const FONT = 'ui-monospace, "SF Mono", Menlo, monospace';

export class Canvas2DRenderer implements Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private readonly fx = new FxSystem();
  private readonly heroCape = new Cape();
  private readonly foeCape = new Cape();
  private readonly heroLegs = new Legs();
  private readonly foeLegs = new Legs();
  private trail: [number, number][] = [];
  private ember = 0;
  private flash = 0;
  private chicken = false;
  private sitting = false;
  private sleeping = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      throw new Error('2d canvas context unavailable');
    }
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    this.w = width;
    this.h = height;
    const ratio = dpr();
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private reactToEvents(view: View, duel: DuelState, events: readonly SimEvent[]): void {
    for (const ev of events) {
      const x = sx(view, ev.x ?? duel.enemy.x);
      const y = view.groundY - view.h * 0.14;
      if (ev.kind === 'parry' || ev.kind === 'riposte') {
        this.fx.sparks(x, y, 26);
        this.flash = Math.max(this.flash, 0.5);
      } else if (ev.kind === 'playerHit') {
        this.fx.blood(x, y);
        this.fx.sparks(x, y, 10);
        this.flash = Math.max(this.flash, 0.25);
      } else if (ev.kind === 'enemyHitPlayer') {
        this.fx.blood(sx(view, duel.player.x), y);
      } else if (ev.kind === 'guardBreak' || ev.kind === 'blockBreak') {
        this.fx.sparks(x, y, 24);
        this.flash = Math.max(this.flash, 0.4);
      } else if (ev.kind === 'dodge') {
        this.fx.dust(sx(view, ev.x ?? duel.player.x), view.groundY);
      } else if (ev.kind === 'kill') {
        this.fx.blood(x, y, 34);
        this.flash = Math.max(this.flash, 0.7);
      }
    }
  }

  private drawFighter(view: View, duel: DuelState, hero: boolean): void {
    const state = hero ? duel.player : duel.enemy;
    const pose = hero ? computePlayerPose(duel.player, duel.tick) : computeEnemyPose(duel.enemy, duel.tick);
    if (hero && this.sleeping) {
      pose.crouch = 0.9;
      pose.lean = -0.3;
    } else if (hero && this.sitting) {
      pose.crouch = 0.7;
    }
    const visual = hero ? (this.chicken ? HERO_CHICKEN : HERO_VISUAL) : visualFor(duel.enemy.archetype);
    const s = view.knightScale * visual.scale;
    const x = sx(view, state.x);
    const facing = hero ? 1 : -1;
    const cape = hero ? this.heroCape : this.foeCape;
    cape.update(x - facing * 10 * s, view.groundY - 96 * s, -facing * (1.2 + pose.lean * 3), 12 * s);
    const feet = (hero ? this.heroLegs : this.foeLegs).update(x, 14 * s);
    const r = drawKnight(this.ctx, {
      x, groundY: view.groundY, facing, scale: s, pose, visual, cape: cape.points(), feet, chicken: hero && this.chicken,
    });
    if (hero && r.active) {
      this.trail.unshift([r.tipX, r.tipY]);
      this.trail = this.trail.slice(0, 9);
    } else if (this.trail.length > 0) {
      this.trail.pop();
    }
  }

  private drawTrail(): void {
    if (this.trail.length < 2) {
      return;
    }
    this.ctx.lineCap = 'round';
    for (let i = 1; i < this.trail.length; i += 1) {
      const a = this.trail[i - 1] as [number, number];
      const b = this.trail[i] as [number, number];
      this.ctx.globalAlpha = (1 - i / this.trail.length) * 0.4;
      this.ctx.strokeStyle = PALETTE.warmRim;
      this.ctx.lineWidth = (this.trail.length - i) * 2.4;
      this.ctx.beginPath();
      this.ctx.moveTo(a[0], a[1]);
      this.ctx.lineTo(b[0], b[1]);
      this.ctx.stroke();
    }
    const lead0 = this.trail[0] as [number, number];
    const lead1 = this.trail[1] as [number, number];
    this.ctx.globalAlpha = 0.95;
    this.ctx.strokeStyle = PALETTE.tellWhite;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(lead0[0], lead0[1]);
    this.ctx.lineTo(lead1[0], lead1[1]);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  private drawProjectiles(view: View, duel: DuelState): void {
    this.ctx.fillStyle = PALETTE.tellRed;
    for (const p of duel.projectiles) {
      const px = sx(view, p.x);
      this.ctx.fillRect(px - 7, view.groundY - view.h * 0.14, 14, 3);
    }
  }

  render(rv: RenderView): void {
    const duel = rv.duel;
    const shake = duel.shake;
    const view = makeView(this.w, this.h, (Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake);
    this.chicken = rv.cosmetics.chicken;
    this.sitting = rv.cosmetics.sitting;
    this.sleeping = rv.cosmetics.sleeping;
    this.ember += 1;
    if (this.ember % 5 === 0) {
      this.fx.ember(Math.random() * this.w, view.groundY - Math.random() * this.h * 0.32);
    }
    this.reactToEvents(view, duel, duel.events);
    this.fx.update(view.groundY);
    drawBackground(this.ctx, view, rv.cosmetics, duel.tick);
    this.fx.drawDecals(this.ctx);
    this.drawFighter(view, duel, false);
    this.drawFighter(view, duel, true);
    this.drawTrail();
    this.drawProjectiles(view, duel);
    this.fx.draw(this.ctx);
    drawForeground(this.ctx, view, duel.tick);
    this.drawFlash(view);
    drawHud(this.ctx, view, duel);
    this.drawBanner(view, rv.banner);
    applyPost(this.ctx, view, rv.cosmetics.crt);
  }

  private drawFlash(view: View): void {
    if (this.flash <= 0.01) {
      this.flash = 0;
      return;
    }
    this.ctx.globalAlpha = this.flash;
    this.ctx.fillStyle = PALETTE.tellWhite;
    this.ctx.fillRect(0, 0, view.w, view.h);
    this.ctx.globalAlpha = 1;
    this.flash *= 0.6;
  }

  private drawBanner(view: View, banner: string | null): void {
    if (banner === null) {
      return;
    }
    this.ctx.font = `bold 24px ${FONT}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = PALETTE.gold;
    this.ctx.fillText(banner, view.w / 2, view.h * 0.36);
  }
}
