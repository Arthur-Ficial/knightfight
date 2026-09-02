import { PALETTE } from '../../config/index.ts';
import { dpr } from '../../platform/viewport.ts';
import type { DuelState, SimEvent } from '../../sim/state.ts';
import type { Renderer, RenderView } from '../renderer.ts';
import { makeView, type View } from './view.ts';
import { separate, mapWorldX, drawTrail, type Anchors } from './stage.ts';
import type { Dir4 } from '../../core/types.ts';
import { drawBackground, drawForeground } from './background.ts';
import { drawWorldIndicators, drawChevron } from './indicators.ts';
import { drawHud } from './hud.ts';
import { applyPost } from './post.ts';
import { FxSystem } from './fx.ts';
import { Cape } from './cape.ts';
import { Legs } from './legs.ts';
import { computePlayerPose, computeEnemyPose } from './pose.ts';
import { drawKnight } from './knight.ts';
import { visualFor, HERO_VISUAL, HERO_CHICKEN } from './style.ts';

// Real pixel art: the whole scene is drawn into a small offscreen buffer and
// integer-upscaled with smoothing OFF, so one chunky pixel size covers knights,
// background and FX. Only the HUD text is drawn crisp on top (16px legibility).

const FONT = 'ui-monospace, "SF Mono", Menlo, monospace';
const TARGET_BUFFER_W = 208;

export class Canvas2DRenderer implements Renderer {
  private readonly dctx: CanvasRenderingContext2D;
  private readonly buffer: HTMLCanvasElement;
  private readonly bctx: CanvasRenderingContext2D;
  private cssW = 0;
  private cssH = 0;
  private bw = 0;
  private bh = 0;
  private pix = 4;
  private ratio = 1;
  private readonly fx = new FxSystem();
  private readonly heroCape = new Cape();
  private readonly foeCape = new Cape();
  private readonly heroLegs = new Legs();
  private readonly foeLegs = new Legs();
  private trail: [number, number][] = [];
  private foeTrail: [number, number][] = [];
  private anchors: Anchors = { px: 0, pe: 1, pAx: 0, eAx: 1 };
  private ember = 0;
  private flash = 0;
  private floatText = '';
  private floatColor: string = PALETTE.ink;
  private floatTicks = 0;
  private hurtDir: Dir4 | null = null;
  private hurtTicks = 0;
  private chicken = false;
  private sitting = false;
  private sleeping = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      throw new Error('2d canvas context unavailable');
    }
    this.dctx = ctx;
    this.buffer = document.createElement('canvas');
    const bctx = this.buffer.getContext('2d');
    if (bctx === null) {
      throw new Error('2d buffer context unavailable');
    }
    this.bctx = bctx;
    canvas.style.imageRendering = 'pixelated';
  }

  resize(width: number, height: number): void {
    this.cssW = width;
    this.cssH = height;
    this.ratio = dpr();
    const physW = Math.round(width * this.ratio);
    const physH = Math.round(height * this.ratio);
    this.pix = Math.max(3, Math.round(physW / TARGET_BUFFER_W));
    this.bw = Math.max(1, Math.round(physW / this.pix));
    this.bh = Math.max(1, Math.round(physH / this.pix));
    this.canvas.width = physW;
    this.canvas.height = physH;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.buffer.width = this.bw;
    this.buffer.height = this.bh;
    this.bctx.imageSmoothingEnabled = false;
    this.dctx.imageSmoothingEnabled = false;
  }

  private mapX(ax: number): number {
    return mapWorldX(this.anchors, ax);
  }

  private reactToEvents(view: View, duel: DuelState, events: readonly SimEvent[]): void {
    for (const ev of events) {
      const atPlayer = ev.kind === 'enemyHitPlayer' || ev.kind === 'dodge' || ev.kind === 'busy';
      const x = atPlayer ? this.mapX(ev.x ?? duel.player.x) : this.mapX(ev.x ?? duel.enemy.x);
      const y = view.groundY - view.h * 0.14;
      if (ev.kind === 'parry' || ev.kind === 'riposte') {
        this.fx.sparks(x, y, 12);
        this.flash = Math.max(this.flash, 0.4);
      } else if (ev.kind === 'counter') {
        this.fx.sparks(x, y, 10);
        this.flash = Math.max(this.flash, 0.3);
      } else if (ev.kind === 'playerHit') {
        this.fx.blood(x, y);
        this.fx.sparks(x, y, 5);
        this.flash = Math.max(this.flash, 0.22);
      } else if (ev.kind === 'enemyHitPlayer') {
        this.fx.blood(x, y);
        if (ev.dir !== undefined) {
          this.hurtDir = ev.dir;
          this.hurtTicks = 26;
        }
      } else if (ev.kind === 'guardBreak' || ev.kind === 'blockBreak') {
        this.fx.sparks(x, y, 12);
        this.flash = Math.max(this.flash, 0.3);
        this.setFloat('BREAK!', PALETTE.tellGold);
      } else if (ev.kind === 'clang') {
        this.fx.sparks(x, y, 3);
        this.setFloat('BLOCKED', PALETTE.heroSteel);
      } else if (ev.kind === 'dodge') {
        this.fx.dust(x, view.groundY);
      } else if (ev.kind === 'busy') {
        this.fx.dust(x, view.groundY - view.h * 0.1);
      } else if (ev.kind === 'kill') {
        this.fx.blood(x, y, 18);
        this.flash = Math.max(this.flash, 0.5);
      }
    }
  }

  private drawFighter(view: View, duel: DuelState, hero: boolean): void {
    const pose = hero ? computePlayerPose(duel.player, duel.tick) : computeEnemyPose(duel.enemy, duel.tick);
    if (hero && this.sleeping) {
      pose.crouch = 0.9;
      pose.lean = -0.3;
    } else if (hero && this.sitting) {
      pose.crouch = 0.7;
    }
    const visual = hero ? (this.chicken ? HERO_CHICKEN : HERO_VISUAL) : visualFor(duel.enemy.archetype);
    const s = view.knightScale * visual.scale;
    const x = hero ? this.anchors.px : this.anchors.pe;
    const facing = hero ? 1 : -1;
    const cape = hero ? this.heroCape : this.foeCape;
    cape.update(x - facing * 4 * s, view.groundY - 96 * s, -facing * (0.6 + pose.lean * 1.6), 12 * s);
    const feet = (hero ? this.heroLegs : this.foeLegs).update(x, 12 * s);
    const r = drawKnight(this.bctx, {
      x, groundY: view.groundY, facing, scale: s, pose, visual, cape: cape.points(), feet, chicken: hero && this.chicken,
    });
    const trail = hero ? this.trail : this.foeTrail;
    if (r.active) {
      trail.unshift([r.tipX, r.tipY]);
      if (trail.length > 6) {
        trail.length = 6;
      }
    } else if (trail.length > 0) {
      trail.pop();
    }
  }

  private drawProjectiles(view: View, duel: DuelState): void {
    this.bctx.fillStyle = PALETTE.tellRed;
    for (const p of duel.projectiles) {
      const px = Math.round(this.mapX(p.x));
      this.bctx.fillRect(px - 3, Math.round(view.groundY - view.h * 0.14), 6, 2);
    }
  }

  render(rv: RenderView): void {
    const duel = rv.duel;
    const shake = Math.min(duel.shake, 9) * 0.28;
    const view = makeView(this.bw, this.bh, Math.round((Math.random() * 2 - 1) * shake), Math.round((Math.random() * 2 - 1) * shake));
    this.chicken = rv.cosmetics.chicken;
    this.sitting = rv.cosmetics.sitting;
    this.sleeping = rv.cosmetics.sleeping;
    this.ember += 1;
    if (this.ember % 14 === 0) {
      this.fx.ember(Math.random() * this.bw, view.groundY - Math.random() * this.bh * 0.3);
    }
    this.anchors = separate(view, duel.player.x, duel.enemy.x);
    this.reactToEvents(view, duel, duel.events);
    this.fx.update(view.groundY);
    this.bctx.clearRect(0, 0, this.bw, this.bh);
    drawBackground(this.bctx, view, rv.cosmetics, duel.tick);
    this.fx.drawDecals(this.bctx);
    this.drawFighter(view, duel, false);
    this.drawFighter(view, duel, true);
    drawTrail(this.bctx, this.foeTrail, false);
    drawTrail(this.bctx, this.trail, true);
    this.drawProjectiles(view, duel);
    this.fx.draw(this.bctx);
    drawWorldIndicators(this.bctx, view, duel, this.anchors.pe, this.anchors.px);
    this.drawHurtHint(view, duel);
    drawForeground(this.bctx, view, duel.tick);
    this.drawFlash();
    this.blit();
    this.dctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    const cssView = makeView(this.cssW, this.cssH, 0, 0);
    drawHud(this.dctx, cssView, duel);
    this.drawFloat(cssView);
    this.drawBanner(cssView, rv.banner);
    applyPost(this.dctx, cssView, rv.cosmetics.crt);
  }

  private drawHurtHint(view: View, duel: DuelState): void {
    if (this.hurtTicks <= 0 || this.hurtDir === null) {
      return;
    }
    this.hurtTicks -= 1;
    const px = this.mapX(duel.player.x);
    const py = view.groundY - view.h * 0.17;
    this.bctx.globalAlpha = Math.min(0.85, this.hurtTicks / 14);
    drawChevron(this.bctx, px, py, this.hurtDir, view.w * 0.032, PALETTE.tellRed);
    this.bctx.globalAlpha = 1;
  }

  private setFloat(text: string, color: string): void {
    this.floatText = text;
    this.floatColor = color;
    this.floatTicks = 34;
  }

  private drawFloat(view: View): void {
    if (this.floatTicks <= 0) {
      return;
    }
    this.floatTicks -= 1;
    this.dctx.font = `bold 20px ${FONT}`;
    this.dctx.textAlign = 'center';
    this.dctx.globalAlpha = Math.min(1, this.floatTicks / 12);
    this.dctx.fillStyle = this.floatColor;
    this.dctx.fillText(this.floatText, view.w * 0.5, view.h * 0.44);
    this.dctx.globalAlpha = 1;
  }

  private blit(): void {
    this.dctx.setTransform(1, 0, 0, 1, 0, 0);
    this.dctx.imageSmoothingEnabled = false;
    this.dctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.dctx.drawImage(this.buffer, 0, 0, this.bw, this.bh, 0, 0, this.bw * this.pix, this.bh * this.pix);
  }

  private drawFlash(): void {
    if (this.flash <= 0.02) {
      this.flash = 0;
      return;
    }
    this.bctx.globalAlpha = this.flash;
    this.bctx.fillStyle = PALETTE.tellWhite;
    this.bctx.fillRect(0, 0, this.bw, this.bh);
    this.bctx.globalAlpha = 1;
    this.flash *= 0.55;
  }

  private drawBanner(view: View, banner: string | null): void {
    if (banner === null) {
      return;
    }
    this.dctx.font = `bold 24px ${FONT}`;
    this.dctx.textAlign = 'center';
    this.dctx.fillStyle = PALETTE.gold;
    this.dctx.fillText(banner, view.w / 2, view.h * 0.32);
  }
}
