import type { MetaState } from '../sim/meta.ts';
import type { DuelState } from '../sim/state.ts';
import type { Gesture } from '../input/index.ts';
import { CHICKEN_CODE, CodeDetector, gestureSignature, MOON_TAPS_FOR_BLOOD } from './easter-eggs.ts';

// Title-screen egg detection (chicken code, moon taps) and the death-screen
// heart-revive, kept out of the game shell to keep it lean.

export class EggTracker {
  private readonly code = new CodeDetector(CHICKEN_CODE);
  private moonTaps = 0;

  titleGesture(g: Gesture, meta: MetaState, isMoon: (x: number) => boolean): string | null {
    let message: string | null = null;
    if (this.code.feed(gestureSignature(g)) && !meta.chickenKnight) {
      meta.chickenKnight = true;
      message = 'CHICKEN KNIGHT UNLOCKED';
    }
    if (g.kind === 'tap' && isMoon(g.x)) {
      this.moonTaps += 1;
      if (this.moonTaps >= MOON_TAPS_FOR_BLOOD && !meta.bloodMoon) {
        meta.bloodMoon = true;
        message = 'BLOOD MOON RISES';
      }
    }
    return message;
  }

  bankRevive(meta: MetaState, today: number): string {
    if (meta.reviveBankedDay === today) {
      return 'a revive is already banked today';
    }
    meta.reviveBankedDay = today;
    meta.pendingRevive = true;
    return 'REVIVE BANKED — return stronger';
  }
}

export const devLines = (duel: DuelState, mode: string): string[] => {
  const p = duel.player;
  const e = duel.enemy;
  return [
    `tick ${duel.tick}  rung ${duel.rung}  mode ${mode}`,
    `player hp ${p.hp.toFixed(1)} stam ${p.stamina.toFixed(1)} rage ${p.rage.toFixed(1)}`,
    `enemy ${e.name} hp ${e.hp.toFixed(1)} guard ${e.guard.toFixed(1)} phase ${e.phase}`,
    'sim log: window.__KF_LOG.tail(20)',
  ];
};
