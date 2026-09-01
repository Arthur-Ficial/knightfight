import { GESTURE } from '../config/index.ts';
import type { GestureUnlock } from '../config/meta.ts';
import type { Direction, Intent, Side } from '../core/types.ts';
import type { Gesture } from './gesture.ts';

// The last stage of input: a recognized Gesture becomes a sim Intent, gated by
// which gestures the player has unlocked. Returns null for a no-op.

const sideForX = (x: number, width: number): Side => {
  const zone = (width * GESTURE.centerZone) / 2;
  if (x < width / 2 - zone) {
    return 'left';
  }
  if (x > width / 2 + zone) {
    return 'right';
  }
  return 'center';
};

const swipeIntent = (dir: Direction): Intent => {
  switch (dir) {
    case 'up':
      return { kind: 'overhead' };
    case 'down':
      return { kind: 'sweep' };
    case 'left':
      return { kind: 'dodge', dir: 'left' };
    case 'right':
      return { kind: 'dodge', dir: 'right' };
    default:
      return { kind: 'slash', dir };
  }
};

export const gestureToIntent = (
  g: Gesture,
  width: number,
  unlocked: ReadonlySet<GestureUnlock>,
): Intent | null => {
  switch (g.kind) {
    case 'tap':
      return { kind: 'light', side: sideForX(g.x, width) };
    case 'doubleTap':
      return { kind: 'feint' };
    case 'holdStart':
      return { kind: 'chargeStart' };
    case 'holdEnd':
      return { kind: 'chargeRelease' };
    case 'swipe':
      return swipeIntent(g.dir);
    case 'blockStart':
      return { kind: 'blockStart' };
    case 'blockEnd':
      return { kind: 'blockEnd' };
    case 'twoFingerTap':
      return unlocked.has('parry') ? { kind: 'parry' } : null;
    case 'circle':
      return unlocked.has('whirlwind') ? { kind: 'whirlwind' } : null;
    case 'pinch':
      return unlocked.has('focus') ? { kind: 'focus' } : null;
  }
};
