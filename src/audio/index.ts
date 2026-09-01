import { AudioEngine } from './context.ts';
import { Music } from './music.ts';
import {
  swordClang, parryRing, hitThud, whoosh, grunt, guardBreakCrack, killBoom, chargeHum, comboChime, uiClick,
} from './sfx.ts';
import type { SimEvent } from '../sim/state.ts';

// The audio facade: unlocks the context, runs the score, and turns sim events
// into synthesised sound. The rest of the app only talks to this.

export class GameAudio {
  private readonly engine: AudioEngine;
  private readonly music: Music;

  constructor(muted: boolean) {
    this.engine = new AudioEngine(muted);
    this.music = new Music(this.engine);
  }

  unlock(): void {
    this.engine.unlock();
  }

  setMuted(muted: boolean): void {
    this.engine.setMuted(muted);
  }

  get muted(): boolean {
    return this.engine.isMuted;
  }

  startMusic(): void {
    this.music.start();
  }

  stopMusic(): void {
    this.music.stop();
  }

  setRung(rung: number): void {
    this.music.setRung(rung);
  }

  click(): void {
    uiClick(this.engine);
  }

  private one(ev: SimEvent): void {
    switch (ev.kind) {
      case 'playerHit': return swordClang(this.engine);
      case 'enemyHitPlayer': hitThud(this.engine, false); return grunt(this.engine);
      case 'parry': return parryRing(this.engine);
      case 'block': return swordClang(this.engine);
      case 'blockBreak': return guardBreakCrack(this.engine);
      case 'dodge': return whoosh(this.engine);
      case 'guardBreak': return guardBreakCrack(this.engine);
      case 'riposte': parryRing(this.engine); return hitThud(this.engine, true);
      case 'comboFire': return comboChime(this.engine, ev.amount ?? 1);
      case 'chargeRelease': return chargeHum(this.engine, ev.amount ?? 0);
      case 'enemyAttack': return whoosh(this.engine);
      case 'projectile': return whoosh(this.engine);
      case 'kill': return killBoom(this.engine);
      case 'death': return killBoom(this.engine);
      case 'special': return comboChime(this.engine, 2);
      default: return;
    }
  }

  handle(events: readonly SimEvent[]): void {
    for (const ev of events) {
      this.one(ev);
    }
  }
}
