/**
 * Placeholder title overlay for the scaffold: the game name and a parody disclaimer over the arena.
 * It is plain DOM built with the engine make helper and styled inline so it needs no stylesheet.
 * The real title screen replaces it when the menus land.
 */
import { make } from '@utku/engine';

const GAME_TITLE = 'Ballot Brawl';
const DISCLAIMER = 'Unofficial parody. Not affiliated with or endorsed by anyone depicted.';
const OVERLAY_STYLE =
  'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
  'pointer-events:none;color:#fff;font-family:system-ui,sans-serif;text-align:center;text-shadow:0 4px 12px #000';
const TITLE_STYLE = 'font-size:clamp(40px,10vw,96px);font-weight:900;letter-spacing:2px;margin:0';
const DISCLAIMER_STYLE = 'font-size:14px;opacity:0.8;margin-top:12px;padding:0 16px';

/** Adds the title overlay to the container and returns its root element. */
export function showTitleOverlay(container: HTMLElement): HTMLElement {
  const root = make('div', 'title-overlay', null, container);
  root.style.cssText = OVERLAY_STYLE;
  make('h1', 'title-overlay-name', GAME_TITLE, root).style.cssText = TITLE_STYLE;
  make('p', 'title-overlay-disclaimer', DISCLAIMER, root).style.cssText = DISCLAIMER_STYLE;
  return root;
}
