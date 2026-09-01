import { GestureRecognizer, type Gesture, type PointerSample } from '../input/index.ts';

// Pumps DOM PointerEvents through the recognizer and hands finished gestures to
// the game. Also polls for time-based gestures (hold -> charge). The sim never
// sees a PointerEvent - only gestures, then intents.

const sample = (e: PointerEvent): PointerSample => ({
  id: e.pointerId,
  x: e.clientX,
  y: e.clientY,
  t: e.timeStamp,
});

export class InputPump {
  private readonly rec = new GestureRecognizer();

  constructor(
    private readonly target: HTMLElement,
    private readonly onGesture: (g: Gesture) => void,
  ) {}

  attach(): void {
    this.bind('pointerdown', (s) => this.rec.down(s));
    this.bind('pointermove', (s) => this.rec.move(s));
    this.bind('pointerup', (s) => this.rec.up(s));
    this.bind('pointercancel', (s) => this.rec.up(s));
  }

  private bind(type: string, fn: (s: PointerSample) => Gesture[]): void {
    this.target.addEventListener(
      type,
      (raw: Event) => {
        if (!(raw instanceof PointerEvent)) {
          return;
        }
        raw.preventDefault();
        for (const g of fn(sample(raw))) {
          this.onGesture(g);
        }
      },
      { passive: false },
    );
  }

  poll(): void {
    for (const g of this.rec.poll(performance.now())) {
      this.onGesture(g);
    }
  }
}
