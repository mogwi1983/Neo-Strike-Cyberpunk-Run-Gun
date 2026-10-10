import { useEffect, useState } from 'react';

export interface AppViewport {
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
  isLandscape: boolean;
}

function readViewport(): AppViewport {
  if (typeof window === 'undefined') {
    return { width: 390, height: 844, offsetTop: 0, offsetLeft: 0, isLandscape: false };
  }

  const vv = window.visualViewport;
  const width = Math.round(vv?.width ?? window.innerWidth);
  const height = Math.round(vv?.height ?? window.innerHeight);

  return {
    width,
    height,
    offsetTop: Math.round(vv?.offsetTop ?? 0),
    offsetLeft: Math.round(vv?.offsetLeft ?? 0),
    isLandscape: width > height,
  };
}

/** Tracks the visible mobile browser viewport (Safari chrome-aware). */
export function useAppViewport(): AppViewport {
  const [viewport, setViewport] = useState<AppViewport>(() => readViewport());

  useEffect(() => {
    const sync = () => {
      setViewport(readViewport());
      // Keep the document pinned so iOS doesn't scroll controls off-screen.
      window.scrollTo(0, 0);
    };

    sync();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', sync);
    vv?.addEventListener('scroll', sync);
    window.addEventListener('orientationchange', sync);
    window.addEventListener('resize', sync);

    const timers = [100, 300, 600].map((ms) => window.setTimeout(sync, ms));

    return () => {
      vv?.removeEventListener('resize', sync);
      vv?.removeEventListener('scroll', sync);
      window.removeEventListener('orientationchange', sync);
      window.removeEventListener('resize', sync);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return viewport;
}
