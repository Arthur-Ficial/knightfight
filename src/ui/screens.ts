import type { BoonDef } from '../config/index.ts';
import { el, button, richButton } from './dom.ts';

// The three core-flow overlays. During a fight there is NO DOM UI at all - these
// only appear between duels.

export interface TitleData {
  readonly title: string;
  readonly bestRung: number;
  readonly muted: boolean;
  readonly crt: boolean;
}

export interface TitleActions {
  readonly onPlay: () => void;
  readonly onCodex: () => void;
  readonly onMeta: () => void;
  readonly onToggleMute: () => void;
  readonly onToggleCrt: () => void;
}

export const buildTitle = (data: TitleData, actions: TitleActions): HTMLElement => {
  const root = el('div', 'kf-panel');
  const logo = el('div', 'kf-title', 'KNIGHTFIGHT');
  logo.id = 'kf-logo';
  root.appendChild(logo);
  root.appendChild(el('div', 'kf-sub', `${data.title}  ·  best rung ${data.bestRung}`));
  root.appendChild(el('div', 'kf-p', 'Tap to strike · hold to charge · swipe to dodge, cut & sweep · two fingers to parry · the whole screen is your blade.'));
  const play = button('kf-btn kf-primary', actions.onPlay);
  play.textContent = 'ENTER THE ARENA';
  root.appendChild(play);
  const row = el('div', 'kf-row');
  row.appendChild(labelled('Combo Codex', actions.onCodex));
  row.appendChild(labelled('Upgrades', actions.onMeta));
  root.appendChild(row);
  const toggles = el('div', 'kf-row');
  toggles.appendChild(labelled(data.muted ? 'Sound: off' : 'Sound: on', actions.onToggleMute));
  toggles.appendChild(labelled(data.crt ? 'CRT: on' : 'CRT: off', actions.onToggleCrt));
  root.appendChild(toggles);
  return root;
};

const labelled = (text: string, onTap: () => void): HTMLButtonElement => {
  const b = button('kf-btn', onTap);
  b.textContent = text;
  return b;
};

export const buildBoonPick = (boons: readonly BoonDef[], onPick: (b: BoonDef) => void): HTMLElement => {
  const root = el('div', 'kf-panel');
  root.appendChild(el('div', 'kf-h', 'CHOOSE A BOON'));
  for (const boon of boons) {
    const b = richButton(`${boon.name}  [${boon.rarity}]`, boon.description, () => {
      onPick(boon);
    });
    if (boon.kind === 'curse') {
      b.style.borderColor = '#8a2a2a';
    }
    root.appendChild(b);
  }
  return root;
};

export interface DeathData {
  readonly rung: number;
  readonly valor: number;
  readonly title: string;
  readonly newBest: boolean;
  readonly canRevive: boolean;
}

export interface DeathActions {
  readonly onUpgrades: () => void;
  readonly onTitle: () => void;
}

export const buildDeath = (data: DeathData, actions: DeathActions): HTMLElement => {
  const root = el('div', 'kf-panel');
  root.appendChild(el('div', 'kf-h', 'YOU DIED'));
  root.appendChild(el('div', 'kf-sub', `Reached rung ${data.rung}${data.newBest ? '  ·  NEW BEST' : ''}`));
  root.appendChild(el('div', 'kf-sub', `+${data.valor} valor  ·  ${data.title}`));
  if (data.canRevive) {
    root.appendChild(el('div', 'kf-p', 'Draw a heart to spend a banked revive.'));
  }
  const up = button('kf-btn kf-primary', actions.onUpgrades);
  up.textContent = 'SPEND VALOR';
  root.appendChild(up);
  const back = button('kf-btn', actions.onTitle);
  back.textContent = 'Back to title';
  root.appendChild(back);
  return root;
};
