/**
 * Party setup: a free-for-all of three or four fighters, each on their own side, with a fighter and a P2/CPU toggle
 * per side, plus CPU difficulty, items and hazards, and the arena (The Rooftop adds ring-outs).
 * The screen only edits the setup through the pure brawlConfig functions and re-renders itself after each change.
 * Fighter picking reuses the shared fighter grid screen.
 */
import { make } from '@utku/engine';
import { Difficulty } from '../../ai/aiProfile';
import { Controller, PARTY_MAX_SIDES, PARTY_MIN_SIDES, RANDOM_FIGHTER, setPartySides, togglePlayerTwo, type BrawlConfig } from '../../game/brawlConfig';
import { fighterById } from '../../roster/roster';
import { ARENA_ORDER, ARENA_STYLES } from '../../view/arenaKinds';
import { button, focusFirst, openScreen, portrait, type Screen } from '../screenKit';
import { THEME } from '../theme';

export interface PartySetupActions {
  onChange: (config: BrawlConfig) => void;
  onPickFighter: (side: number) => void;
  onStart: () => void;
  onBack: () => void;
}

const SIDE_CSS = [THEME.teamA, THEME.teamB, THEME.teamC, THEME.teamD] as const;
const CONTROLLER_LABEL: Readonly<Record<Controller, string>> = { [Controller.P1]: 'P1', [Controller.P2]: 'P2', [Controller.Cpu]: 'CPU' };
const DIFFICULTIES: readonly Difficulty[] = [Difficulty.Easy, Difficulty.Normal, Difficulty.Hard];

function sideRow(parent: HTMLElement, config: BrawlConfig, side: number, actions: PartySetupActions): void {
  const slot = config.teams[side][0];
  const row = make('div', 'slot', null, parent);
  row.style.setProperty('--team', SIDE_CSS[side]);
  row.style.borderLeft = `6px solid ${SIDE_CSS[side]}`;
  const pick = button(row, '', () => actions.onPickFighter(side));
  if (slot.fighterId === RANDOM_FIGHTER) {
    make('span', '', 'Random fighter (tap to choose)', pick);
  } else {
    const def = fighterById(slot.fighterId);
    portrait(pick, def.id, def.name);
    make('span', '', def.name, pick);
  }
  const who = button(row, CONTROLLER_LABEL[slot.controller], () => actions.onChange(togglePlayerTwo(config, side, 0)), 'small who');
  who.disabled = slot.controller === Controller.P1;
}

function choiceRow<T>(parent: HTMLElement, title: string, options: readonly T[], label: (o: T) => string, isOn: (o: T) => boolean, pick: (o: T) => void): void {
  make('p', 'tagline', title, parent);
  const row = make('div', 'menu-row', null, parent);
  for (const o of options) button(row, label(o), () => pick(o), `small${isOn(o) ? ' on' : ''}`);
}

export function partySetupScreen(parent: HTMLElement, config: BrawlConfig, actions: PartySetupActions): Screen {
  const root = openScreen(parent, false);
  make('h2', '', 'Party', root);
  make('p', '', 'Every fighter for themselves. The last one standing wins. Tap CPU to give a fighter to Player 2.', root);
  const sizes: number[] = [];
  for (let n = PARTY_MIN_SIDES; n <= PARTY_MAX_SIDES; n += 1) sizes.push(n);
  choiceRow(root, 'Fighters', sizes, (n) => `${n} fighters`, (n) => config.teams.length === n, (n) => actions.onChange(setPartySides(config, n)));
  const sides = make('div', 'team', null, root);
  config.teams.forEach((_, side) => sideRow(sides, config, side, actions));
  choiceRow(root, 'CPU difficulty', DIFFICULTIES, (d) => d.toUpperCase(), (d) => config.difficulty === d, (d) => actions.onChange({ ...config, difficulty: d }));
  choiceRow(root, 'Items and hazards', [true, false], (on) => (on ? 'ON' : 'OFF'), (on) => config.extras === on, (on) => actions.onChange({ ...config, extras: on }));
  choiceRow(root, 'Arena', ARENA_ORDER, (a) => ARENA_STYLES[a].label, (a) => config.arena === a, (a) => actions.onChange({ ...config, arena: a }));
  const row = make('div', 'menu-row', null, root);
  button(row, 'START PARTY', actions.onStart, 'primary');
  button(row, 'Back', actions.onBack, 'small');
  focusFirst(root);
  return { root };
}
