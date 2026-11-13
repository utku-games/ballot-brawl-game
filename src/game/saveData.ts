/**
 * Saved progress: the best story score and rank per category, plus the mute setting, kept in local storage.
 * Reading tolerates missing or corrupt data by falling back to empty records, so a private window still plays.
 * Writes go through the engine storage helpers, which swallow quota and access errors.
 */
import { browserStorage, readJson, writeJson } from '@utku/engine';
import type { Category } from '../roster/rosterTypes';
import type { ScoreBreakdown } from '../story/scoring';

const SAVE_KEY = 'ballot-brawl-save-v1';

export interface BestScore {
  score: number;
  rank: string;
  fighterId: string;
}

export interface SaveData {
  best: Partial<Record<Category, BestScore>>;
  muted: boolean;
}

const EMPTY_SAVE: Readonly<SaveData> = { best: {}, muted: false };

export function loadSave(): SaveData {
  const data = readJson<SaveData>(browserStorage(), SAVE_KEY, EMPTY_SAVE);
  return { best: { ...(data.best ?? {}) }, muted: data.muted === true };
}

export function storeSave(data: Readonly<SaveData>): void {
  writeJson(browserStorage(), SAVE_KEY, data);
}

/** Records a finished run; returns true when it beat the previous best for its category. */
export function recordBest(data: SaveData, category: Category, fighterId: string, score: Readonly<ScoreBreakdown>): boolean {
  const previous = data.best[category];
  if (previous && previous.score >= score.total) return false;
  data.best[category] = { score: score.total, rank: score.rank, fighterId };
  storeSave(data);
  return true;
}
