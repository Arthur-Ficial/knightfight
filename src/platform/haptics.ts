// Haptics seam. navigator.vibrate today, Capacitor Haptics later. Silent no-op
// where unsupported (desktop, iOS Safari). Never throws.

type Pattern = 'light' | 'medium' | 'heavy' | 'parry';

const PATTERNS: Record<Pattern, number | readonly number[]> = {
  light: 8,
  medium: 16,
  heavy: 30,
  parry: [10, 20, 12],
};

interface Vibrator {
  vibrate?: (pattern: number | number[]) => boolean;
}

export const vibrate = (pattern: Pattern): void => {
  const nav = globalThis.navigator as Vibrator | undefined;
  if (nav?.vibrate === undefined) {
    return;
  }
  try {
    const value = PATTERNS[pattern];
    nav.vibrate(Array.isArray(value) ? [...value] : (value as number));
  } catch {
    // ignore - haptics are a nicety, never a failure point.
  }
};
