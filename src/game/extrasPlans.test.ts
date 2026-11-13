/**
 * Tests that only Brawl turns items and hazards on, and that the flag reaches the simulation setup.
 * Story and Rivalry plans must have extras off so those fights stay even, and Brawl honours its toggle.
 * The setup built from a plan carries the extras flag and the plan seed into the match.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '@utku/engine';
import { Difficulty } from '../ai/aiProfile';
import { RIVALRIES } from '../rivalry/rivalries';
import { Category } from '../roster/rosterTypes';
import { buildLadder } from '../story/ladder';
import { startRun } from '../story/storyRun';
import { ArenaKind } from '../view/arenaKinds';
import { defaultBrawl, toMatchPlan } from './brawlConfig';
import { buildMatchSetup } from './matchPlan';
import { RivalrySide, rivalryMatchPlan } from './rivalryPlan';
import { storyMatchPlan } from './storyPlan';

describe('extras in match plans', () => {
  it('is on by default in Brawl, follows the toggle, and reaches the setup', () => {
    const on = toMatchPlan(defaultBrawl(ArenaKind.Museum), createRng(1));
    expect(on.extras).toBe(true);
    const setup = buildMatchSetup(on);
    expect(setup.extras).toBe(true);
    expect(setup.seed).toBe(on.seed);
    const off = toMatchPlan({ ...defaultBrawl(ArenaKind.Museum), extras: false }, createRng(1));
    expect(buildMatchSetup(off).extras).toBe(false);
  });

  it('is off in Story and in every Rivalry on both sides', () => {
    const ladder = buildLadder(Category.Tycoons, 'elon-musk', createRng(3));
    expect(storyMatchPlan(startRun(Category.Tycoons, 'elon-musk', ladder), 0).extras).toBe(false);
    for (const r of RIVALRIES) {
      for (const side of [RivalrySide.Left, RivalrySide.Right]) {
        expect(rivalryMatchPlan(r, side, Difficulty.Normal, 5).extras).toBe(false);
      }
    }
  });
});
