/**
 * Tests for rivalry match plans and saved rivalry wins.
 * The player must get the chosen side on the left team and the CPU the other fighter, and the twist must reach the
 * combat profiles. A win is saved once, and old saves without the field still load.
 */
import { describe, expect, it } from 'vitest';
import { Difficulty } from '../ai/aiProfile';
import { RosterDataError } from '../core/errors';
import { PlayerId } from '../input/controlFrame';
import { RIVALRIES } from '../rivalry/rivalries';
import { Twist } from '../rivalry/rivalryTypes';
import { HEAVY_DAMAGE, TURBO_SPEED } from '../rivalry/twists';
import { buildMatchSetup } from './matchPlan';
import { RivalrySide, rivalryMatchPlan } from './rivalryPlan';
import { loadSave, recordRivalryWin } from './saveData';

const SEED = 42;

function byTwist(twist: Twist): (typeof RIVALRIES)[number] {
  const r = RIVALRIES.find((x) => x.twist === twist);
  if (!r) throw new RosterDataError(`no rivalry with ${twist}`);
  return r;
}

describe('rivalryMatchPlan', () => {
  it('puts the player on the chosen side against the other rival', () => {
    const r = RIVALRIES[0];
    const right = rivalryMatchPlan(r, RivalrySide.Right, Difficulty.Normal, SEED);
    expect(right.teams[0][0]).toMatchObject({ fighterId: r.right, player: PlayerId.One });
    expect(right.teams[1][0]).toMatchObject({ fighterId: r.left, player: null });
    expect(right.banner).toBe(r.title);
    expect(right.arena).toBe(r.arena);
  });

  it('applies the twist to both fighters', () => {
    const plain = buildMatchSetup({ ...rivalryMatchPlan(byTwist(Twist.Turbo), RivalrySide.Left, Difficulty.Normal, SEED), twist: Twist.None });
    const turbo = buildMatchSetup(rivalryMatchPlan(byTwist(Twist.Turbo), RivalrySide.Left, Difficulty.Normal, SEED));
    for (const t of [0, 1] as const) {
      expect(turbo.teams[t][0].profile.speedScale).toBeCloseTo(plain.teams[t][0].profile.speedScale * TURBO_SPEED, 6);
    }
    const r = byTwist(Twist.HeavyHitters);
    const heavy = buildMatchSetup(rivalryMatchPlan(r, RivalrySide.Left, Difficulty.Normal, SEED));
    const calm = buildMatchSetup({ ...rivalryMatchPlan(r, RivalrySide.Left, Difficulty.Normal, SEED), twist: Twist.None });
    expect(heavy.teams[1][0].profile.damageScale).toBeCloseTo(calm.teams[1][0].profile.damageScale * HEAVY_DAMAGE, 6);
  });
});

describe('rivalry wins', () => {
  it('records a win once', () => {
    const save = { best: {}, rivalriesWon: [], leaguesWon: [], muted: false };
    expect(recordRivalryWin(save, 'currents')).toBe(true);
    expect(recordRivalryWin(save, 'currents')).toBe(false);
    expect(save.rivalriesWon).toEqual(['currents']);
  });

  it('loads an old save without rivalry wins', () => {
    expect(loadSave().rivalriesWon).toEqual([]);
  });
});
