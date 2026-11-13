/**
 * Tests for brawl setup and story match plans.
 * Brawl teams resize within 1..4, Player 1 is fixed, Player 2 is unique, and Random picks never repeat a fighter.
 * Story plans put the player alone against the stage opponent with the stage's difficulty.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '@utku/engine';
import { Difficulty, DIFFICULTY_LEVEL } from '../ai/aiProfile';
import { MAX_TEAM_SIZE } from '../fight/fightConstants';
import { PlayerId } from '../input/controlFrame';
import { Category } from '../roster/rosterTypes';
import { buildLadder } from '../story/ladder';
import { recordFight, startRun } from '../story/storyRun';
import { ArenaKind } from '../view/arenaKinds';
import { Controller, defaultBrawl, setFighter, setTeamSize, toMatchPlan, togglePlayerTwo } from './brawlConfig';
import { storyMatchPlan } from './storyPlan';

const rng = (): (() => number) => createRng(11);

describe('brawl config', () => {
  it('resizes teams within 1..4 and keeps Player 1', () => {
    let c = setTeamSize(defaultBrawl(ArenaKind.Museum), 0, 9);
    expect(c.teams[0]).toHaveLength(MAX_TEAM_SIZE);
    expect(c.teams[0][0].controller).toBe(Controller.P1);
    c = setTeamSize(c, 1, 0);
    expect(c.teams[1]).toHaveLength(1);
  });

  it('allows a single Player 2 and never moves Player 1', () => {
    let c = setTeamSize(setTeamSize(defaultBrawl(ArenaKind.Museum), 0, 2), 1, 2);
    c = togglePlayerTwo(c, 1, 0);
    c = togglePlayerTwo(c, 1, 1);
    expect(c.teams.flat().filter((s) => s.controller === Controller.P2)).toHaveLength(1);
    expect(togglePlayerTwo(c, 0, 0).teams[0][0].controller).toBe(Controller.P1);
  });

  it('builds a 4v4 plan with unique random fighters and the chosen difficulty', () => {
    let c = setTeamSize(setTeamSize(defaultBrawl(ArenaKind.Parliament), 0, 4), 1, 4);
    c = setFighter(c, 1, 3, 'napoleon-bonaparte');
    c = { ...c, difficulty: Difficulty.Hard };
    const plan = toMatchPlan(c, rng());
    const ids = plan.teams.flat().map((s) => s.fighterId);
    expect(new Set(ids).size).toBe(8);
    expect(plan.teams[1][3].fighterId).toBe('napoleon-bonaparte');
    expect(plan.teams[0][0].player).toBe(PlayerId.One);
    expect(plan.teams[1][0].cpuLevel).toBe(DIFFICULTY_LEVEL[Difficulty.Hard]);
    expect(plan.arena).toBe(ArenaKind.Parliament);
  });
});

describe('story plan', () => {
  it('pits the player against the current stage opponent', () => {
    const ladder = buildLadder(Category.Tycoons, 'elon-musk', rng());
    let run = startRun(Category.Tycoons, 'elon-musk', ladder);
    run = recordFight(run, { won: true, damageTaken: 5 });
    const plan = storyMatchPlan(run, 0);
    expect(plan.teams[0]).toHaveLength(1);
    expect(plan.teams[1][0].fighterId).toBe(ladder[1].opponentId);
    expect(plan.teams[1][0].cpuLevel).toBe(ladder[1].level);
    expect(plan.arena).toBe(ArenaKind.TradingFloor);
  });
});
