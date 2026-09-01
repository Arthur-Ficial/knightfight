// Anti-misfire commit gesture. A tap only focuses (never commits). A deliberate
// swipe LEFT past a threshold commits; the card follows the finger and snaps
// back if released too early. Used for boons and any destructive choice.

const COMMIT_PX = 82;
const TAP_PX = 8;

export const attachSwipeCommit = (el: HTMLElement, onFocus: () => void, onCommit: () => void): void => {
  let startX = 0;
  let dragging = false;
  let pid = -1;
  el.style.touchAction = 'none';

  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    pid = e.pointerId;
    try {
      el.setPointerCapture(pid);
    } catch {
      // no active pointer (synthetic event) - drag still tracks via events.
    }
    el.style.transition = 'none';
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pid) {
      return;
    }
    const dx = Math.min(0, e.clientX - startX);
    el.style.transform = `translateX(${dx}px)`;
    el.style.opacity = String(1 - Math.min(0.5, -dx / 320));
  });

  const end = (e: PointerEvent): void => {
    if (!dragging || e.pointerId !== pid) {
      return;
    }
    dragging = false;
    const dx = e.clientX - startX;
    el.style.transition = 'transform .18s ease, opacity .18s ease';
    el.style.transform = 'translateX(0)';
    el.style.opacity = '1';
    if (dx < -COMMIT_PX) {
      onCommit();
    } else if (Math.abs(dx) < TAP_PX) {
      onFocus();
    }
  };

  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
};
