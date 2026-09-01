import type { Gesture } from '../input/index.ts';

// Hidden inputs. The title code detector matches the Konami-style gesture
// sequence; other eggs (moon taps, parry streak, rung 33, long-press, heart)
// are detected at their call sites in the game shell. See docs/EASTER-EGGS.md.

export const CHICKEN_CODE: readonly string[] = [
  'up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'doubleTap',
];

export const gestureSignature = (g: Gesture): string => (g.kind === 'swipe' ? g.dir : g.kind);

export class CodeDetector {
  private readonly buffer: string[] = [];

  constructor(private readonly code: readonly string[]) {}

  feed(signature: string): boolean {
    this.buffer.push(signature);
    if (this.buffer.length > this.code.length) {
      this.buffer.shift();
    }
    if (this.buffer.length < this.code.length) {
      return false;
    }
    return this.code.every((step, i) => this.buffer[i] === step);
  }

  reset(): void {
    this.buffer.length = 0;
  }
}

export const MOON_TAPS_FOR_BLOOD = 10;
export const RUNG_HOODED = 33;
export const LOGO_HOLD_MS = 5000;
