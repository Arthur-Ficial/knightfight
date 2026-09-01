import { DOUBLE_TAP_MS } from './timings.ts';

// Gesture recognizer thresholds (CSS pixels / ms). Tuned for one-handed thumb
// play with fat fingers and noisy traces. The input SSOT.

export const GESTURE = {
  /** A tap is short and barely moves. */
  tapMaxMs: 220,
  tapMaxMove: 18,
  /** Beyond this hold time a stationary press becomes a charge. */
  holdMinMs: 200,
  /** Minimum travel to count as a swipe. */
  swipeMinDist: 42,
  doubleTapMs: DOUBLE_TAP_MS,
  doubleTapMaxDist: 60,
  /** A second pointer landing within this of the first = a multi-touch gesture. */
  multiTouchJoinMs: 140,
  twoFingerTapMaxMs: 260,
  twoFingerTapMaxMove: 26,
  /** Circle: total turning and a path that returns near its origin. */
  circleMinTurn: 4.6,
  circleMaxEndGap: 70,
  circleMinPoints: 10,
  /** Pinch: the two-finger spread must shrink by at least this. */
  pinchMinShrink: 55,
  /** Central dead-zone (fraction of width) that reads as a centre tap. */
  centerZone: 0.22,
} as const;
