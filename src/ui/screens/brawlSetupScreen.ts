/**
 * Brawl setup: two team panels with 1 to 4 slots each, a fighter per slot (tap to change, Random allowed) and a P2/CPU
 * toggle, plus CPU difficulty, the arena and the Start button.
 * The screen only edits a BrawlConfig through the pure brawlConfig functions and re-renders itself after each change.
 * Fighter picking itself is delegated to the shared fighter grid screen.
 */
import { make } from '@utku/engine';
import { Difficulty } from '../../ai/aiProfile';
import { MAX_TEAM_SIZE } from '../../fight/fightConstants';
import { Controller, RANDOM_FIGHTER, setTeamSize, togglePlayerTwo, type BrawlConfig } from '../../game/brawlConfig';
import { fighterById } from '../../roster/roster';
import { ARENA_ORDER, ARENA_STYLES } from '../../view/arenaKinds';
import { button, focusFirst, openScreen, portrait, type Screen } from '../screenKit';
import { THEME } from '../theme';

export interface BrawlSetupActions {
  onChange: (config: BrawlConfig) => void;
  onPickFighter: (team: 0 | 1, index: number) => void;
  onStart: () => void;
  onBack: () => void;
}

const TEAM_NAMES = ['Left team', 'Right team'] as const;
const TEAM_CSS = [THEME.teamA, THEME.teamB] as const;
const CONTROLLER_LABEL: Readonly<Record<Controller, string>> = { [Controller.P1]: 'P1', [Controller.P2]: 'P2', [Controller.Cpu]: 'CPU' };
const DIFFICULTIES: readonly Difficulty[] = [Difficulty.Easy, Difficulty.Normal, Difficulty.Hard];
const SIZE_PRESETS: readonly number[] = [1, 2, 3, 4];

function sizePresets(parent: HTMLElement, config: BrawlConfig, actions: BrawlSetupActions): void {
  make('p', 'tagline', 'Team size', parent);
  const row = make('div', 'menu-row', null, parent);
  for (const n of SIZE_PRESETS) {
    const current = config.teams[0].length === n && config.teams[1].length === n;
    button(row, `${n}v${n}`, () => actions.onChange(setTeamSize(setTeamSize(config, 0, n), 1, n)), `${current ? 'on' : ''}`);
  }
}

function teamPanel(parent: HTMLElement, config: BrawlConfig, team: 0 | 1, actions: BrawlSetupActions): void {
  const panel = make('div', 'team', null, parent);
  panel.style.setProperty('--team', TEAM_CSS[team]);
  const head = make('div', 'team-head', null, panel);
  make('span', '', `${TEAM_NAMES[team]} (${config.teams[team].length})`, head);
  const size = make('div', 'menu-row', null, head);
  const n = config.teams[team].length;
  button(size, '-', () => actions.onChange(setTeamSize(config, team, n - 1)), 'small').disabled = n <= 1;
  button(size, '+', () => actions.onChange(setTeamSize(config, team, n + 1)), 'small').disabled = n >= MAX_TEAM_SIZE;
  config.teams[team].forEach((slot, i) => {
    const row = make('div', 'slot', null, panel);
    const pick = button(row, '', () => actions.onPickFighter(team, i));
    if (slot.fighterId === RANDOM_FIGHTER) {
      make('span', '', 'Random fighter (tap to choose)', pick);
    } else {
      const def = fighterById(slot.fighterId);
      portrait(pick, def.id, def.name);
      make('span', '', def.name, pick);
    }
    const who = button(row, CONTROLLER_LABEL[slot.controller], () => actions.onChange(togglePlayerTwo(config, team, i)), 'small who');
    who.disabled = slot.controller === Controller.P1;
  });
}

export function brawlSetupScreen(parent: HTMLElement, config: BrawlConfig, actions: BrawlSetupActions): Screen {
  const root = openScreen(parent, false);
  make('h2', '', 'Brawl', root);
  sizePresets(root, config, actions);
  make('p', '', 'You (P1) control the first fighter on the left; CPU teammates fight with you and Swap jumps between them. '
    + 'Tap any fighter to choose who it is, use - and + for uneven teams, and tap CPU to give a slot to Player 2.', root);
  const teams = make('div', 'teams', null, root);
  teamPanel(teams, config, 0, actions);
  teamPanel(teams, config, 1, actions);
  make('p', 'tagline', 'CPU difficulty', root);
  const diff = make('div', 'menu-row', null, root);
  for (const d of DIFFICULTIES) {
    button(diff, d.toUpperCase(), () => actions.onChange({ ...config, difficulty: d }), `small${config.difficulty === d ? ' on' : ''}`);
  }
  make('p', 'tagline', 'Items and hazards', root);
  const extras = make('div', 'menu-row', null, root);
  button(extras, 'ON', () => actions.onChange({ ...config, extras: true }), `small${config.extras ? ' on' : ''}`);
  button(extras, 'OFF', () => actions.onChange({ ...config, extras: false }), `small${config.extras ? '' : ' on'}`);
  make('p', 'tagline', 'Arena', root);
  const arenas = make('div', 'menu-row', null, root);
  for (const a of ARENA_ORDER) {
    button(arenas, ARENA_STYLES[a].label, () => actions.onChange({ ...config, arena: a }), `small${config.arena === a ? ' on' : ''}`);
  }
  const row = make('div', 'menu-row', null, root);
  button(row, 'START BRAWL', actions.onStart, 'primary');
  button(row, 'Back', actions.onBack, 'small');
  focusFirst(root);
  return { root };
}
