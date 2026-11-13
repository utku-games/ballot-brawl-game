/**
 * Tests that ring-outs follow the arena: only The Rooftop has them, in Brawl or anywhere a plan names it.
 * Story and Rivalry plans use their own walled arenas, so they never have ring-outs.
 * The flag must reach the simulation's match setup.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '@utku/engine';
import { Difficulty } from '../ai/aiProfile';
import { RIVALRIES } from '../rivalry/rivalries';
import { ARENA_ORDER, arenaHasRingOuts, ArenaKind } from '../view/arenaKinds';
import { defaultBrawl, toMatchPlan } from './brawlConfig';
import { buildMatchSetup } from './matchPlan';
import { RivalrySide, rivalryMatchPlan } from './rivalryPlan';

const SEED = 9;

describe('ring-out arenas', () => {
  it('gives ring-outs to The Rooftop only', () => {
    expect(ARENA_ORDER.filter(arenaHasRingOuts)).toEqual([ArenaKind.Rooftop]);
  });

  it('carries the flag from a Brawl plan into the match setup', () => {
    const rooftop = buildMatchSetup(toMatchPlan(defaultBrawl(ArenaKind.Rooftop), createRng(SEED)));
    const chamber = buildMatchSetup(toMatchPlan(defaultBrawl(ArenaKind.Parliament), createRng(SEED)));
    expect(rooftop.ringOuts).toBe(true);
    expect(chamber.ringOuts).toBe(false);
  });

  it('keeps every rivalry on a walled arena', () => {
    for (const r of RIVALRIES) {
      expect(buildMatchSetup(rivalryMatchPlan(r, RivalrySide.Left, Difficulty.Normal, SEED)).ringOuts, r.id).toBe(false);
    }
  });
});
