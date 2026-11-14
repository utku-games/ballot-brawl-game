/**
 * Full screen for phones and tablets: asks the browser to show the game without its address bar and toolbars.
 * Android browsers and iPads support this after a tap; iPhone Safari does not, but a game added to the home screen
 * opens full screen from its manifest, so callers can tell the two cases apart and explain the second one.
 * This is a thin adapter over the Fullscreen API and display-mode media queries.
 */

/** Older Safari exposes the API with a webkit prefix. */
interface PrefixedElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

interface PrefixedDocument {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
}

/** iOS sets this on pages opened from the home screen. */
interface StandaloneNavigator {
  standalone?: boolean;
}

const INSTALLED_QUERIES = ['(display-mode: fullscreen)', '(display-mode: standalone)'] as const;

/** True when this browser can put the page into full screen. */
export function canGoFullscreen(): boolean {
  const el = document.documentElement as HTMLElement & PrefixedElement;
  const doc = document as Document & PrefixedDocument;
  const api = typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function';
  return api && (document.fullscreenEnabled || doc.webkitFullscreenEnabled === true);
}

export function isFullscreen(): boolean {
  const doc = document as Document & PrefixedDocument;
  return !!(document.fullscreenElement ?? doc.webkitFullscreenElement);
}

/** True when the game runs as an app opened from the home screen, which is already full screen. */
export function isInstalledApp(): boolean {
  return INSTALLED_QUERIES.some((q) => window.matchMedia(q).matches) || (navigator as StandaloneNavigator).standalone === true;
}

/** Asks for full screen (must run inside a tap); resolves true when the page is full screen afterwards. */
export async function enterFullscreen(): Promise<boolean> {
  if (isFullscreen()) return true;
  if (!canGoFullscreen()) return false;
  const el = document.documentElement as HTMLElement & PrefixedElement;
  try {
    if (typeof el.requestFullscreen === 'function') await el.requestFullscreen({ navigationUI: 'hide' });
    else await el.webkitRequestFullscreen?.();
  } catch (e) {
    if (!(e instanceof Error)) throw e;
    return false;
  }
  return isFullscreen();
}
