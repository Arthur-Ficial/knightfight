import { TICK_MS } from '../core/loop.ts';
import type { Dir4 } from '../core/types.ts';

// Every timing in the game lives here, authored in milliseconds for human
// readability and converted to exact 60Hz ticks. Nothing else may hardcode a
// frame count. This is the timing SSOT.

export const msToTicks = (ms: number): number => Math.max(1, Math.round(ms / TICK_MS));

/** windup = telegraph, active = hit frames, recovery = punishable frames. */
export interface ActionTiming {
  readonly windup: number;
  readonly active: number;
  readonly recovery: number;
}

const action = (windupMs: number, activeMs: number, recoveryMs: number): ActionTiming => ({
  windup: msToTicks(windupMs),
  active: msToTicks(activeMs),
  recovery: msToTicks(recoveryMs),
});

// Directional strikes (tap zones). Each direction has its own feel: high/low
// cuts are slower with more reach; side cuts are fast jabs.
export const STRIKE_TIMING: Record<Dir4, ActionTiming> = {
  up: action(120, 55, 190),
  down: action(110, 55, 200),
  left: action(70, 50, 140),
  right: action(70, 50, 140),
};

export const PLAYER_TIMING = {
  feint: action(50, 33, 166),
  heavy: action(60, 83, 320),
  whirlwind: action(100, 166, 400),
} as const;

export type PlayerActionName = keyof typeof PLAYER_TIMING;

export const DODGE = {
  iframes: msToTicks(120),
  recovery: msToTicks(100),
} as const;

export const PARRY = {
  /** Perfect window: two-finger tap must overlap the enemy's active frame. */
  window: msToTicks(160),
  recovery: msToTicks(120),
} as const;

/** Riposte must land inside this window after a successful parry/stagger. */
export const RIPOSTE_WINDOW = msToTicks(700);

/** Charge tier thresholds (hold duration -> tier 0..3). */
export const CHARGE_TIER_MS = [0, 250, 550, 900] as const;
export const CHARGE_MAX_MS = 900;

/** Combo inputs must arrive within this window of each other to chain. */
export const RHYTHM_WINDOW = msToTicks(450);

/** Hit-stop freeze (in ticks) by impact weight. */
export const HITSTOP = {
  light: 3,
  medium: 5,
  heavy: 8,
  parry: 9,
  kill: 9,
} as const;

/** Slow-mo durations (ticks) and factor. */
export const SLOWMO = {
  killTicks: msToTicks(650),
  parryTicks: msToTicks(280),
  focusTicks: msToTicks(1600),
  factor: 0.35,
} as const;

/** Double-tap detection window for the feint gesture (input layer). */
export const DOUBLE_TAP_MS = 260;

/** Idle easter-egg thresholds on the title screen. */
export const IDLE_SIT_MS = 60_000;
export const IDLE_SLEEP_MS = 180_000;
