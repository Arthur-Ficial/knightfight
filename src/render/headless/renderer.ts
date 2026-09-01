import type { Renderer, RenderView } from '../renderer.ts';

// A renderer that draws nothing. Lets the sim + game loop run under tests and
// the selfplay harness with zero DOM.

export class HeadlessRenderer implements Renderer {
  resize(): void {
    // no-op
  }

  render(_view: RenderView): void {
    // no-op
  }
}
