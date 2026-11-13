/**
 * The state of one story run and how a fight result moves it forward.
 * A win advances to the next stage (and finishes the run after the boss); a loss spends a continue or ends the run.
 * Damage from every attempt is kept so the final score reflects the whole climb.
 */
import { InvalidStateError } from '../core/errors';
import type { Category } from '../roster/rosterTypes';
import type { StoryStage } from './ladder';
import { safeDamage, scoreRun, type ScoreBreakdown } from './scoring';

/** Retries allowed after a lost fight before the run ends. */
export const STORY_CONTINUES = 3;

export enum RunStatus {
  Fighting = 'fighting',
  Won = 'won',
  Lost = 'lost',
}

export interface StoryRun {
  category: Category;
  fighterId: string;
  stages: readonly StoryStage[];
  stageIndex: number;
  totalDamage: number;
  perfects: number;
  continuesLeft: number;
  status: RunStatus;
}

export interface FightResult {
  won: boolean;
  damageTaken: number;
}

export function startRun(category: Category, fighterId: string, stages: readonly StoryStage[]): StoryRun {
  return {
    category, fighterId, stages, stageIndex: 0, totalDamage: 0, perfects: 0,
    continuesLeft: STORY_CONTINUES, status: RunStatus.Fighting,
  };
}

export function currentStage(run: Readonly<StoryRun>): StoryStage {
  const stage = run.stages[run.stageIndex];
  if (!stage) throw new InvalidStateError(`Story run has no stage ${run.stageIndex}`);
  return stage;
}

export function recordFight(run: Readonly<StoryRun>, result: Readonly<FightResult>): StoryRun {
  if (run.status !== RunStatus.Fighting) throw new InvalidStateError('The story run is already over');
  const damage = safeDamage(result.damageTaken);
  const totalDamage = run.totalDamage + damage;
  if (result.won) {
    const stageIndex = run.stageIndex + 1;
    const perfects = run.perfects + (damage <= 0 ? 1 : 0);
    const status = stageIndex >= run.stages.length ? RunStatus.Won : RunStatus.Fighting;
    return { ...run, stageIndex, totalDamage, perfects, status };
  }
  if (run.continuesLeft > 0) return { ...run, totalDamage, continuesLeft: run.continuesLeft - 1 };
  return { ...run, totalDamage, status: RunStatus.Lost };
}

export function runScore(run: Readonly<StoryRun>): ScoreBreakdown {
  return scoreRun({ stagesCleared: run.stageIndex, perfects: run.perfects, totalDamage: run.totalDamage });
}
