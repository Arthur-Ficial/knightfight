import { COMBOS, UPGRADES } from '../config/index.ts';
import { rankOf, upgradeCost, type MetaState } from '../sim/meta.ts';
import { el, button, richButton } from './dom.ts';

// Secondary overlays: the Combo Codex, the meta upgrade tree, and the dev
// overlay (long-press the logo) that dumps live sim stats.

export const buildCodex = (found: readonly string[], onBack: () => void): HTMLElement => {
  const root = el('div', 'kf-panel');
  root.appendChild(el('div', 'kf-h', 'COMBO CODEX'));
  const known = new Set(found);
  const list = el('div', 'kf-list');
  for (const c of COMBOS) {
    const item = el('div', 'kf-item');
    if (known.has(c.name)) {
      item.appendChild(el('div', 'kf-tag', c.name));
      item.appendChild(el('div', 'kf-p', c.sequence.join('  →  ')));
      item.appendChild(el('div', 'kf-p', c.description));
    } else {
      item.className = 'kf-item kf-locked';
      item.appendChild(el('div', 'kf-tag', '??? — undiscovered'));
      item.appendChild(el('div', 'kf-p', `${c.sequence.length} inputs`));
    }
    list.appendChild(item);
  }
  root.appendChild(list);
  const back = button('kf-btn', onBack);
  back.textContent = 'Back';
  root.appendChild(back);
  return root;
};

export const buildMeta = (meta: MetaState, onBuy: (id: string) => void, onBack: () => void): HTMLElement => {
  const root = el('div', 'kf-panel');
  root.appendChild(el('div', 'kf-h', 'HALL OF VALOR'));
  root.appendChild(el('div', 'kf-sub', `${meta.valor} valor`));
  for (const u of UPGRADES) {
    const rank = rankOf(meta, u.id);
    const maxed = rank >= u.maxRank;
    const cost = upgradeCost(u.id, rank);
    const label = maxed
      ? `${u.name}  (MAX)`
      : `${u.name}  (${rank}/${u.maxRank})  —  ${cost} valor`;
    const b = richButton(label, u.description, () => {
      onBuy(u.id);
    });
    if (maxed || meta.valor < cost) {
      b.classList.add('kf-locked');
    }
    root.appendChild(b);
  }
  const back = button('kf-btn', onBack);
  back.textContent = 'Back';
  root.appendChild(back);
  return root;
};

export const buildDev = (lines: readonly string[], onClose: () => void): HTMLElement => {
  const root = el('div', 'kf-panel');
  root.appendChild(el('div', 'kf-h', 'DEV OVERLAY'));
  const list = el('div', 'kf-list');
  for (const line of lines) {
    list.appendChild(el('div', 'kf-item', line));
  }
  root.appendChild(list);
  const close = button('kf-btn', onClose);
  close.textContent = 'Close';
  root.appendChild(close);
  return root;
};
