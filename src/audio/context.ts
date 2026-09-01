// WebAudio lifecycle. The context must be created/resumed from a user gesture
// (iOS policy) - we unlock on first touch. One master gain gates mute.

const MASTER_GAIN = 0.55;

type Ctor = typeof AudioContext;

const resolveCtor = (): Ctor | undefined =>
  globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted: boolean;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  unlock(): void {
    if (this.ctx === null) {
      const Ctor = resolveCtor();
      if (Ctor === undefined) {
        return;
      }
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER_GAIN;
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
  }

  get context(): AudioContext | null {
    return this.ctx;
  }

  get output(): GainNode | null {
    return this.master;
  }

  now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master !== null) {
      this.master.gain.value = muted ? 0 : MASTER_GAIN;
    }
  }

  get isMuted(): boolean {
    return this.muted;
  }
}
