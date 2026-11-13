/**
 * Small building blocks shared by every menu screen: the screen container, buttons, portraits and fighter cards.
 * Screens built from these share one stylesheet and behave the same with mouse, touch, keyboard and gamepad.
 * Each helper returns the element it created so a screen can keep references it needs to update.
 */
import { make } from '@utku/engine';
import { faceUrl } from '../core/assets';
import { STAT_MAX, type FighterDef } from '../roster/rosterTypes';
import { injectStyle } from './injectStyle';
import { MENU_CSS } from './menuStyles';

export interface Screen {
  root: HTMLElement;
}

export function openScreen(parent: HTMLElement, overlay: boolean): HTMLElement {
  injectStyle('menu', MENU_CSS);
  return make('div', overlay ? 'screen overlay' : 'screen', null, parent);
}

export function button(parent: HTMLElement, label: string, onClick: () => void, cls = ''): HTMLButtonElement {
  const b = make('button', `menu-btn ${cls}`.trim(), label, parent);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

export function portrait(parent: HTMLElement, fighterId: string, alt: string): HTMLImageElement {
  const img = make('img', '', null, parent);
  img.src = faceUrl(fighterId);
  img.alt = alt;
  img.loading = 'lazy';
  return img;
}

function statRow(parent: HTMLElement, label: string, value: number): void {
  make('span', '', label, parent);
  const bar = make('div', 'stat-bar', null, parent);
  make('div', '', null, bar).style.width = `${(value / STAT_MAX) * 100}%`;
}

/** A tappable fighter card with portrait, name, nickname and stat bars. */
export function fighterCard(parent: HTMLElement, def: FighterDef, onPick: () => void): HTMLButtonElement {
  const card = button(parent, '', onPick, `card${def.boss ? ' boss' : ''}`);
  portrait(card, def.id, def.name);
  make('div', 'card-name', def.name, card);
  make('div', 'card-nick', def.boss ? `BOSS - ${def.nickname}` : def.nickname, card);
  const stats = make('div', 'stats', null, card);
  statRow(stats, 'POW', def.stats.power);
  statRow(stats, 'SPD', def.stats.speed);
  statRow(stats, 'TGH', def.stats.toughness);
  return card;
}

/** Focuses the first button so keyboard and gamepad players can start navigating at once. */
export function focusFirst(root: HTMLElement): void {
  root.querySelector<HTMLButtonElement>('.menu-btn:not(:disabled)')?.focus({ preventScroll: true });
}
