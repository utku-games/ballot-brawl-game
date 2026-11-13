/**
 * Tests for Party setup: the default four-way party, changing the number of sides, and the Player 2 rule.
 * Random picks must never repeat, and the plan must give every side exactly one fighter.
 * The arena's ring-outs and the items toggle must reach the match setup.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '@utku/engine';
import { PlayerId } from '../input/controlFrame';
import { ArenaKind } from '../view/arenaKinds';
import { Controller, defaultParty, PARTY_MAX_SIDES, PARTY_MIN_SIDES, setPartySides, toMatchPlan, togglePlayerTwo } from './brawlConfig';
import { buildMatchSetup } from './matchPlan';

const SEED = 5;

describe('party setup', () => {
  it('starts as Player 1 against three CPU fighters with items on', () => {
    const p = defaultParty(ArenaKind.Rooftop);
    expect(p.teams).toHaveLength(PARTY_MAX_SIDES);
    expect(p.teams.every((t) => t.length === 1)).toBe(true);
    expect(p.teams[0][0].controller).toBe(Controller.P1);
    expect(p.extras).toBe(true);
  });

  it('clamps the number of sides and keeps Player 1', () => {
    const p = defaultParty(ArenaKind.Studio);
    expect(setPartySides(p, 2).teams).toHaveLength(PARTY_MIN_SIDES);
    expect(setPartySides(p, 9).teams).toHaveLength(PARTY_MAX_SIDES);
    expect(setPartySides(p, 3).teams[0][0].controller).toBe(Controller.P1);
  });

  it('allows only one Player 2', () => {
    let p = togglePlayerTwo(defaultParty(ArenaKind.Studio), 1, 0);
    p = togglePlayerTwo(p, 2, 0);
    expect(p.teams.flat().filter((s) => s.controller === Controller.P2)).toHaveLength(1);
    expect(p.teams[2][0].controller).toBe(Controller.P2);
  });

  it('plans one distinct fighter per side and carries ring-outs and items', () => {
    const plan = toMatchPlan(togglePlayerTwo(defaultParty(ArenaKind.Rooftop), 3, 0), createRng(SEED));
    expect(plan.teams).toHaveLength(PARTY_MAX_SIDES);
    expect(new Set(plan.teams.flat().map((s) => s.fighterId)).size).toBe(PARTY_MAX_SIDES);
    expect(plan.teams[0][0].player).toBe(PlayerId.One);
    expect(plan.teams[3][0].player).toBe(PlayerId.Two);
    const setup = buildMatchSetup(plan);
    expect(setup.ringOuts).toBe(true);
    expect(setup.extras).toBe(true);
    expect(setup.teams).toHaveLength(PARTY_MAX_SIDES);
  });
});
