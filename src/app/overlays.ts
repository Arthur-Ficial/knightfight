import type { BoonDef } from '../config/index.ts';
import { purchaseUpgrade, type MetaState } from '../sim/meta.ts';
import { clear } from '../ui/dom.ts';
import {
  buildTitle, buildBoonPick, buildDeath,
  type TitleData, type TitleActions, type DeathData, type DeathActions,
} from '../ui/screens.ts';
import { buildCodex, buildMeta, buildDev } from '../ui/menus.ts';
import { LOGO_HOLD_MS } from './easter-eggs.ts';

// Owns the DOM overlay container and moon hit-test. Thin adapter so the Game
// state machine never touches the DOM directly.

export class Overlays {
  banner = '';

  constructor(private readonly root: HTMLElement) {}

  show(node: HTMLElement): void {
    clear(this.root);
    this.root.appendChild(node);
  }

  hide(): void {
    clear(this.root);
  }

  title(data: TitleData, actions: TitleActions): HTMLElement {
    return buildTitle(data, actions);
  }

  boon(boons: readonly BoonDef[], onPick: (b: BoonDef) => void): HTMLElement {
    return buildBoonPick(boons, onPick);
  }

  death(data: DeathData, actions: DeathActions): HTMLElement {
    return buildDeath(data, actions);
  }

  codex(found: readonly string[], onBack: () => void): HTMLElement {
    return buildCodex(found, onBack);
  }

  meta(meta: MetaState, onBuy: (id: string) => void, onBack: () => void): HTMLElement {
    return buildMeta(meta, onBuy, onBack);
  }

  dev(lines: readonly string[], onClose: () => void): HTMLElement {
    return buildDev(lines, onClose);
  }

  buyUpgrade(meta: MetaState, id: string): void {
    purchaseUpgrade(meta, id);
  }

  hitMoon(x: number): boolean {
    return Math.abs(x - globalThis.innerWidth * 0.76) < globalThis.innerWidth * 0.13;
  }

  bindLogoHold(onHold: () => void): void {
    const logo = document.getElementById('kf-logo');
    if (logo === null) {
      return;
    }
    let timer: ReturnType<typeof globalThis.setTimeout> | undefined;
    logo.addEventListener('pointerdown', () => {
      timer = globalThis.setTimeout(onHold, LOGO_HOLD_MS);
    });
    const cancel = (): void => globalThis.clearTimeout(timer);
    logo.addEventListener('pointerup', cancel);
    logo.addEventListener('pointerleave', cancel);
  }
}
