import type { Dir4 } from '../core/types.ts';

// Wordless first-run tutorial: a ghost hand shows the gesture the player needs
// right now (tap to strike, then dodge the MATCHING direction of the incoming
// attack) and vanishes once they do it. Pointer-events: none.

type Stage = 'tap' | 'dodge' | 'done';

const DIR_GLYPH: Record<Dir4, string> = { up: '⇧', down: '⇩', left: '⇦', right: '⇨' };

export class Tutorial {
  private el: HTMLElement | null = null;
  private stage: Stage = 'done';
  private expected: Dir4 | null = null;

  start(): void {
    this.stage = 'tap';
    this.expected = null;
    this.show('✛');
  }

  /** Returns true when the tutorial has just been fully completed. */
  onIntent(kind: string, dir: Dir4 | null): boolean {
    if (this.stage === 'tap' && kind === 'strike') {
      this.stage = 'dodge';
      this.hide();
      return false;
    }
    if (this.stage === 'dodge' && kind === 'dodge' && dir === this.expected) {
      this.stage = 'done';
      this.hide();
      return true;
    }
    return false;
  }

  /** Show the dodge hint pointing the SAME way the incoming attack does. */
  onTelegraph(dir: Dir4): void {
    if (this.stage !== 'dodge') {
      return;
    }
    this.expected = dir;
    this.show(DIR_GLYPH[dir]);
  }

  get active(): boolean {
    return this.stage !== 'done';
  }

  stop(): void {
    this.stage = 'done';
    this.hide();
  }

  private show(glyph: string): void {
    if (this.el === null) {
      this.el = document.createElement('div');
      this.el.id = 'kf-tutor';
      document.body.appendChild(this.el);
    }
    const g = document.createElement('div');
    g.className = 'kf-tutor-glyph';
    g.textContent = glyph;
    const dot = document.createElement('div');
    dot.className = 'kf-ghost-dot';
    this.el.replaceChildren(g, dot);
  }

  private hide(): void {
    if (this.el !== null) {
      this.el.remove();
      this.el = null;
    }
  }
}
