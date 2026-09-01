// Viewport seam: portrait lock feel, the iOS 100vh fix, no scroll/zoom/select,
// no long-press context menu (that would kill the hold gesture), DPR cap at 3.

export const MAX_DPR = 3;

export const dpr = (): number => Math.min(MAX_DPR, globalThis.devicePixelRatio || 1);

const prevent = (e: Event): void => {
  e.preventDefault();
};

export const lockViewport = (): void => {
  const root = document.documentElement;
  const setVh = (): void => {
    root.style.setProperty('--vh', `${globalThis.innerHeight * 0.01}px`);
  };
  setVh();
  globalThis.addEventListener('resize', setVh);
  globalThis.addEventListener('orientationchange', setVh);
  document.addEventListener('contextmenu', prevent);
  document.addEventListener('gesturestart', prevent);
  document.addEventListener('gesturechange', prevent);
  document.addEventListener('dblclick', prevent);
  document.addEventListener(
    'touchmove',
    (e: Event) => {
      if (e instanceof TouchEvent && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false },
  );
};

interface FullscreenEl {
  requestFullscreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => void;
}

export const requestFullscreenSafe = (): void => {
  const el = document.documentElement as unknown as FullscreenEl;
  try {
    if (el.requestFullscreen !== undefined) {
      void el.requestFullscreen();
    } else if (el.webkitRequestFullscreen !== undefined) {
      el.webkitRequestFullscreen();
    }
  } catch {
    // fullscreen is best-effort.
  }
};
