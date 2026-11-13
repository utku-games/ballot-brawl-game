/**
 * The Trophies screen: story leagues won, rivalries settled and the bosses those wins unlocked.
 * Every league shows its boss portrait, in colour once beaten and greyed out with a hint until then.
 * It only reads the saved progress through the pure unlock rules.
 */
import { make } from '@utku/engine';
import { lockReason, trophies, type Progress } from '../../game/unlocks';
import { bossOf, CATEGORY_LABEL, CATEGORY_ORDER } from '../../roster/roster';
import { button, focusFirst, openScreen, portrait, type Screen } from '../screenKit';

export function trophiesScreen(parent: HTMLElement, progress: Readonly<Progress>, onBack: () => void): Screen {
  const root = openScreen(parent, false);
  make('h2', '', 'Trophies', root);
  const t = trophies(progress);
  make('p', 'tagline', `Leagues won: ${t.leaguesWon} / ${t.leagues}`, root);
  make('p', 'tagline', `Rivalries settled: ${t.rivalriesSettled} / ${t.rivalries}`, root);
  make('p', 'tagline', `Bosses unlocked: ${t.bossesUnlocked} / ${t.leagues}`, root);
  const grid = make('div', 'grid', null, root);
  for (const category of CATEGORY_ORDER) {
    const boss = bossOf(category);
    const reason = lockReason(boss, progress);
    const card = make('div', `card boss${reason ? ' locked' : ''}`, null, grid);
    portrait(card, boss.id, boss.name);
    make('div', 'card-name', CATEGORY_LABEL[category], card);
    make('div', 'card-nick', boss.name, card);
    make('div', 'card-best', reason ?? 'Unlocked', card);
  }
  button(root, 'Back', onBack, 'small');
  focusFirst(root);
  return { root };
}
