// Wordless first-run tutorial: a ghost hand shows the gesture the player needs
// right now (tap to strike, then swipe to dodge) and vanishes once they do it.
// Pointer-events: none, so it never intercepts a real gesture.

type Stage = 'tap' | 'dodge' | 'done';

export class Tutorial {
  private el: HTMLElement | null = null;
  private stage: Stage = 'done';

  start(): void {
    this.stage = 'tap';
    this.show('✛');
  }

  /** Returns true when the tutorial has just been fully completed. */
  onIntent(kind: string): boolean {
    if (this.stage === 'tap' && kind === 'strike') {
      this.stage = 'dodge';
      this.hide();
      return false;
    }
    if (this.stage === 'dodge' && kind === 'dodge') {
      this.stage = 'done';
      this.hide();
      return true;
    }
    return false;
  }

  onTelegraph(): void {
    if (this.stage === 'dodge' && this.el === null) {
      this.show('⇦');
    }
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
