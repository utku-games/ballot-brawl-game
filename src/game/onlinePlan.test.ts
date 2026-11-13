/**
 * Tests for online duel plans: both sides build the same fighters, arena, items and seed.
 * The host's fighter is on the left, and each page controls its own fighter as Player 1.
 * The setups built from the two plans are identical, so the guest's first frame matches the host's.
 */
import { describe, expect, it } from 'vitest';
import { PlayerId } from '../input/controlFrame';
import type { StartInfo } from '../net/protocol';
import { ArenaKind } from '../view/arenaKinds';
import { NetRole } from './matchNet';
import { buildMatchSetup, initialAssignment } from './matchPlan';
import { onlineMatchPlan } from './onlinePlan';

const INFO: StartInfo = { hostFighter: 'goat', guestFighter: 'pig', arena: ArenaKind.Rooftop, extras: false, seed: 9 };

describe('online plans', () => {
  it('puts the host left and gives each page Player 1 on its own fighter', () => {
    const host = onlineMatchPlan(INFO, NetRole.Host);
    const guest = onlineMatchPlan(INFO, NetRole.Guest);
    expect(host.teams.map((t) => t[0].fighterId)).toEqual(['goat', 'pig']);
    expect(initialAssignment(host).get(PlayerId.One)).toBe(initialAssignment(guest).get(PlayerId.Two));
    expect(initialAssignment(guest).get(PlayerId.One)).toBe(initialAssignment(host).get(PlayerId.Two));
  });

  it('builds identical setups on both sides', () => {
    expect(buildMatchSetup(onlineMatchPlan(INFO, NetRole.Guest))).toEqual(buildMatchSetup(onlineMatchPlan(INFO, NetRole.Host)));
    expect(onlineMatchPlan(INFO, NetRole.Host).extras).toBe(false);
  });
});
