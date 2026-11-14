/**
 * The title screen: the game name, a one-line pitch, the parody disclaimer and the main menu.
 * Story, Rivalry Battles, Brawl, Party and Online start the modes; Credits lists every face image's author and licence; a toggle mutes sound.
 * A short controls hint adapts to touch screens, which also get a Full screen button until the game is full screen.
 */
import { make } from '@utku/engine';
import { button, focusFirst, openScreen, type Screen } from '../screenKit';

export interface TitleActions {
  onStory: () => void;
  onRivalry: () => void;
  onBrawl: () => void;
  onParty: () => void;
  onOnline: () => void;
  onTrophies: () => void;
  onCredits: () => void;
  onToggleMute: () => boolean;
  onFullscreen: () => void;
}

const DISCLAIMER = 'Unofficial parody. Not affiliated with or endorsed by anyone depicted. No gore: losers just fall over.';
const KEYS_HINT = 'P1: WASD move, J punch, K kick, L defend, I finisher, H taunt, U swap. P2: arrows and , . / Shift ; \' . Gamepads work too.';
const BUTTONS_HINT = 'Or use the on-screen buttons: drag the left side to move; Punch, Kick, Defend, Finisher and Taunt on the right.';

/** offerFullscreen shows the Full screen button (touch devices not yet full screen). */
export function titleScreen(parent: HTMLElement, actions: TitleActions, muted: boolean, touch: boolean, offerFullscreen: boolean): Screen {
  const root = openScreen(parent, false);
  make('h1', '', 'BALLOT BRAWL', root);
  make('p', 'tagline', 'Politicians, tycoons and legends settle it the old-fashioned way.', root);
  const col = make('div', 'menu-col', null, root);
  button(col, 'Story', actions.onStory, 'primary');
  button(col, 'Rivalry Battles', actions.onRivalry);
  button(col, 'Brawl (up to 4v4)', actions.onBrawl);
  button(col, 'Party (free-for-all)', actions.onParty);
  button(col, 'Online 1v1 (beta)', actions.onOnline);
  button(col, 'Trophies', actions.onTrophies);
  button(col, 'Credits', actions.onCredits);
  const extras = make('div', 'menu-row', null, col);
  if (offerFullscreen) button(extras, 'Full screen', actions.onFullscreen, 'small');
  const mute = button(extras, muted ? 'Sound: Off' : 'Sound: On', () => {
    mute.textContent = actions.onToggleMute() ? 'Sound: Off' : 'Sound: On';
  }, 'small');
  if (!touch) make('p', 'controls-hint', KEYS_HINT, root);
  make('p', 'controls-hint', BUTTONS_HINT, root);
  make('p', 'disclaimer', DISCLAIMER, root);
  focusFirst(root);
  return { root };
}
