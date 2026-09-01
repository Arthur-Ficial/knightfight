import { PALETTE } from '../../config/index.ts';
import { dpr } from '../../platform/viewport.ts';
import type { DuelState, SimEvent } from '../../sim/state.ts';
import type { Renderer, RenderView, Cosmetics } from '../renderer.ts';
import { makeView, sx, type View } from './view.ts';
import { drawBackground } from './background.ts';
import { drawHud } from './hud.ts';
import { applyPost } from './post.ts';
import { FxSystem } from './fx.ts';
import { Cape } from './cape.ts';
import { computePlayerPose, computeEnemyPose } from './pose.ts';
import { drawKnight, type KnightStyle } from './skeleton.ts';

const HERO: KnightStyle = { body: PALETTE.hero1, rim: PALETTE.heroRim, steel: PALETTE.heroSteel };
const FOE: KnightStyle = { body: PALETTE.foe1, rim: PALETTE.foeRim, steel: PALETTE.foeSteel };
const FONT = 'ui-monospace, "SF Mono", Menlo, monospace';

export class Canvas2DRenderer implements Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private readonly fx = new FxSystem();
  private readonly heroCape = new Cape();
  private readonly foeCape = new Cape();
  private trail: [number, number][] = [];
  private ember = 0;

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
      const y = view.groundY - view.h * 0.12;
      if (ev.kind === 'parry' || ev.kind === 'riposte') {
        this.fx.sparks(x, y, 16);
      } else if (ev.kind === 'playerHit' || ev.kind === 'enemyHitPlayer') {
        this.fx.blood(x, y);
        this.fx.sparks(x, y, 6);
      } else if (ev.kind === 'guardBreak' || ev.kind === 'blockBreak') {
        this.fx.sparks(x, y, 20);
      } else if (ev.kind === 'dodge') {
        this.fx.dust(sx(view, (ev.x ?? duel.player.x)), view.groundY);
      } else if (ev.kind === 'kill') {
        this.fx.blood(x, y, 26);
      }
    }
  }

  private drawFighter(view: View, duel: DuelState, hero: boolean): void {
    const s = view.knightScale;
    const state = hero ? duel.player : duel.enemy;
    const pose = hero ? computePlayerPose(duel.player, duel.tick) : computeEnemyPose(duel.enemy, duel.tick);
    if (hero && this.sleeping) {
      pose.crouch = 0.9;
      pose.lean = -0.3;
    } else if (hero && this.sitting) {
      pose.crouch = 0.7;
    }
    const facing = hero ? 1 : -1;
    const x = sx(view, state.x);
    const cape = hero ? this.heroCape : this.foeCape;
    cape.update(x - facing * 8 * s, view.groundY - 95 * s, -facing * (1 + pose.lean * 2), 11 * s);
    const tip = drawKnight(this.ctx, {
      x, groundY: view.groundY, facing, scale: s, pose,
      style: hero ? HERO : FOE, cape: cape.points(), chicken: hero ? this.chicken : false,
    });
    if (hero && pose.active) {
      this.trail.unshift([tip.tipX, tip.tipY]);
      this.trail = this.trail.slice(0, 8);
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
      this.ctx.globalAlpha = (1 - i / this.trail.length) * 0.5;
      this.ctx.strokeStyle = PALETTE.heroRim;
      this.ctx.lineWidth = (this.trail.length - i) * 1.4;
      this.ctx.beginPath();
      this.ctx.moveTo(a[0], a[1]);
      this.ctx.lineTo(b[0], b[1]);
      this.ctx.stroke();
    }
    this.ctx.globalAlpha = 1;
  }

  private drawProjectiles(view: View, duel: DuelState): void {
    this.ctx.fillStyle = PALETTE.tellRed;
    for (const p of duel.projectiles) {
      const px = sx(view, p.x);
      this.ctx.fillRect(px - 6, view.groundY - view.h * 0.12, 12, 3);
    }
  }

  private chicken = false;
  private sitting = false;
  private sleeping = false;

  render(rv: RenderView): void {
    const duel = rv.duel;
    const shake = duel.shake;
    const sxOff = (Math.random() * 2 - 1) * shake;
    const syOff = (Math.random() * 2 - 1) * shake;
    const view = makeView(this.w, this.h, sxOff, syOff);
    this.chicken = rv.cosmetics.chicken;
    this.sitting = rv.cosmetics.sitting;
    this.sleeping = rv.cosmetics.sleeping;
    this.ember += 1;
    if (this.ember % 6 === 0) {
      this.fx.ember(Math.random() * this.w, view.groundY - Math.random() * this.h * 0.3);
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
    drawHud(this.ctx, view, duel);
    this.drawBanner(view, rv.cosmetics, rv.banner);
    applyPost(this.ctx, view, rv.cosmetics.crt);
  }

  private drawBanner(view: View, _cos: Cosmetics, banner: string | null): void {
    if (banner === null) {
      return;
    }
    this.ctx.font = `bold 24px ${FONT}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = PALETTE.gold;
    this.ctx.fillText(banner, view.w / 2, view.h * 0.36);
  }
}
