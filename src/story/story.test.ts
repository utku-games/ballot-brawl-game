/**
 * Tests for the story ladder, the run state machine and scoring.
 * The ladder must be ten fights of rising difficulty ending with the boss and never include the player.
 * Scores must drop with damage taken, and a run must handle wins, continues and the final victory.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '@utku/engine';
import { InvalidStateError, MatchSetupError } from '../core/errors';
import { bossOf } from '../roster/roster';
import { Category } from '../roster/rosterTypes';
import { buildLadder, LADDER_LENGTH } from './ladder';
import { PERFECT_BONUS, Rank, rankFor, scoreRun, stagePoints } from './scoring';
import { recordFight, RunStatus, runScore, startRun, STORY_CONTINUES } from './storyRun';

const PLAYER = 'keir-starmer';
const SEED = 3;
const ladder = buildLadder(Category.Politicians, PLAYER, createRng(SEED));

describe('buildLadder', () => {
  it('has ten unique opponents, excludes the player and ends with the boss', () => {
    expect(ladder).toHaveLength(LADDER_LENGTH);
    expect(new Set(ladder.map((s) => s.opponentId)).size).toBe(LADDER_LENGTH);
    expect(ladder.some((s) => s.opponentId === PLAYER)).toBe(false);
    expect(ladder[LADDER_LENGTH - 1].opponentId).toBe(bossOf(Category.Politicians).id);
    expect(ladder[LADDER_LENGTH - 1].boss).toBe(true);
  });

  it('gets harder every step', () => {
    for (let i = 1; i < ladder.length; i += 1) {
      expect(ladder[i].level).toBeGreaterThan(ladder[i - 1].level);
      expect(ladder[i].damageScale).toBeGreaterThan(ladder[i - 1].damageScale);
    }
  });

  it('is reproducible from the seed and rejects bosses or other categories', () => {
    expect(buildLadder(Category.Politicians, PLAYER, createRng(SEED))).toEqual(ladder);
    expect(() => buildLadder(Category.Politicians, 'winston-churchill', createRng(SEED))).toThrow(MatchSetupError);
    expect(() => buildLadder(Category.Tycoons, PLAYER, createRng(SEED))).toThrow(MatchSetupError);
  });
});

describe('scoring', () => {
  it('rewards clears and perfects and charges for damage', () => {
    const clean = scoreRun({ stagesCleared: 2, perfects: 2, totalDamage: 0 });
    expect(clean.total).toBe(stagePoints(0) + stagePoints(1) + 2 * PERFECT_BONUS);
    const hurt = scoreRun({ stagesCleared: 2, perfects: 0, totalDamage: 100 });
    expect(hurt.total).toBeLessThan(clean.total);
    expect(scoreRun({ stagesCleared: 0, perfects: 0, totalDamage: 9999 }).total).toBe(0);
    expect(scoreRun({ stagesCleared: 1, perfects: 0, totalDamage: -50 }).total).toBe(stagePoints(0));
    expect(scoreRun({ stagesCleared: 1, perfects: 0, totalDamage: Number.NaN }).total).toBe(stagePoints(0));
  });

  it('ranks by average damage per cleared stage', () => {
    expect(rankFor(10, 0)).toBe(Rank.S);
    expect(rankFor(10, 2000)).toBe(Rank.D);
    expect(rankFor(0, 0)).toBe(Rank.D);
  });
});

describe('story run', () => {
  it('wins after beating every stage', () => {
    let run = startRun(Category.Politicians, PLAYER, ladder);
    for (let i = 0; i < LADDER_LENGTH; i += 1) run = recordFight(run, { won: true, damageTaken: 10 });
    expect(run.status).toBe(RunStatus.Won);
    expect(run.totalDamage).toBe(10 * LADDER_LENGTH);
    expect(runScore(run).total).toBeGreaterThan(0);
    expect(() => recordFight(run, { won: true, damageTaken: 0 })).toThrow(InvalidStateError);
  });

  it('spends continues on losses, keeps their damage, then ends the run', () => {
    let run = startRun(Category.Politicians, PLAYER, ladder);
    run = recordFight(run, { won: false, damageTaken: 50 });
    expect(run.stageIndex).toBe(0);
    expect(run.continuesLeft).toBe(STORY_CONTINUES - 1);
    expect(run.totalDamage).toBe(50);
    for (let i = 1; i < STORY_CONTINUES - 1; i += 1) run = recordFight(run, { won: false, damageTaken: 1 });
    expect(run.status).toBe(RunStatus.Fighting);
    run = recordFight(run, { won: false, damageTaken: 1 });
    expect(run.status).toBe(RunStatus.Lost);
    expect(run.continuesLeft).toBe(0);
  });

  it('ends the run on exactly the third loss, with no extra fight', () => {
    let run = startRun(Category.Politicians, PLAYER, ladder);
    let fights = 0;
    while (run.status === RunStatus.Fighting) {
      run = recordFight(run, { won: false, damageTaken: 1 });
      fights += 1;
    }
    expect(fights).toBe(STORY_CONTINUES);
    expect(() => recordFight(run, { won: false, damageTaken: 1 })).toThrow(InvalidStateError);
  });
});
