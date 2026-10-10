type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>;
};

export function isFullscreenSupported(): boolean {
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

export function isFullscreenActive(): boolean {
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
}

/** Launched from the home screen, where iOS already hides all browser UI. */
export function isStandaloneApp(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || nav.standalone === true;
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export async function enterFullscreen(): Promise<void> {
  if (!isFullscreenSupported() || isFullscreenActive()) return;
  const el = document.documentElement as FullscreenElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: 'hide' });
    } else {
      await el.webkitRequestFullscreen?.();
    }
    // Orientation lock is only allowed while fullscreen (Android); ignore rejections elsewhere.
    await (screen.orientation as LockableOrientation | undefined)?.lock?.('landscape').catch(() => {});
  } catch {
    // Browsers reject when not triggered by a user gesture; the game still works windowed.
  }
}

export async function exitFullscreen(): Promise<void> {
  if (!isFullscreenActive()) return;
  const doc = document as FullscreenDocument;
  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else {
      await doc.webkitExitFullscreen?.();
    }
  } catch {
    // Already exited.
  }
}

export function toggleFullscreen(): Promise<void> {
  return isFullscreenActive() ? exitFullscreen() : enterFullscreen();
}
