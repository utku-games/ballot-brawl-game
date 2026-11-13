/**
 * Edge-case tests for ring-outs: knockback that stops just inside the edge, corners, whole teams going over, and guard states.
 * It also covers the last tick of the timer, projectile finishers and walls staying in force for non-knocked fighters.
 * Every test places fighters by hand on an open platform and steps the deterministic simulation.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_HALF_DEPTH, ARENA_HALF_WIDTH } from '../core/arena';
import { FinisherStyle } from '../roster/signatureTypes';
import { METER_MAX } from './fightConstants';
import { ActionKind, EndReason, IDLE_INPUT, MatchPhase, type MatchState } from './fightTypes';
import { createMatch } from './matchSetup';
import { entries, input, run, styled, tap } from './testFight';

function platform(perTeam: number): MatchState {
  return createMatch({ teams: [entries(perTeam), entries(perTeam)], extras: false, seed: 0, ringOuts: true });
}

function knocked(kind: ActionKind, x: number, z: number, pushX: number, pushZ: number) {
  return { kind, frame: 0, duration: 60, move: null, hitIds: [] as string[], x, z, pushX, pushZ };
}

function setKnock(s: MatchState, i: number, kind: ActionKind, x: number, z: number, pushX: number, pushZ: number): void {
  const f = s.fighters[i];
  const k = knocked(kind, x, z, pushX, pushZ);
  f.action = { kind: k.kind, frame: 0, duration: 60, move: null, hitIds: [] };
  f.x = k.x; f.z = k.z; f.pushX = k.pushX; f.pushZ = k.pushZ;
}

describe('ring-outs edge cases', () => {
  it.each([ActionKind.Hitstun, ActionKind.Knockdown, ActionKind.GuardBroken])('rings out a fighter in %s knocked past the edge', (kind) => {
    const s = platform(1);
    s.fighters[0].x = -3;
    setKnock(s, 1, kind, ARENA_HALF_WIDTH - 0.1, 0, 30, 0);
    const { state, events } = run(s, 5, [IDLE_INPUT, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'ringOut')).toBe(true);
    expect(events).toContainEqual({ kind: 'ko', target: 't1s0', by: 'ringout' });
    expect(state.phase).toBe(MatchPhase.Over);
  });

  it.each([ActionKind.Defend, ActionKind.Taunt, ActionKind.Idle, ActionKind.Attack])('does not ring out a fighter in %s pushed past the edge', (kind) => {
    const s = platform(1);
    s.fighters[0].x = -3;
    setKnock(s, 1, kind, ARENA_HALF_WIDTH - 0.1, 0, 30, 0);
    const { state, events } = run(s, 5, [IDLE_INPUT, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'ringOut')).toBe(false);
    expect(state.fighters[1].x).toBeLessThanOrEqual(ARENA_HALF_WIDTH);
  });

  it('rings out through a corner', () => {
    const s = platform(1);
    s.fighters[0].x = -3;
    setKnock(s, 1, ActionKind.Hitstun, ARENA_HALF_WIDTH - 0.2, ARENA_HALF_DEPTH - 0.2, 20, 20);
    const { events } = run(s, 5, [IDLE_INPUT, IDLE_INPUT]);
    expect(events.filter((e) => e.kind === 'ringOut')).toHaveLength(1);
  });

  it('pulls a fighter back in when knockback stops just inside the edge and hitstun ends', () => {
    const s = platform(1);
    s.fighters[0].x = -3;
    setKnock(s, 1, ActionKind.Hitstun, ARENA_HALF_WIDTH - 0.05, 0, 0, 0);
    s.fighters[1].action.duration = 3;
    const { state, events } = run(s, 10, [IDLE_INPUT, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'ringOut')).toBe(false);
    expect(state.fighters[1].ringedOut).toBe(false);
    expect(state.fighters[1].action.kind).toBe(ActionKind.Idle);
    expect(state.fighters[1].x).toBeLessThan(ARENA_HALF_WIDTH);
  });

  it('ends a 4v4 once a whole team is rung out, and rung-out fighters stay inert', () => {
    const s = platform(4);
    s.fighters.forEach((f, i) => { f.x = f.team === 0 ? -6 : 6; f.z = -3 + i % 4 * 2; });
    for (const i of [4, 5, 6, 7]) setKnock(s, i, ActionKind.Hitstun, 7.9, s.fighters[i].z, 40, 0);
    const { state, events } = run(s, 8, s.fighters.map(() => IDLE_INPUT));
    expect(events.filter((e) => e.kind === 'ringOut')).toHaveLength(4);
    expect(state.phase).toBe(MatchPhase.Over);
    expect(events.find((e) => e.kind === 'matchOver')).toMatchObject({ winner: 0, reason: EndReason.KnockOut });
    const xs = state.fighters.slice(4).map((f) => f.x);
    const later = run(state, 20, s.fighters.map(() => IDLE_INPUT)).state.fighters.slice(4).map((f) => f.x);
    expect(later.every((x) => x > ARENA_HALF_WIDTH)).toBe(true);
    expect(xs.length).toBe(4);
  });

  it('counts a ring-out on the very last tick of the timer as a knockout', () => {
    const s = platform(1);
    s.ticksLeft = 1;
    s.fighters[0].x = -3;
    setKnock(s, 1, ActionKind.Hitstun, ARENA_HALF_WIDTH - 0.1, 0, 30, 0);
    const { events } = run(s, 1, [IDLE_INPUT, IDLE_INPUT]);
    expect(events.find((e) => e.kind === 'matchOver')).toMatchObject({ winner: 0, reason: EndReason.KnockOut });
  });

  it('rung-out fighters are not pushed by the living and take no hits', () => {
    const s = platform(2);
    s.fighters.forEach((f, i) => { f.x = -6; f.z = i; });
    setKnock(s, 1, ActionKind.Hitstun, ARENA_HALF_WIDTH - 0.1, 0, 30, 0);
    s.fighters[1].team = 0;
    const out = run(s, 3, s.fighters.map(() => IDLE_INPUT)).state;
    expect(out.fighters[1].ringedOut).toBe(true);
    const f = out.fighters[1];
    f.pushX = 0;
    const g = out.fighters[2];
    g.x = f.x + 0.1; g.z = f.z; g.facingX = -1;
    g.action = { kind: ActionKind.Idle, frame: 0, duration: 0, move: null, hitIds: [] };
    const after = tap(out, 30, [IDLE_INPUT, IDLE_INPUT, input({ punch: true }), IDLE_INPUT]).state;
    expect(after.fighters[1].x).toBeCloseTo(f.x, 5);
    expect(after.fighters[1].damageTaken).toBe(f.damageTaken);
  });

  it('a projectile finisher near the edge rings out its target', () => {
    const s = platform(1);
    const [a, b] = s.fighters;
    a.profile = styled(FinisherStyle.Throw);
    a.meter = METER_MAX;
    a.x = 2; b.x = 7.5; a.facingX = 1; b.facingX = -1;
    b.profile = { ...b.profile, maxHealth: 999 }; b.health = 999;
    const { events } = tap(s, 120, [input({ special: true }), IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'hit')).toBe(true);
    expect(events.some((e) => e.kind === 'ringOut')).toBe(true);
  });

  it('is unchanged with ring-outs off: knocked fighters stay inside the walls', () => {
    const s = { ...platform(1), ringOuts: false };
    s.fighters[0].x = -3;
    setKnock(s, 1, ActionKind.Hitstun, ARENA_HALF_WIDTH - 0.1, 0, 30, 0);
    const { state, events } = run(s, 5, [IDLE_INPUT, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'ringOut')).toBe(false);
    expect(state.fighters[1].x).toBeLessThanOrEqual(ARENA_HALF_WIDTH);
  });
});
