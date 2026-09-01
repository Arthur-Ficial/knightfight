import { GESTURE } from '../config/index.ts';
import { swipeDirection, pathTurning, gap } from './geometry.ts';
import type { Gesture, PointerSample } from './gesture.ts';

interface Pt {
  x0: number;
  y0: number;
  t0: number;
  x: number;
  y: number;
  path: [number, number][];
  moved: boolean;
  holdFired: boolean;
}

/**
 * PointerEvent -> Gesture recognizer. Fully deterministic and testable: feed it
 * synthetic pointer samples, poll it with the clock for hold thresholds. Handles
 * tap, double-tap, hold/charge, 8-way swipe, two-finger tap/hold, pinch, circle.
 */
export class GestureRecognizer {
  private readonly pointers = new Map<number, Pt>();
  private lastTapT = -1e9;
  private lastTapX = 0;
  private multi = false;
  private multiStartT = 0;
  private multiStartSpread = 0;
  private multiMoved = false;
  private pinchFired = false;
  private blocking = false;
  private consuming = false;

  down(s: PointerSample): Gesture[] {
    this.pointers.set(s.id, {
      x0: s.x, y0: s.y, t0: s.t, x: s.x, y: s.y, path: [[s.x, s.y]], moved: false, holdFired: false,
    });
    if (this.pointers.size === 2) {
      this.multi = true;
      this.multiStartT = s.t;
      this.multiStartSpread = this.spread();
      this.multiMoved = false;
      this.pinchFired = false;
    }
    return [];
  }

  move(s: PointerSample): Gesture[] {
    const p = this.pointers.get(s.id);
    if (p === undefined) {
      return [];
    }
    p.x = s.x;
    p.y = s.y;
    p.path.push([s.x, s.y]);
    if (gap(p.x0, p.y0, s.x, s.y) > GESTURE.tapMaxMove) {
      p.moved = true;
    }
    if (this.multi && !this.pinchFired && !this.blocking) {
      if (gap(p.x0, p.y0, s.x, s.y) > GESTURE.twoFingerTapMaxMove) {
        this.multiMoved = true;
      }
      if (this.multiStartSpread - this.spread() > GESTURE.pinchMinShrink) {
        this.pinchFired = true;
        return [{ kind: 'pinch' }];
      }
    }
    return [];
  }

  poll(now: number): Gesture[] {
    const single = this.pointers.size === 1 && !this.multi ? this.firstPoint() : null;
    if (single !== null && !single.moved && !single.holdFired && now - single.t0 > GESTURE.holdMinMs) {
      single.holdFired = true;
      return [{ kind: 'holdStart' }];
    }
    if (this.multi && !this.blocking && !this.pinchFired && !this.multiMoved && this.pointers.size >= 2) {
      if (now - this.multiStartT > GESTURE.holdMinMs) {
        this.blocking = true;
        return [{ kind: 'blockStart' }];
      }
    }
    return [];
  }

  up(s: PointerSample): Gesture[] {
    const p = this.pointers.get(s.id);
    if (p === undefined) {
      return [];
    }
    this.pointers.delete(s.id);
    if (this.consuming) {
      if (this.pointers.size === 0) {
        this.reset();
      }
      return [];
    }
    return this.multi ? this.resolveMulti(s) : this.resolveSingle(s, p);
  }

  private resolveMulti(s: PointerSample): Gesture[] {
    const out: Gesture[] = [];
    if (this.blocking) {
      out.push({ kind: 'blockEnd' });
    } else if (!this.pinchFired && !this.multiMoved && s.t - this.multiStartT < GESTURE.twoFingerTapMaxMs) {
      out.push({ kind: 'twoFingerTap' });
    }
    if (this.pointers.size > 0) {
      this.consuming = true;
      this.multi = false;
      this.blocking = false;
    } else {
      this.reset();
    }
    return out;
  }

  private resolveSingle(s: PointerSample, p: Pt): Gesture[] {
    const dist = gap(p.x0, p.y0, s.x, s.y);
    if (p.holdFired) {
      return [{ kind: 'holdEnd' }];
    }
    if (p.moved || dist > GESTURE.tapMaxMove) {
      const turn = pathTurning(p.path);
      if (turn > GESTURE.circleMinTurn && dist < GESTURE.circleMaxEndGap && p.path.length >= GESTURE.circleMinPoints) {
        return [{ kind: 'circle' }];
      }
      if (dist > GESTURE.swipeMinDist) {
        return [{ kind: 'swipe', dir: swipeDirection(s.x - p.x0, s.y - p.y0) }];
      }
    }
    return this.tapOrDouble(s);
  }

  private tapOrDouble(s: PointerSample): Gesture[] {
    const isDouble =
      s.t - this.lastTapT < GESTURE.doubleTapMs && Math.abs(s.x - this.lastTapX) < GESTURE.doubleTapMaxDist;
    if (isDouble) {
      this.lastTapT = -1e9;
      return [{ kind: 'doubleTap' }];
    }
    this.lastTapT = s.t;
    this.lastTapX = s.x;
    return [{ kind: 'tap', x: s.x }];
  }

  private spread(): number {
    const pts = this.twoPoints();
    return pts === null ? 0 : gap(pts[0].x, pts[0].y, pts[1].x, pts[1].y);
  }

  private firstPoint(): Pt | null {
    for (const p of this.pointers.values()) {
      return p;
    }
    return null;
  }

  private twoPoints(): [Pt, Pt] | null {
    const it = this.pointers.values();
    const a = it.next().value;
    const b = it.next().value;
    return a === undefined || b === undefined ? null : [a, b];
  }

  private reset(): void {
    this.multi = false;
    this.blocking = false;
    this.consuming = false;
    this.pinchFired = false;
    this.multiMoved = false;
  }
}
