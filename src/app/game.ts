import { asSeed, asBoonId, type Intent } from '../core/types.ts';
import { startLoop, TICK_MS } from '../core/loop.ts';
import { installLogBridge } from '../core/log.ts';
import { createRng } from '../core/rng.ts';
import { titleForRung, IDLE_SIT_MS, IDLE_SLEEP_MS, SLOWMO } from '../config/index.ts';
import {
  createDuel, stepDuel, createRun, runStats, runUnlocks, offerBoons, takeBoon, advanceRung,
  runValor, valorForRung, type DuelState, type RunState,
} from '../sim/index.ts';
import type { MetaState } from '../sim/meta.ts';
import { GameAudio } from '../audio/index.ts';
import { Canvas2DRenderer } from '../render/index.ts';
import type { Renderer, Cosmetics } from '../render/renderer.ts';
import { gestureToIntent, type Gesture } from '../input/index.ts';
import { lockViewport } from '../platform/index.ts';
import { feelEvents } from './feel.ts';
import { InputPump } from './input-router.ts';
import { loadMeta, saveMeta } from './persistence.ts';
import { RUNG_HOODED } from './easter-eggs.ts';
import { EggTracker, devLines } from './eggs.ts';
import { Tutorial } from './tutorial.ts';
import { Overlays } from './overlays.ts';

type Mode = 'title' | 'duel' | 'boon' | 'death' | 'menu';

const dayNumber = (): number => Math.floor(Date.now() / 86_400_000);

export class Game {
  private readonly meta: MetaState = loadMeta();
  private readonly audio = new GameAudio(this.meta.muted);
  private readonly renderer: Renderer;
  private readonly overlays: Overlays;
  private readonly pump: InputPump;
  private readonly eggs = new EggTracker();
  private readonly tutorial = new Tutorial();
  private mode: Mode = 'title';
  private run: RunState | null = null;
  private duel: DuelState;
  private intents: Intent[] = [];
  private pending: { kind: 'won' | 'lost'; ticks: number } | null = null;
  private bannerTicks = 0;
  private idleTitle = 0;
  private slowPhase = 0;
  private unlocked = false;

  constructor(canvas: HTMLCanvasElement, ui: HTMLElement) {
    this.renderer = new Canvas2DRenderer(canvas);
    this.overlays = new Overlays(ui);
    this.pump = new InputPump(canvas, (g) => this.onGesture(g));
    this.duel = this.makeTitleDuel();
    installLogBridge(globalThis as unknown as Parameters<typeof installLogBridge>[0]);
  }

  start(): void {
    lockViewport();
    this.resize();
    globalThis.addEventListener('resize', () => this.resize());
    globalThis.addEventListener('pointerdown', () => this.firstTouch(), { once: true });
    this.pump.attach();
    this.showTitle();
    startLoop(() => this.tick(), () => this.render());
  }

  private firstTouch(): void {
    this.unlocked = true;
    this.audio.unlock();
    this.audio.startMusic();
  }

  private resize(): void {
    this.renderer.resize(globalThis.innerWidth, globalThis.innerHeight);
  }

  private makeTitleDuel(): DuelState {
    const duel = createDuel(1, createRng(asSeed(7)), runStats(createRun(asSeed(1), 0), this.meta), runUnlocks(this.meta));
    duel.enemy.aggression = 0;
    return duel;
  }

  private tick(): void {
    this.pump.poll();
    if (this.bannerTicks > 0) {
      this.bannerTicks -= 1;
    }
    this.idleTitle = this.mode === 'title' ? this.idleTitle + 1 : 0;
    if (this.mode === 'title' || this.mode === 'duel') {
      this.stepWorld();
    }
    this.advancePending();
  }

  private stepWorld(): void {
    // Slow-mo: advance the sim on a fraction of frames (real-time still elapses).
    if (this.mode === 'duel' && this.duel.slowmo > 0) {
      this.slowPhase += SLOWMO.factor;
      if (this.slowPhase < 1) {
        this.duel.slowmo -= 1;
        this.duel.shake *= 0.9;
        return;
      }
      this.slowPhase -= 1;
    }
    const input = this.mode === 'duel' ? this.intents : [];
    this.intents = [];
    stepDuel(this.duel, input);
    this.audio.handle(this.duel.events);
    feelEvents(this.duel.events);
    if (this.tutorial.active && this.duel.enemy.phase === 'telegraph' && this.duel.enemy.move !== null) {
      this.tutorial.onTelegraph(this.duel.enemy.move.dir);
    }
    this.absorbEvents();
  }

  private absorbEvents(): void {
    for (const ev of this.duel.events) {
      if (ev.kind === 'comboFire' && ev.label !== undefined && !this.meta.combosFound.includes(ev.label)) {
        this.meta.combosFound.push(ev.label); saveMeta(this.meta);
      }
      if (ev.kind === 'special' && ev.label === 'metronome' && this.run !== null && !this.run.boonIds.includes(asBoonId('metronome'))) {
        this.run.boonIds.push(asBoonId('metronome')); this.flash('THE METRONOME');
      }
    }
    if (this.mode === 'duel' && this.pending === null && this.duel.outcome !== 'fighting') {
      if (this.duel.outcome === 'lost' && this.run !== null && this.run.revives > 0) {
        const p = this.duel.player;
        this.run.revives -= 1;
        this.duel.outcome = 'fighting';
        p.hp = p.stats.maxHp; p.stunTicks = 0; p.iframes = 40;
        this.flash('REVIVED');
        return;
      }
      this.pending = { kind: this.duel.outcome === 'won' ? 'won' : 'lost', ticks: 48 };
    }
  }

  private advancePending(): void {
    if (this.pending === null) {
      return;
    }
    this.pending.ticks -= 1;
    if (this.pending.ticks > 0) {
      return;
    }
    const kind = this.pending.kind;
    this.pending = null;
    if (kind === 'won') { this.onVictory(); } else { this.onDefeat(); }
  }

  private startRun(): void {
    const revives = this.meta.pendingRevive ? 1 : 0;
    this.meta.pendingRevive = false;
    saveMeta(this.meta);
    this.run = createRun(asSeed((performance.now() * 1000) >>> 0), revives);
    this.startDuel();
  }

  private startDuel(): void {
    const run = this.run;
    if (run === null) {
      return;
    }
    if (run.rung === RUNG_HOODED) {
      this.flash('A HOODED DUELIST APPEARS');
    }
    this.duel = createDuel(run.rung, run.rng, runStats(run, this.meta), runUnlocks(this.meta));
    this.audio.setRung(run.rung);
    this.mode = 'duel';
    this.overlays.hide();
    if (this.meta.bestRung === 0 && run.rung === 1) {
      this.tutorial.start();
    } else {
      this.tutorial.stop();
    }
  }

  private onVictory(): void {
    const run = this.run;
    if (run === null) {
      return;
    }
    this.tutorial.stop();
    this.mode = 'boon';
    this.overlays.show(this.overlays.boon(offerBoons(run, run.rng), (b) => {
      takeBoon(run, b); this.audio.click(); advanceRung(run); this.startDuel();
    }));
  }

  private onDefeat(): void {
    const run = this.run;
    if (run === null) {
      return;
    }
    this.tutorial.stop();
    const reached = run.rung;
    this.meta.valor += runValor(run);
    const newBest = reached > this.meta.bestRung;
    if (newBest) {
      this.meta.bestRung = reached;
    }
    saveMeta(this.meta);
    this.mode = 'death';
    const data = { rung: reached, valor: valorForRung(reached), title: titleForRung(this.meta.bestRung), newBest, canRevive: dayNumber() !== this.meta.reviveBankedDay };
    this.overlays.show(this.overlays.death(data, { onUpgrades: () => this.showMeta(), onTitle: () => this.showTitle() }));
  }

  private showTitle(): void {
    this.mode = 'title';
    this.run = null;
    this.duel = this.makeTitleDuel();
    const data = { title: titleForRung(this.meta.bestRung), bestRung: this.meta.bestRung, muted: this.audio.muted, crt: this.meta.crt };
    this.overlays.show(this.overlays.title(data, {
      onPlay: () => { this.audio.click(); this.startRun(); },
      onCodex: () => this.overlays.show(this.overlays.codex(this.meta.combosFound, () => this.showTitle())),
      onMeta: () => this.showMeta(),
      onToggleMute: () => { this.meta.muted = !this.meta.muted; this.audio.setMuted(this.meta.muted); saveMeta(this.meta); this.showTitle(); },
      onToggleCrt: () => { this.meta.crt = !this.meta.crt; saveMeta(this.meta); this.showTitle(); },
    }));
    this.bindLogo();
  }

  private showMeta(): void {
    this.mode = 'menu';
    this.overlays.show(this.overlays.meta(this.meta, (id) => {
      this.overlays.buyUpgrade(this.meta, id); this.audio.click(); saveMeta(this.meta); this.showMeta();
    }, () => this.showTitle()));
  }

  private bindLogo(): void {
    this.overlays.bindLogoHold(() =>
      this.overlays.show(this.overlays.dev(devLines(this.duel, this.mode), () => this.showTitle())));
  }

  private onGesture(g: Gesture): void {
    if (!this.unlocked) {
      this.firstTouch();
    }
    if (this.mode === 'duel') {
      const intent = gestureToIntent(g, globalThis.innerWidth, globalThis.innerHeight, this.duel.player.unlocked);
      if (intent !== null) {
        this.intents.push(intent);
        this.tutorial.onIntent(intent.kind, intent.kind === 'strike' || intent.kind === 'dodge' ? intent.dir : null);
      }
      return;
    }
    if (this.mode === 'title') {
      const msg = this.eggs.titleGesture(g, this.meta, (x) => this.overlays.hitMoon(x));
      if (msg !== null) {
        saveMeta(this.meta);
        this.flash(msg);
      }
    } else if (this.mode === 'death' && g.kind === 'circle') {
      this.flash(this.eggs.bankRevive(this.meta, dayNumber()));
      saveMeta(this.meta);
    }
  }

  private flash(text: string): void {
    this.overlays.banner = text;
    this.bannerTicks = 150;
  }

  private cosmetics(): Cosmetics {
    const m = this.meta;
    const idleMs = this.idleTitle * TICK_MS;
    const onTitle = this.mode === 'title';
    return { bloodMoon: m.bloodMoon, chicken: m.chickenKnight, crt: m.crt,
      sitting: onTitle && idleMs > IDLE_SIT_MS && idleMs <= IDLE_SLEEP_MS, sleeping: onTitle && idleMs > IDLE_SLEEP_MS };
  }

  private render(): void {
    const banner = this.bannerTicks > 0 ? this.overlays.banner : null;
    this.renderer.render({ duel: this.duel, cosmetics: this.cosmetics(), banner });
  }
}
