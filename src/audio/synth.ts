// Synthesis primitives: enveloped oscillators and filtered noise bursts. Every
// sound in the game is built from these - there are zero audio asset files.

export interface Voice {
  readonly ctx: AudioContext;
  readonly out: GainNode;
  readonly t: number;
}

export interface ToneOptions {
  freq: number;
  dur: number;
  type: OscillatorType;
  gain: number;
  attack?: number;
  sweepTo?: number;
}

const FLOOR = 0.0001;

export const tone = (v: Voice, o: ToneOptions): void => {
  const osc = v.ctx.createOscillator();
  const g = v.ctx.createGain();
  const attack = o.attack ?? 0.005;
  osc.type = o.type;
  osc.frequency.setValueAtTime(o.freq, v.t);
  if (o.sweepTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(FLOOR, o.sweepTo), v.t + o.dur);
  }
  g.gain.setValueAtTime(FLOOR, v.t);
  g.gain.exponentialRampToValueAtTime(Math.max(FLOOR, o.gain), v.t + attack);
  g.gain.exponentialRampToValueAtTime(FLOOR, v.t + o.dur);
  osc.connect(g).connect(v.out);
  osc.start(v.t);
  osc.stop(v.t + o.dur + 0.02);
};

const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();

const whiteNoise = (ctx: AudioContext): AudioBuffer => {
  const cached = noiseBuffers.get(ctx);
  if (cached !== undefined) {
    return cached;
  }
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffers.set(ctx, buffer);
  return buffer;
};

export interface NoiseOptions {
  dur: number;
  gain: number;
  type: BiquadFilterType;
  freq: number;
  q?: number;
}

export const noise = (v: Voice, o: NoiseOptions): void => {
  const src = v.ctx.createBufferSource();
  const filter = v.ctx.createBiquadFilter();
  const g = v.ctx.createGain();
  src.buffer = whiteNoise(v.ctx);
  filter.type = o.type;
  filter.frequency.setValueAtTime(o.freq, v.t);
  filter.Q.value = o.q ?? 1;
  g.gain.setValueAtTime(Math.max(FLOOR, o.gain), v.t);
  g.gain.exponentialRampToValueAtTime(FLOOR, v.t + o.dur);
  src.connect(filter).connect(g).connect(v.out);
  src.start(v.t);
  src.stop(v.t + o.dur + 0.02);
};
