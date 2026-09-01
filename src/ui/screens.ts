import type { BoonDef } from '../config/index.ts';
import { el, button } from './dom.ts';
import { modSummary, dominantIcon } from './icons.ts';
import { attachSwipeCommit } from './swipe.ts';

// Between-fight overlays. Symbol-first, one screen, no scrolling. During a fight
// there is NO DOM UI at all.

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

const ghostTile = (kind: string, glyph: string): HTMLElement => {
  const tile = el('div', `kf-ghost kf-g-${kind}`);
  tile.appendChild(el('div', 'kf-ghost-glyph', glyph));
  tile.appendChild(el('div', 'kf-ghost-dot'));
  return tile;
};

const iconButton = (glyph: string, onTap: () => void): HTMLButtonElement => {
  const b = button('kf-btn kf-icon-btn', onTap);
  b.textContent = glyph;
  return b;
};

export const buildTitle = (data: TitleData, actions: TitleActions): HTMLElement => {
  const root = el('div', 'kf-panel');
  const logo = el('div', 'kf-title', 'KNIGHTFIGHT');
  logo.id = 'kf-logo';
  root.appendChild(logo);
  root.appendChild(el('div', 'kf-sub', `${data.title} · best ${data.bestRung}`));
  const strip = el('div', 'kf-ghost-strip');
  strip.appendChild(ghostTile('tap', '✛'));
  strip.appendChild(ghostTile('swipe', '⇦'));
  strip.appendChild(ghostTile('hold', '◆'));
  strip.appendChild(ghostTile('two', '◇'));
  root.appendChild(strip);
  const play = button('kf-btn kf-primary', actions.onPlay);
  play.textContent = 'ENTER THE ARENA';
  root.appendChild(play);
  const row = el('div', 'kf-row');
  row.appendChild(iconButton('☰ Codex', actions.onCodex));
  row.appendChild(iconButton('★ Valor', actions.onMeta));
  row.appendChild(iconButton(data.muted ? '♪̸' : '♪', actions.onToggleMute));
  row.appendChild(iconButton(data.crt ? '▤' : '▢', actions.onToggleCrt));
  root.appendChild(row);
  return root;
};

const RARITY_CLASS: Record<string, string> = { common: '', rare: 'kf-rare', epic: 'kf-epic' };

export const buildBoonPick = (boons: readonly BoonDef[], onPick: (b: BoonDef) => void): HTMLElement => {
  const root = el('div', 'kf-panel');
  root.appendChild(el('div', 'kf-h', 'CHOOSE'));
  root.appendChild(el('div', 'kf-sub', '◄ swipe a card to take'));
  for (const boon of boons) {
    const cls = boon.kind === 'curse' ? 'kf-curse' : RARITY_CLASS[boon.rarity] ?? '';
    const card = el('div', `kf-card ${cls}`);
    card.appendChild(el('div', 'kf-card-icon', dominantIcon(boon.mods)));
    const body = el('div', 'kf-card-body');
    body.appendChild(el('div', 'kf-card-name', boon.name));
    body.appendChild(el('div', 'kf-card-stat', modSummary(boon.mods)));
    const detail = el('div', 'kf-card-detail kf-hidden', boon.description);
    body.appendChild(detail);
    card.appendChild(body);
    card.appendChild(el('div', 'kf-card-swipe', '◄'));
    attachSwipeCommit(card, () => detail.classList.toggle('kf-hidden'), () => onPick(boon));
    root.appendChild(card);
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
  root.appendChild(el('div', 'kf-h', '☠ DEFEATED'));
  root.appendChild(el('div', 'kf-sub', `rung ${data.rung}${data.newBest ? ' · NEW BEST' : ''}`));
  root.appendChild(el('div', 'kf-sub', `+${data.valor} ★ · ${data.title}`));
  if (data.canRevive) {
    root.appendChild(el('div', 'kf-sub', 'draw ◯ to bank a revive'));
  }
  const up = button('kf-btn kf-primary', actions.onUpgrades);
  up.textContent = '★ SPEND VALOR';
  root.appendChild(up);
  const back = button('kf-btn', actions.onTitle);
  back.textContent = 'TITLE';
  root.appendChild(back);
  return root;
};
