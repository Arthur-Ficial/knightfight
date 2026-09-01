import { COMBOS, UPGRADES } from '../config/index.ts';
import type { UpgradeDef } from '../config/meta.ts';
import { rankOf, upgradeCost, type MetaState } from '../sim/meta.ts';
import { el, button } from './dom.ts';
import { comboRow, dominantIcon } from './icons.ts';
import { attachSwipeCommit } from './swipe.ts';

// Combo Codex and Hall of Valor. Symbol-first, two-column grids that fit one
// screen at 390x844 AND 375x667 - no scrolling. Buying valor needs a swipe.

const pips = (rank: number, max: number): string => '●'.repeat(rank) + '○'.repeat(max - rank);

const upgradeGlyph = (u: UpgradeDef): string =>
  u.effect.kind === 'unlock'
    ? (u.effect.gesture === 'whirlwind' ? '◯' : u.effect.gesture === 'focus' ? '⧖' : '◇')
    : dominantIcon(u.effect.mods);

export const buildCodex = (found: readonly string[], onBack: () => void): HTMLElement => {
  const root = el('div', 'kf-panel');
  root.appendChild(el('div', 'kf-h', '☰ CODEX'));
  const known = new Set(found);
  const grid = el('div', 'kf-grid');
  for (const c of COMBOS) {
    const cell = el('div', 'kf-cell');
    if (known.has(c.name)) {
      cell.appendChild(el('div', 'kf-cell-name', c.name));
      cell.appendChild(el('div', 'kf-cell-row', comboRow(c.sequence)));
    } else {
      cell.classList.add('kf-locked');
      cell.appendChild(el('div', 'kf-cell-name', '? ? ?'));
      cell.appendChild(el('div', 'kf-cell-row', '·'.repeat(c.sequence.length)));
    }
    grid.appendChild(cell);
  }
  root.appendChild(grid);
  const back = button('kf-btn', onBack);
  back.textContent = '‹ BACK';
  root.appendChild(back);
  return root;
};

export const buildMeta = (meta: MetaState, onBuy: (id: string) => void, onBack: () => void): HTMLElement => {
  const root = el('div', 'kf-panel');
  root.appendChild(el('div', 'kf-h', `★ ${meta.valor}`));
  root.appendChild(el('div', 'kf-sub', '◄ swipe to buy'));
  const grid = el('div', 'kf-grid');
  for (const u of UPGRADES) {
    const rank = rankOf(meta, u.id);
    const maxed = rank >= u.maxRank;
    const cost = upgradeCost(u.id, rank);
    const cell = el('div', 'kf-cell kf-buy');
    cell.appendChild(el('div', 'kf-cell-icon', upgradeGlyph(u)));
    cell.appendChild(el('div', 'kf-cell-name', u.name));
    cell.appendChild(el('div', 'kf-cell-row', maxed ? pips(rank, u.maxRank) : `${pips(rank, u.maxRank)}  ${cost}★`));
    const detail = el('div', 'kf-card-detail kf-hidden', u.description);
    cell.appendChild(detail);
    if (maxed || meta.valor < cost) {
      cell.classList.add('kf-locked');
    }
    attachSwipeCommit(cell, () => detail.classList.toggle('kf-hidden'), () => {
      if (!maxed && meta.valor >= cost) {
        onBuy(u.id);
      }
    });
    grid.appendChild(cell);
  }
  root.appendChild(grid);
  const back = button('kf-btn', onBack);
  back.textContent = '‹ BACK';
  root.appendChild(back);
  return root;
};

export const buildDev = (lines: readonly string[], onClose: () => void): HTMLElement => {
  const root = el('div', 'kf-panel');
  root.appendChild(el('div', 'kf-h', 'DEV'));
  const list = el('div', 'kf-list');
  for (const line of lines) {
    list.appendChild(el('div', 'kf-item', line));
  }
  root.appendChild(list);
  const close = button('kf-btn', onClose);
  close.textContent = 'CLOSE';
  root.appendChild(close);
  return root;
};
