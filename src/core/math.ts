// Small pure numeric helpers used across sim and render.

export const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

export const clamp01 = (value: number): number => clamp(value, 0, 1);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const inverseLerp = (a: number, b: number, value: number): number =>
  a === b ? 0 : clamp01((value - a) / (b - a));

/** Move `current` toward `target` by at most `maxDelta`. */
export const approach = (current: number, target: number, maxDelta: number): number => {
  if (current < target) {
    return Math.min(current + maxDelta, target);
  }
  return Math.max(current - maxDelta, target);
};

export const sign = (value: number): number => (value < 0 ? -1 : value > 0 ? 1 : 0);

export const distance = (ax: number, ay: number, bx: number, by: number): number =>
  Math.hypot(bx - ax, by - ay);

/** Smooth ease used for telegraph rings and juice curves. */
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);

export const easeInCubic = (t: number): number => Math.pow(clamp01(t), 3);
