/**
 * Story mode screens: the ladder of ten opponents before each fight, and the end screens.
 * The ladder shows beaten, current and upcoming opponents with the boss last, plus the running score and lives left.
 * The victory screen announces "You saved the world!" with the score breakdown and rank; the game over screen offers a restart.
 */
import { make } from '@utku/engine';
import { fighterById } from '../../roster/roster';
import { currentStage, runScore, type StoryRun } from '../../story/storyRun';
import { button, focusFirst, openScreen, portrait, type Screen } from '../screenKit';

export const VICTORY_TEXT = 'YOU SAVED THE WORLD!';

export function ladderScreen(parent: HTMLElement, run: Readonly<StoryRun>, onFight: () => void, onQuit: () => void): Screen {
  const root = openScreen(parent, false);
  const stage = currentStage(run);
  const me = fighterById(run.fighterId);
  const foe = fighterById(stage.opponentId);
  make('h2', '', stage.boss ? 'FINAL BOSS' : `Stage ${run.stageIndex + 1} of ${run.stages.length}`, root);
  const vs = make('div', 'versus', null, root);
  portrait(vs, me.id, me.name);
  make('span', '', 'VS', vs);
  portrait(vs, foe.id, foe.name);
  make('p', 'tagline', `${me.name} vs ${foe.name}, "${foe.nickname}"`, root);
  const ladder = make('div', 'ladder', null, root);
  run.stages.forEach((s, i) => {
    const def = fighterById(s.opponentId);
    const state = i < run.stageIndex ? 'beaten' : i === run.stageIndex ? 'current' : '';
    const rung = make('div', `rung ${state} ${s.boss ? 'boss' : ''}`.trim(), null, ladder);
    portrait(rung, def.id, def.name);
    make('span', '', s.boss ? `BOSS: ${def.name}` : def.name, rung);
  });
  make('p', '', `Score so far: ${runScore(run).total}  |  Damage taken: ${run.totalDamage}  |  Lives: ${run.continuesLeft}`, root);
  const row = make('div', 'menu-row', null, root);
  button(row, 'FIGHT!', onFight, 'primary');
  button(row, 'Quit', onQuit, 'small');
  focusFirst(root);
  return { root };
}

function scoreTable(parent: HTMLElement, run: Readonly<StoryRun>): void {
  const s = runScore(run);
  const table = make('table', 'score-table', null, parent);
  const rows: Array<[string, string]> = [
    ['Stages cleared', `${run.stageIndex}`],
    ['Clear points', `+${s.clearPoints}`],
    ['Perfect fights', `+${s.perfectPoints}`],
    [`Damage taken (${run.totalDamage})`, `-${s.damagePenalty}`],
    ['Total', `${s.total}`],
  ];
  for (const [label, value] of rows) {
    const tr = make('tr', '', null, table);
    make('td', '', label, tr);
    make('td', '', value, tr);
  }
}

/** The end of a story run; `unlocked` names a boss the win just made playable, or null. */
export function storyEndScreen(parent: HTMLElement, run: Readonly<StoryRun>, won: boolean, newBest: boolean, unlocked: string | null, onDone: () => void): Screen {
  const root = openScreen(parent, false);
  make('h1', '', won ? VICTORY_TEXT : 'GAME OVER', root);
  if (won) make('p', 'tagline', `${fighterById(run.fighterId).name} beat the whole ladder.`, root);
  make('div', 'rank', runScore(run).rank, root);
  scoreTable(root, run);
  if (newBest) make('p', 'tagline', 'New best score!', root);
  if (unlocked) make('p', 'tagline', `Unlocked: ${unlocked} is now playable in Brawl and Party!`, root);
  button(root, 'Continue', onDone, 'primary');
  focusFirst(root);
  return { root };
}

export function fightResultScreen(parent: HTMLElement, won: boolean, damage: number, continuesLeft: number, onNext: () => void, onQuit: () => void): Screen {
  const root = openScreen(parent, true);
  make('h2', '', won ? 'YOU WIN!' : 'YOU LOST', root);
  make('p', 'tagline', `Damage taken this fight: ${damage}`, root);
  if (!won) make('p', '', continuesLeft === 1 ? 'Last life: one more loss ends the run.' : `Lives left: ${continuesLeft}`, root);
  const row = make('div', 'menu-row', null, root);
  button(row, won ? 'Next' : 'Retry', onNext, 'primary');
  button(row, 'Quit', onQuit, 'small');
  focusFirst(root);
  return { root };
}
