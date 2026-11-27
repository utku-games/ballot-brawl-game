/**
 * Tests for reading a match plan's players: a plan uses Player 2 only when some slot starts under Player 2's control.
 * The controls legend relies on this to show both players' keys in local two-player matches.
 * Plans are built inline, so no modes or rendering are involved.
 */
import { describe, expect, it } from 'vitest';
import { PlayerId } from '../input/controlFrame';
import { ArenaKind } from '../view/arenaKinds';
import { PLAIN_FIGHT, usesPlayerTwo, type MatchPlan, type SlotPlan } from './matchPlan';

const CPU_LEVEL = 0.5;
const SEED = 3;

function slot(fighterId: string, player: PlayerId | null): SlotPlan {
  return { fighterId, player, cpuLevel: CPU_LEVEL, damageScale: 1, boss: false };
}

function plan(teams: SlotPlan[][]): MatchPlan {
  return { ...PLAIN_FIGHT, teams, arena: ArenaKind.Parliament, seed: SEED };
}

describe('usesPlayerTwo', () => {
  it('is false for a fight against the CPU', () => {
    expect(usesPlayerTwo(plan([[slot('goat', PlayerId.One)], [slot('pig', null)]]))).toBe(false);
  });

  it('is true when Player 2 starts on any slot, even a teammate further down', () => {
    expect(usesPlayerTwo(plan([[slot('goat', PlayerId.One)], [slot('pig', null), slot('cow', PlayerId.Two)]]))).toBe(true);
  });
});
