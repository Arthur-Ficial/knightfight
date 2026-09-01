import type { Direction } from '../core/types.ts';

// Raw gestures produced by the recognizer, before they become sim Intents.

export interface PointerSample {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly t: number;
}

export type Gesture =
  | { readonly kind: 'tap'; readonly x: number }
  | { readonly kind: 'doubleTap' }
  | { readonly kind: 'holdStart' }
  | { readonly kind: 'holdEnd' }
  | { readonly kind: 'swipe'; readonly dir: Direction }
  | { readonly kind: 'twoFingerTap' }
  | { readonly kind: 'blockStart' }
  | { readonly kind: 'blockEnd' }
  | { readonly kind: 'circle' }
  | { readonly kind: 'pinch' };
