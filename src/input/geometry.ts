import type { Direction } from '../core/types.ts';

// Pure geometry for the recognizer: 8-way swipe classification and total path
// turning (used to tell a circle from a swipe).

const OCTANTS: readonly Direction[] = [
  'right', 'upRight', 'up', 'upLeft', 'left', 'downLeft', 'down', 'downRight',
];

/** Classify a displacement into one of 8 directions. Screen y grows downward. */
export const swipeDirection = (dx: number, dy: number): Direction => {
  // Flip dy so "up" is positive, measure degrees in [0, 360).
  let deg = (Math.atan2(-dy, dx) * 180) / Math.PI;
  if (deg < 0) {
    deg += 360;
  }
  const index = Math.round(deg / 45) % 8;
  return OCTANTS[index] ?? 'right';
};

export const isDiagonal = (dir: Direction): boolean =>
  dir === 'upLeft' || dir === 'upRight' || dir === 'downLeft' || dir === 'downRight';

/** Sum of absolute heading changes along a path (radians). */
export const pathTurning = (points: readonly (readonly [number, number])[]): number => {
  let total = 0;
  let prevAngle = 0;
  let has = false;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1] as readonly [number, number];
    const b = points[i] as readonly [number, number];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    if (dx === 0 && dy === 0) {
      continue;
    }
    const angle = Math.atan2(dy, dx);
    if (has) {
      let d = angle - prevAngle;
      while (d > Math.PI) {
        d -= 2 * Math.PI;
      }
      while (d < -Math.PI) {
        d += 2 * Math.PI;
      }
      total += Math.abs(d);
    }
    prevAngle = angle;
    has = true;
  }
  return total;
};

export const gap = (ax: number, ay: number, bx: number, by: number): number =>
  Math.hypot(bx - ax, by - ay);
