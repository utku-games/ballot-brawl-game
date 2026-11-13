/**
 * The title screen: the game name, a one-line pitch, the parody disclaimer and the main menu.
 * Story and Brawl start the two modes; Credits lists every face image's author and licence; a toggle mutes sound.
 * A short controls hint adapts to touch screens.
 */
import { make } from '@utku/engine';
import { button, focusFirst, openScreen, type Screen } from '../screenKit';

export interface TitleActions {
  onStory: () => void;
  onBrawl: () => void;
  onCredits: () => void;
  onToggleMute: () => boolean;
}

const DISCLAIMER = 'Unofficial parody. Not affiliated with or endorsed by anyone depicted. No gore: losers just fall over.';
const KEYS_HINT = 'P1: WASD move, J punch, K kick, L defend, I finisher, U swap. P2: arrows and , . / Shift \' . Gamepads work too.';
const TOUCH_HINT = 'Drag the left side to move. Punch, Kick, Defend and Finisher buttons on the right.';

export function titleScreen(parent: HTMLElement, actions: TitleActions, muted: boolean, touch: boolean): Screen {
  const root = openScreen(parent, false);
  make('h1', '', 'BALLOT BRAWL', root);
  make('p', 'tagline', 'Politicians, tycoons and legends settle it the old-fashioned way.', root);
  const col = make('div', 'menu-col', null, root);
  button(col, 'Story', actions.onStory, 'primary');
  button(col, 'Brawl (up to 4v4)', actions.onBrawl);
  button(col, 'Credits', actions.onCredits);
  const mute = button(col, muted ? 'Sound: Off' : 'Sound: On', () => {
    mute.textContent = actions.onToggleMute() ? 'Sound: Off' : 'Sound: On';
  }, 'small');
  make('p', 'controls-hint', touch ? TOUCH_HINT : KEYS_HINT, root);
  make('p', 'disclaimer', DISCLAIMER, root);
  focusFirst(root);
  return { root };
}
