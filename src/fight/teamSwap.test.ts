/**
 * Tests for choosing the next controlled teammate.
 * Swapping skips knocked-out fighters and teammates another player already controls.
 * A fully knocked-out team yields null.
 */
import { describe, expect, it } from 'vitest';
import { ActionKind } from './fightTypes';
import { createMatch } from './matchSetup';
import { nextTeammate } from './teamSwap';
import { entries, NO_EXTRAS } from './testFight';

const NONE = new Set<string>();

describe('nextTeammate', () => {
  it('cycles through living teammates', () => {
    const s = createMatch({ teams: [entries(3), entries(1)], ...NO_EXTRAS });
    expect(nextTeammate(s.fighters, 0, 't0s0', NONE)).toBe('t0s1');
    expect(nextTeammate(s.fighters, 0, 't0s2', NONE)).toBe('t0s0');
  });

  it('skips knocked-out and taken teammates', () => {
    const s = createMatch({ teams: [entries(3), entries(1)], ...NO_EXTRAS });
    s.fighters[1].action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
    expect(nextTeammate(s.fighters, 0, 't0s0', new Set(['t0s2']))).toBe('t0s0');
  });

  it('returns null when the team is down', () => {
    const s = createMatch({ teams: [entries(1), entries(1)], ...NO_EXTRAS });
    s.fighters[0].action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
    expect(nextTeammate(s.fighters, 0, 't0s0', NONE)).toBeNull();
  });
});
