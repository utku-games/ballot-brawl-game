/**
 * Selection screens: choosing a story category, and choosing a fighter from a grid of cards.
 * The category cards show the boss waiting at the top of each ladder and the best score so far.
 * The fighter grid is reused by story mode (one category, no bosses) and brawl setup (everyone, plus Random).
 */
import { make } from '@utku/engine';
import { bossOf, CATEGORY_LABEL, CATEGORY_ORDER } from '../../roster/roster';
import { Category, type FighterDef } from '../../roster/rosterTypes';
import { button, fighterCard, focusFirst, openScreen, portrait, type Screen } from '../screenKit';

const CATEGORY_BLURB: Readonly<Record<Category, string>> = {
  [Category.Politicians]: 'Presidents, prime ministers and party leaders.',
  [Category.Tycoons]: 'Billionaires, moguls and founders.',
  [Category.Legends]: 'Scientists, artists, rulers and icons of history.',
  [Category.Celebrities]: 'Pop stars, athletes, actors and screen icons.',
  [Category.Specials]: 'Animals and other surprises.',
};

export function categoryScreen(
  parent: HTMLElement,
  best: Partial<Record<Category, { score: number; rank: string }>>,
  onPick: (c: Category) => void,
  onBack: () => void,
): Screen {
  const root = openScreen(parent, false);
  make('h2', '', 'Choose your league', root);
  make('p', '', 'Beat ten opponents in a row. The last one is the boss.', root);
  const grid = make('div', 'grid', null, root);
  for (const category of CATEGORY_ORDER) {
    const boss = bossOf(category);
    const card = button(grid, '', () => onPick(category), 'card boss');
    portrait(card, boss.id, boss.name);
    make('div', 'card-name', CATEGORY_LABEL[category], card);
    make('div', 'card-nick', CATEGORY_BLURB[category], card);
    make('div', 'card-nick', `Boss: ${boss.name}`, card);
    const b = best[category];
    make('div', 'card-best', b ? `Best: ${b.score} (${b.rank})` : 'Not beaten yet', card);
  }
  button(root, 'Back', onBack, 'small');
  focusFirst(root);
  return { root };
}

export interface PickOptions {
  title: string;
  fighters: readonly FighterDef[];
  allowRandom: boolean;
}

export function fighterPickScreen(parent: HTMLElement, opts: PickOptions, onPick: (id: string | null) => void, onBack: () => void): Screen {
  const root = openScreen(parent, false);
  make('h2', '', opts.title, root);
  const grid = make('div', 'grid', null, root);
  if (opts.allowRandom) {
    const random = button(grid, '', () => onPick(null), 'card');
    make('div', 'card-name', 'Random', random);
    make('div', 'card-nick', 'Surprise me', random);
  }
  for (const def of opts.fighters) fighterCard(grid, def, () => onPick(def.id));
  button(root, 'Back', onBack, 'small');
  focusFirst(root);
  return { root };
}
