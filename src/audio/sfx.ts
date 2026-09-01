import type { AudioEngine } from './context.ts';
import { tone, noise, type Voice } from './synth.ts';

// Concrete synthesised sound effects. Each is a short recipe over the synth
// primitives, scheduled on the audio clock. No samples, all code.

const voice = (e: AudioEngine): Voice | null => {
  const ctx = e.context;
  const out = e.output;
  return ctx !== null && out !== null ? { ctx, out, t: ctx.currentTime } : null;
};

export const swordClang = (e: AudioEngine): void => {
  const v = voice(e);
  if (v === null) {
    return;
  }
  noise(v, { dur: 0.11, gain: 0.45, type: 'bandpass', freq: 3200, q: 7 });
  tone(v, { freq: 1500, dur: 0.13, type: 'triangle', gain: 0.22, sweepTo: 620 });
};

export const parryRing = (e: AudioEngine): void => {
  const v = voice(e);
  if (v === null) {
    return;
  }
  tone(v, { freq: 2100, dur: 0.5, type: 'triangle', gain: 0.28, sweepTo: 2600, attack: 0.002 });
  tone(v, { freq: 3150, dur: 0.42, type: 'sine', gain: 0.16 });
  noise(v, { dur: 0.09, gain: 0.3, type: 'highpass', freq: 5000 });
};

export const hitThud = (e: AudioEngine, heavy: boolean): void => {
  const v = voice(e);
  if (v === null) {
    return;
  }
  tone(v, { freq: heavy ? 150 : 220, dur: heavy ? 0.22 : 0.14, type: 'sine', gain: heavy ? 0.5 : 0.32, sweepTo: heavy ? 60 : 110 });
  noise(v, { dur: 0.08, gain: heavy ? 0.4 : 0.24, type: 'lowpass', freq: heavy ? 900 : 1500 });
};

export const whoosh = (e: AudioEngine): void => {
  const v = voice(e);
  if (v === null) {
    return;
  }
  noise(v, { dur: 0.18, gain: 0.16, type: 'bandpass', freq: 900, q: 1.2 });
};

export const grunt = (e: AudioEngine): void => {
  const v = voice(e);
  if (v === null) {
    return;
  }
  tone(v, { freq: 180, dur: 0.16, type: 'sawtooth', gain: 0.18, sweepTo: 90 });
};

export const guardBreakCrack = (e: AudioEngine): void => {
  const v = voice(e);
  if (v === null) {
    return;
  }
  noise(v, { dur: 0.2, gain: 0.5, type: 'highpass', freq: 2600 });
  tone(v, { freq: 520, dur: 0.24, type: 'square', gain: 0.2, sweepTo: 140 });
};

export const killBoom = (e: AudioEngine): void => {
  const v = voice(e);
  if (v === null) {
    return;
  }
  tone(v, { freq: 120, dur: 0.6, type: 'sine', gain: 0.6, sweepTo: 40 });
  noise(v, { dur: 0.4, gain: 0.4, type: 'lowpass', freq: 700 });
};

export const chargeHum = (e: AudioEngine, tier: number): void => {
  const v = voice(e);
  if (v === null) {
    return;
  }
  tone(v, { freq: 140 + tier * 90, dur: 0.18, type: 'sawtooth', gain: 0.12, sweepTo: 240 + tier * 140 });
};

export const uiClick = (e: AudioEngine): void => {
  const v = voice(e);
  if (v === null) {
    return;
  }
  tone(v, { freq: 880, dur: 0.06, type: 'square', gain: 0.14, sweepTo: 1200 });
};

export const comboChime = (e: AudioEngine, mult: number): void => {
  const v = voice(e);
  if (v === null) {
    return;
  }
  tone(v, { freq: 700 * mult, dur: 0.18, type: 'triangle', gain: 0.2, sweepTo: 1200 * mult });
};
