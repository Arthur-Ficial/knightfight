import type { GestureUnlock } from '../config/meta.ts';
import type { Dir4, Direction, Intent } from '../core/types.ts';
import type { Gesture } from './gesture.ts';

// The last stage of input: a recognized Gesture becomes a sim Intent. Taps are
// directional (the screen quadrant you tap = the strike direction); swipes are
// directional dodges. This is the whole read of the fight.

/** Which quadrant of the screen a tap fell in, by dominant axis from centre. */
export const tapZone = (x: number, y: number, w: number, h: number): Dir4 => {
  const dx = x - w / 2;
  const dy = y - h / 2;
  if (Math.abs(dy) >= Math.abs(dx)) {
    return dy < 0 ? 'up' : 'down';
  }
  return dx < 0 ? 'left' : 'right';
};

/** Collapse an 8-way swipe to the nearest cardinal for a directional dodge. */
export const cardinal = (dir: Direction): Dir4 => {
  if (dir === 'up' || dir === 'down' || dir === 'left' || dir === 'right') {
    return dir;
  }
  return dir === 'upLeft' || dir === 'upRight' ? 'up'
    : dir === 'downLeft' || dir === 'downRight' ? 'down' : 'right';
};

export const gestureToIntent = (
  g: Gesture,
  width: number,
  height: number,
  unlocked: ReadonlySet<GestureUnlock>,
): Intent | null => {
  switch (g.kind) {
    case 'tap':
      return { kind: 'strike', dir: tapZone(g.x, g.y, width, height) };
    case 'doubleTap':
      return { kind: 'feint' };
    case 'holdStart':
      return { kind: 'chargeStart' };
    case 'holdEnd':
      return { kind: 'chargeRelease' };
    case 'swipe':
      return { kind: 'dodge', dir: cardinal(g.dir) };
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
