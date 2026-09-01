import { describe, it, expect } from 'vitest';
import { GestureRecognizer } from '../src/input/recognizer.ts';
import type { Gesture, PointerSample } from '../src/input/gesture.ts';

const rec = (): GestureRecognizer => new GestureRecognizer();
const s = (id: number, x: number, y: number, t: number): PointerSample => ({ id, x, y, t });

describe('gesture recognizer', () => {
  it('recognizes a tap', () => {
    const r = rec();
    r.down(s(1, 100, 700, 0));
    expect(r.up(s(1, 103, 701, 50))).toEqual<Gesture[]>([{ kind: 'tap', x: 103 }]);
  });

  it('tolerates fat-finger jitter as a tap', () => {
    const r = rec();
    r.down(s(1, 100, 700, 0));
    r.move(s(1, 108, 706, 20));
    expect(r.up(s(1, 114, 704, 60))).toEqual<Gesture[]>([{ kind: 'tap', x: 114 }]);
  });

  it('recognizes a hold as charge start/end', () => {
    const r = rec();
    r.down(s(1, 100, 700, 0));
    expect(r.poll(250)).toEqual<Gesture[]>([{ kind: 'holdStart' }]);
    expect(r.up(s(1, 100, 700, 320))).toEqual<Gesture[]>([{ kind: 'holdEnd' }]);
  });

  it('recognizes 8-way swipes including diagonals', () => {
    const up = rec();
    up.down(s(1, 100, 700, 0));
    expect(up.up(s(1, 100, 600, 40))).toEqual<Gesture[]>([{ kind: 'swipe', dir: 'up' }]);
    const right = rec();
    right.down(s(1, 100, 700, 0));
    expect(right.up(s(1, 190, 700, 40))).toEqual<Gesture[]>([{ kind: 'swipe', dir: 'right' }]);
    const diag = rec();
    diag.down(s(1, 100, 700, 0));
    expect(diag.up(s(1, 160, 640, 40))).toEqual<Gesture[]>([{ kind: 'swipe', dir: 'upRight' }]);
  });

  it('recognizes a double tap', () => {
    const r = rec();
    r.down(s(1, 100, 700, 0));
    r.up(s(1, 100, 700, 30));
    r.down(s(1, 100, 700, 100));
    expect(r.up(s(1, 100, 700, 130))).toEqual<Gesture[]>([{ kind: 'doubleTap' }]);
  });

  it('recognizes a two-finger tap and swallows the second lift', () => {
    const r = rec();
    r.down(s(1, 100, 700, 0));
    r.down(s(2, 150, 700, 10));
    expect(r.up(s(1, 100, 700, 40))).toEqual<Gesture[]>([{ kind: 'twoFingerTap' }]);
    expect(r.up(s(2, 150, 700, 45))).toEqual<Gesture[]>([]);
  });

  it('recognizes a two-finger hold as block start/end', () => {
    const r = rec();
    r.down(s(1, 100, 700, 0));
    r.down(s(2, 150, 700, 5));
    expect(r.poll(300)).toEqual<Gesture[]>([{ kind: 'blockStart' }]);
    expect(r.up(s(1, 100, 700, 320))).toEqual<Gesture[]>([{ kind: 'blockEnd' }]);
  });

  it('recognizes a pinch', () => {
    const r = rec();
    r.down(s(1, 100, 700, 0));
    r.down(s(2, 220, 700, 5));
    expect(r.move(s(2, 130, 700, 30))).toEqual<Gesture[]>([{ kind: 'pinch' }]);
  });

  it('distinguishes a circle from a swipe', () => {
    const r = rec();
    const cx = 150;
    const cy = 650;
    const radius = 45;
    r.down(s(1, cx + radius, cy, 0));
    for (let i = 1; i <= 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      r.move(s(1, cx + radius * Math.cos(a), cy + radius * Math.sin(a), i * 5));
    }
    expect(r.up(s(1, cx + radius, cy, 70))).toEqual<Gesture[]>([{ kind: 'circle' }]);
  });
});
