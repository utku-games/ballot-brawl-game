/**
 * Smaller overlay screens: the pause menu, the brawl result, and the credits list.
 * Credits show every face with its source, author and licence, generated from the face pipeline's credits file.
 * All of them are built from the shared screen kit so they look and navigate like the rest of the menus.
 */
import { make } from '@utku/engine';
import { FACE_CREDITS } from '../../roster/credits';
import { fighterById } from '../../roster/roster';
import { button, focusFirst, openScreen, portrait, type Screen } from '../screenKit';

export function pauseScreen(parent: HTMLElement, onResume: () => void, onQuit: () => void): Screen {
  const root = openScreen(parent, true);
  make('h2', '', 'PAUSED', root);
  const col = make('div', 'menu-col', null, root);
  button(col, 'Resume', onResume, 'primary');
  button(col, 'Quit to menu', onQuit);
  focusFirst(root);
  return { root };
}

export function brawlResultScreen(parent: HTMLElement, title: string, onAgain: () => void, onSetup: () => void, onMenu: () => void): Screen {
  const root = openScreen(parent, true);
  make('h2', '', title, root);
  const col = make('div', 'menu-col', null, root);
  button(col, 'Rematch', onAgain, 'primary');
  button(col, 'Change teams', onSetup);
  button(col, 'Main menu', onMenu);
  focusFirst(root);
  return { root };
}

function link(parent: HTMLElement, text: string, href: string): void {
  if (!href) {
    make('span', '', text, parent);
    return;
  }
  const a = make('a', '', text, parent);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
}

export function creditsScreen(parent: HTMLElement, onBack: () => void): Screen {
  const root = openScreen(parent, false);
  make('h2', '', 'Credits', root);
  make('p', '', 'Ballot Brawl is an unofficial parody. Nobody depicted endorses it. Face images are cropped, resized and masked '
    + 'from public domain or freely licensed photos on Wikimedia Commons and keep their original licences.', root);
  button(root, 'Back', onBack, 'small');
  const list = make('div', 'credits', null, root);
  for (const c of FACE_CREDITS) {
    const row = make('div', 'credit', null, list);
    portrait(row, c.id, fighterById(c.id).name);
    const info = make('div', '', null, row);
    make('strong', '', `${fighterById(c.id).name}: `, info);
    link(info, c.file, c.sourceUrl);
    make('span', '', ` by ${c.author}, `, info);
    link(info, c.license, c.licenseUrl);
  }
  make('p', 'disclaimer', 'Code: MIT licence. Built on Three.js and the Utku engine.', root);
  focusFirst(root);
  return { root };
}
