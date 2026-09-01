import { vibrate } from '../platform/index.ts';
import type { SimEvent } from '../sim/state.ts';

// Maps a tick's sim events to a single haptic pulse (the strongest), so every
// meaningful hit thumps the hand without spamming the vibrator.

type Pattern = 'light' | 'medium' | 'heavy' | 'parry';
const RANK: Record<Pattern, number> = { light: 1, medium: 2, heavy: 3, parry: 4 };

const patternFor = (kind: SimEvent['kind']): Pattern | null =>
  kind === 'parry' || kind === 'riposte' ? 'parry'
    : kind === 'kill' || kind === 'guardBreak' ? 'heavy'
      : kind === 'enemyHitPlayer' || kind === 'blockBreak' ? 'medium'
        : kind === 'playerHit' ? 'light' : null;

export const feelEvents = (events: readonly SimEvent[]): void => {
  let best: Pattern | null = null;
  for (const ev of events) {
    const p = patternFor(ev.kind);
    if (p !== null && (best === null || RANK[p] > RANK[best])) {
      best = p;
    }
  }
  if (best !== null) {
    vibrate(best);
  }
};
