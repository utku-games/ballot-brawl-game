/**
 * Rivalry Battles screens: the list of rivalries in two sections, and the side picker before a rivalry fight.
 * Each rivalry card shows both portraits, its title, tagline and twist, and a "Settled" mark once the player has won it.
 * The side picker lets the player fight as either rival, choose the CPU difficulty or share a challenge link to it.
 */
import { make } from '@utku/engine';
import { Difficulty } from '../../ai/aiProfile';
import { RivalrySide } from '../../game/rivalryPlan';
import { rivalriesIn } from '../../rivalry/rivalries';
import { RivalrySection, Twist, type Rivalry } from '../../rivalry/rivalryTypes';
import type { ShareCard } from '../../share/shareCards';
import { ShareKind } from '../../share/shareLink';
import { fighterById } from '../../roster/roster';
import { button, fighterCard, focusFirst, openScreen, portrait, type Screen } from '../screenKit';
import { shareChallengeButton, shareResultButton } from '../shareButtons';

const SECTION_TITLE: Readonly<Record<RivalrySection, string>> = {
  [RivalrySection.Rivalries]: 'Rivalries',
  [RivalrySection.SpecialEdition]: 'Special Edition',
};
const SECTION_ORDER: readonly RivalrySection[] = [RivalrySection.Rivalries, RivalrySection.SpecialEdition];
const TWIST_LABEL: Readonly<Record<Twist, string>> = {
  [Twist.None]: '',
  [Twist.Blackout]: 'Twist: Blackout',
  [Twist.Turbo]: 'Twist: Turbo',
  [Twist.HeavyHitters]: 'Twist: Heavy Hitters',
};
const DIFFICULTIES: readonly Difficulty[] = [Difficulty.Easy, Difficulty.Normal, Difficulty.Hard];

function rivalryCard(parent: HTMLElement, r: Readonly<Rivalry>, settled: boolean, onPick: () => void): void {
  const card = button(parent, '', onPick, 'card rivalry');
  const vs = make('div', 'pair', null, card);
  portrait(vs, r.left, fighterById(r.left).name);
  make('span', '', 'VS', vs);
  portrait(vs, r.right, fighterById(r.right).name);
  make('div', 'card-name', r.title, card);
  make('div', 'card-nick', r.tagline, card);
  if (r.twist !== Twist.None) make('div', 'card-nick', TWIST_LABEL[r.twist], card);
  make('div', 'card-best', settled ? 'Settled' : 'Unsettled', card);
}

export function rivalryListScreen(parent: HTMLElement, won: readonly string[], onPick: (r: Rivalry) => void, onBack: () => void): Screen {
  const root = openScreen(parent, false);
  make('h2', '', 'Rivalry Battles', root);
  make('p', '', 'Settle the famous feuds, one on one.', root);
  for (const section of SECTION_ORDER) {
    make('p', 'tagline', SECTION_TITLE[section], root);
    const grid = make('div', 'grid wide', null, root);
    for (const r of rivalriesIn(section)) rivalryCard(grid, r, won.includes(r.id), () => onPick(r));
  }
  button(root, 'Back', onBack, 'small');
  focusFirst(root);
  return { root };
}

export interface SidePickActions {
  onFight: (side: RivalrySide) => void;
  onDifficulty: (d: Difficulty) => void;
  onBack: () => void;
}

export function rivalrySideScreen(parent: HTMLElement, r: Readonly<Rivalry>, difficulty: Difficulty, actions: SidePickActions): Screen {
  const root = openScreen(parent, false);
  make('h2', '', r.title, root);
  make('p', 'tagline', r.tagline, root);
  if (r.twist !== Twist.None) make('p', '', TWIST_LABEL[r.twist], root);
  make('p', '', 'Pick your side', root);
  const grid = make('div', 'menu-row', null, root);
  fighterCard(grid, fighterById(r.left), () => actions.onFight(RivalrySide.Left));
  fighterCard(grid, fighterById(r.right), () => actions.onFight(RivalrySide.Right));
  make('p', 'tagline', 'CPU difficulty', root);
  const diff = make('div', 'menu-row', null, root);
  for (const d of DIFFICULTIES) {
    button(diff, d.toUpperCase(), () => actions.onDifficulty(d), `small${difficulty === d ? ' on' : ''}`);
  }
  const foot = make('div', 'menu-row', null, root);
  button(foot, 'Back', actions.onBack, 'small');
  shareChallengeButton(foot, `Settle ${r.title} with me in Ballot Brawl.`, { kind: ShareKind.Rivalry, rivalryId: r.id });
  focusFirst(root);
  return { root };
}

export interface RivalryResultActions {
  onAgain: () => void;
  onList: () => void;
  onMenu: () => void;
}

export function rivalryResultScreen(parent: HTMLElement, won: boolean, card: Readonly<ShareCard>, actions: RivalryResultActions): Screen {
  const root = openScreen(parent, true);
  make('h2', '', won ? 'RIVALRY SETTLED!' : 'RIVALRY CONTINUES...', root);
  const col = make('div', 'menu-col', null, root);
  button(col, 'Rematch', actions.onAgain, 'primary');
  shareResultButton(col, card);
  button(col, 'Other rivalries', actions.onList);
  button(col, 'Main menu', actions.onMenu);
  focusFirst(root);
  return { root };
}
