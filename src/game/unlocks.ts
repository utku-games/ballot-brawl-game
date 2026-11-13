/**
 * Unlock rules and trophy progress, as pure functions of the saved progress.
 * A league's boss becomes playable in Brawl and Party once the player has won that league's story; everyone else is
 * always open, the Specials included.
 * The trophy summary counts leagues won, rivalries settled and bosses unlocked for the Trophies screen.
 */
import { RIVALRIES } from '../rivalry/rivalries';
import { bossOf, CATEGORY_LABEL, CATEGORY_ORDER } from '../roster/roster';
import type { Category, FighterDef } from '../roster/rosterTypes';

/** The parts of the save that unlocks read. */
export interface Progress {
  leaguesWon: readonly Category[];
  rivalriesWon: readonly string[];
}

/** Why a fighter is locked, or null when they can be picked. */
export function lockReason(def: Readonly<FighterDef>, progress: Readonly<Progress>): string | null {
  if (!def.boss || progress.leaguesWon.includes(def.category)) return null;
  return `Win the ${CATEGORY_LABEL[def.category]} story to unlock`;
}

/** The boss a league win unlocks, or null when it was already unlocked. */
export function newlyUnlocked(category: Category, before: Readonly<Progress>): FighterDef | null {
  return before.leaguesWon.includes(category) ? null : bossOf(category);
}

export interface Trophies {
  leaguesWon: number;
  leagues: number;
  rivalriesSettled: number;
  rivalries: number;
  bossesUnlocked: number;
}

export function trophies(progress: Readonly<Progress>): Trophies {
  const won = CATEGORY_ORDER.filter((c) => progress.leaguesWon.includes(c)).length;
  const settled = RIVALRIES.filter((r) => progress.rivalriesWon.includes(r.id)).length;
  return { leaguesWon: won, leagues: CATEGORY_ORDER.length, rivalriesSettled: settled, rivalries: RIVALRIES.length, bossesUnlocked: won };
}
