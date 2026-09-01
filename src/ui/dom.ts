// Minimal DOM helpers. Overlays are plain elements so they stay light and the
// canvas owns the game. Buttons use pointerup so they feel instant on touch.

export const el = (tag: string, className?: string, text?: string): HTMLElement => {
  const node = document.createElement(tag);
  if (className !== undefined) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
};

export const clear = (node: HTMLElement): void => {
  while (node.firstChild !== null) {
    node.removeChild(node.firstChild);
  }
};

export const button = (className: string, onTap: () => void): HTMLButtonElement => {
  const b = document.createElement('button');
  b.className = className;
  b.addEventListener('pointerup', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onTap();
  });
  return b;
};

export const richButton = (title: string, detail: string, onTap: () => void): HTMLButtonElement => {
  const b = button('kf-btn', onTap);
  const strong = el('strong', undefined, title);
  const span = el('span', undefined, detail);
  b.appendChild(strong);
  b.appendChild(span);
  return b;
};
