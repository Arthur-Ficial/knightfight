import type { AudioEngine } from './context.ts';
import { tone, noise, type Voice } from './synth.ts';
import { clamp } from '../core/math.ts';

// A dark medieval chiptune loop, scheduled on the audio clock with a lookahead
// sequencer. It intensifies with the rung: faster, louder, brighter leads.

const ROOT = 110; // A2
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const BASS = [0, 0, 5, 3, 0, 0, 7, 5];
const LEAD = [12, 15, 14, 12, 17, 15, 14, 10];

const noteFreq = (semi: number): number => ROOT * Math.pow(2, semi / 12);
const degree = (index: number): number => MINOR[((index % 7) + 7) % 7] ?? 0;

export class Music {
  private readonly engine: AudioEngine;
  private playing = false;
  private step = 0;
  private nextTime = 0;
  private intensity = 1;
  private timer: ReturnType<typeof globalThis.setTimeout> | undefined;

  constructor(engine: AudioEngine) {
    this.engine = engine;
  }

  setRung(rung: number): void {
    this.intensity = clamp(1 + rung * 0.045, 1, 2.3);
  }

  start(): void {
    if (this.playing || this.engine.context === null) {
      return;
    }
    this.playing = true;
    this.nextTime = this.engine.now() + 0.05;
    this.schedule();
  }

  stop(): void {
    this.playing = false;
    globalThis.clearTimeout(this.timer);
  }

  private stepSeconds(): number {
    return 0.26 / this.intensity;
  }

  private schedule = (): void => {
    if (!this.playing || this.engine.context === null || this.engine.output === null) {
      return;
    }
    const horizon = this.engine.now() + 0.3;
    while (this.nextTime < horizon) {
      this.emit(this.step, this.nextTime);
      this.step = (this.step + 1) % 8;
      this.nextTime += this.stepSeconds();
    }
    this.timer = globalThis.setTimeout(this.schedule, 45);
  };

  private emit(step: number, time: number): void {
    const ctx = this.engine.context;
    const out = this.engine.output;
    if (ctx === null || out === null) {
      return;
    }
    const v: Voice = { ctx, out, t: time };
    tone(v, { freq: noteFreq(degree(BASS[step] ?? 0)), dur: 0.22, type: 'sawtooth', gain: 0.1 });
    if (step % 2 === 0) {
      noise(v, { dur: 0.06, gain: 0.12, type: 'lowpass', freq: 220 });
    }
    if (this.intensity > 1.3 && step % 2 === 1) {
      noise(v, { dur: 0.03, gain: 0.05, type: 'highpass', freq: 7000 });
    }
    if (this.intensity > 1.15) {
      tone(v, {
        freq: noteFreq(degree(LEAD[step] ?? 0) + 12),
        dur: 0.16,
        type: 'square',
        gain: 0.05 * (this.intensity - 1),
      });
    }
  }
}
