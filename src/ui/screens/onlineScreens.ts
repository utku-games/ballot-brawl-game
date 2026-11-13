/**
 * Online screens: the online menu (host or join by code), the waiting room with the room code and invite button,
 * the lobby where both players pick fighters and the host picks the arena, status messages and the result.
 * The code box keeps its key presses to itself, so typing letters never reaches the fight controls or menu keys.
 * Every screen is built from the shared screen kit so it navigates like the other menus.
 */
import { make } from '@utku/engine';
import { fighterById } from '../../roster/roster';
import type { ShareCard } from '../../share/shareCards';
import { ShareKind } from '../../share/shareLink';
import { ROOM_CODE_LENGTH } from '../../net/roomCode';
import { ARENA_ORDER, ARENA_STYLES, type ArenaKind } from '../../view/arenaKinds';
import { injectStyle } from '../injectStyle';
import { button, focusFirst, openScreen, portrait, type Screen } from '../screenKit';
import { shareChallengeButton, shareResultButton } from '../shareButtons';
import { THEME } from '../theme';

const ONLINE_CSS = `
.code-input { font: 700 28px ${THEME.font}; letter-spacing: 6px; text-align: center; text-transform: uppercase;
  width: 9em; max-width: 80vw; padding: 10px; border-radius: 12px; border: 2px solid ${THEME.panelEdge};
  background: ${THEME.panel}; color: ${THEME.ink}; }
.code-input:focus { outline: none; border-color: ${THEME.gold}; }
.room-code { font: 48px ${THEME.font}; color: ${THEME.gold}; letter-spacing: 8px; margin: 8px 0; }
.lobby-side { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 120px; }
.lobby-side img { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 3px solid ${THEME.panelEdge}; }
`;
const ENTER_KEY = 'Enter';
const INVITE_TEXT = 'Fight me in Ballot Brawl, online.';

function openOnline(parent: HTMLElement, overlay: boolean): HTMLElement {
  injectStyle('online', ONLINE_CSS);
  return openScreen(parent, overlay);
}

export interface OnlineMenuActions {
  onHost: () => void;
  onJoin: (typed: string) => void;
  onBack: () => void;
}

/** The online menu; error is shown above the buttons (a failed join, a lost connection) or null. */
export function onlineMenuScreen(parent: HTMLElement, error: string | null, actions: OnlineMenuActions): Screen {
  const root = openOnline(parent, false);
  make('h2', '', 'Online (beta)', root);
  make('p', '', 'Play a one-on-one against a friend on another device. One of you hosts a room and shares its code.', root);
  if (error) make('p', 'tagline', error, root);
  const col = make('div', 'menu-col', null, root);
  button(col, 'Host a room', actions.onHost, 'primary');
  const input = make('input', 'code-input', null, col);
  input.maxLength = ROOM_CODE_LENGTH + 2;
  input.placeholder = 'CODE';
  input.autocomplete = 'off';
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === ENTER_KEY) actions.onJoin(input.value);
  });
  input.addEventListener('keyup', (e) => e.stopPropagation());
  button(col, 'Join with code', () => actions.onJoin(input.value));
  button(col, 'Back', actions.onBack, 'small');
  focusFirst(root);
  return { root };
}

/** A message with one button, for connecting, failures and lost connections. */
export function statusScreen(parent: HTMLElement, title: string, message: string, label: string, onButton: () => void): Screen {
  const root = openOnline(parent, false);
  make('h2', '', title, root);
  make('p', '', message, root);
  button(root, label, onButton, 'small');
  focusFirst(root);
  return { root };
}

export function waitingScreen(parent: HTMLElement, code: string, onCancel: () => void): Screen {
  const root = openOnline(parent, false);
  make('h2', '', 'Room open', root);
  make('p', '', 'Tell your friend this code, or send them the invite link:', root);
  make('div', 'room-code', code, root);
  const row = make('div', 'menu-row', null, root);
  shareChallengeButton(row, 'Share invite', INVITE_TEXT, { kind: ShareKind.Join, code });
  button(row, 'Cancel', onCancel, 'small');
  make('p', 'tagline', 'Waiting for a player to join...', root);
  focusFirst(root);
  return { root };
}

/** What the lobby shows: picks are fighter ids or null while unchosen. */
export interface LobbyView {
  host: boolean;
  mine: string | null;
  theirs: string | null;
  arena: ArenaKind;
  extras: boolean;
}

export interface LobbyActions {
  onPick: () => void;
  onArena: (a: ArenaKind) => void;
  onExtras: (on: boolean) => void;
  onStart: () => void;
  onLeave: () => void;
}

function side(parent: HTMLElement, label: string, fighterId: string | null): void {
  const box = make('div', 'lobby-side', null, parent);
  make('div', 'card-nick', label, box);
  if (fighterId) portrait(box, fighterId, fighterById(fighterId).name);
  make('div', 'card-name', fighterId ? fighterById(fighterId).name : 'Choosing...', box);
}

function hostSettings(root: HTMLElement, view: Readonly<LobbyView>, actions: LobbyActions): void {
  make('p', 'tagline', 'Arena', root);
  const arenas = make('div', 'menu-row', null, root);
  for (const a of ARENA_ORDER) button(arenas, ARENA_STYLES[a].label, () => actions.onArena(a), `small${view.arena === a ? ' on' : ''}`);
  make('p', 'tagline', 'Items and hazards', root);
  const extras = make('div', 'menu-row', null, root);
  button(extras, 'ON', () => actions.onExtras(true), `small${view.extras ? ' on' : ''}`);
  button(extras, 'OFF', () => actions.onExtras(false), `small${view.extras ? '' : ' on'}`);
}

export function lobbyScreen(parent: HTMLElement, view: Readonly<LobbyView>, actions: LobbyActions): Screen {
  const root = openOnline(parent, false);
  make('h2', '', 'Online lobby', root);
  const pair = make('div', 'menu-row', null, root);
  side(pair, 'You', view.mine);
  make('span', 'tagline', 'VS', pair);
  side(pair, 'Opponent', view.theirs);
  button(root, view.mine ? 'Change fighter' : 'Choose fighter', actions.onPick, view.mine ? '' : 'primary');
  if (view.host) {
    hostSettings(root, view, actions);
    const start = button(root, 'Start fight', actions.onStart, 'primary');
    start.disabled = !view.mine || !view.theirs;
  } else {
    const items = view.extras ? 'items on' : 'items off';
    make('p', 'tagline', `${ARENA_STYLES[view.arena].label}, ${items}. The host starts the fight.`, root);
  }
  button(root, 'Leave', actions.onLeave, 'small');
  focusFirst(root);
  return { root };
}

export function onlineResultScreen(parent: HTMLElement, title: string, card: Readonly<ShareCard>, onLobby: () => void, onLeave: () => void): Screen {
  const root = openScreen(parent, true);
  make('h2', '', title, root);
  const col = make('div', 'menu-col', null, root);
  button(col, 'Back to lobby', onLobby, 'primary');
  shareResultButton(col, card);
  button(col, 'Leave', onLeave);
  focusFirst(root);
  return { root };
}
