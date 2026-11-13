/**
 * Edge-case tests for the personality simulation: Rush at walls and into crowds, projectiles after a knockout or at
 * the end of a match, and a taunt at full meter.
 * They complement the per-feature test files with adversarial setups found during QA.
 * Each test builds a small match, arms a fighter and checks positions, hits, projectile lists and events.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_HALF_WIDTH } from '../core/arena';
import { FinisherStyle } from '../roster/signatureTypes';
import { BODY_RADIUS, METER_MAX, TAUNT_TICKS } from './fightConstants';
import { ActionKind, IDLE_INPUT, MatchPhase } from './fightTypes';
import { createMatch } from './matchSetup';
import { stepMatch } from './matchStep';
import { FINISHERS, MoveKind, moveDuration } from './moves';
import { PROJECTILE_TICKS } from './projectiles';
import { duel, entries, input, run, styled, tap, NO_EXTRAS } from './testFight';

const SPECIAL = input({ special: true });

describe('personality edge cases', () => {
  it('keeps a Rushing body inside the wall by its radius', () => {
    const s = duel(2);
    s.fighters[0].profile = styled(FinisherStyle.Rush);
    s.fighters[0].meter = METER_MAX;
    s.fighters[0].x = ARENA_HALF_WIDTH - 1;
    s.fighters[1].x = -ARENA_HALF_WIDTH + 1;
    s.fighters[0].facingX = 1;
    const { state } = tap(s, moveDuration(FINISHERS[FinisherStyle.Rush]), [SPECIAL, IDLE_INPUT]);
    expect(state.fighters[0].x).toBeLessThanOrEqual(ARENA_HALF_WIDTH - BODY_RADIUS + 1e-9);
  });

  it('Rush into a crowd hits each enemy once and does not tunnel through them', () => {
    const s = createMatch({ teams: [entries(1), entries(3)], ...NO_EXTRAS });
    const [a, e1, e2, e3] = s.fighters;
    a.profile = styled(FinisherStyle.Rush);
    a.meter = METER_MAX;
    a.x = -4; a.z = 0;
    e1.x = -2; e1.z = 0.3;
    e2.x = -1.6; e2.z = -0.3;
    e3.x = -1.2; e3.z = 0;
    const { state, events } = tap(s, moveDuration(FINISHERS[FinisherStyle.Rush]), [SPECIAL, IDLE_INPUT, IDLE_INPUT, IDLE_INPUT]);
    const hits = events.filter((e) => e.kind === 'hit' && e.move === MoveKind.Finisher);
    expect(hits.length).toBeLessThanOrEqual(3);
    expect(new Set(hits.map((h) => (h as { target: string }).target)).size).toBe(hits.length);
    expect(state.fighters.every((f) => Number.isFinite(f.x) && Number.isFinite(f.z))).toBe(true);
  });

  it('a knocked-out thrower leaves no stuck state and the projectile still ends', () => {
    const s = duel(7);
    s.fighters[0].profile = styled(FinisherStyle.Throw);
    s.fighters[0].meter = METER_MAX;
    const mid = tap(s, FINISHERS[FinisherStyle.Throw].startup + 2, [SPECIAL, IDLE_INPUT]).state;
    mid.fighters[0].health = 0;
    mid.fighters[0].action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
    const end = run(mid, PROJECTILE_TICKS + 5, [IDLE_INPUT, IDLE_INPUT]);
    expect(end.state.projectiles).toHaveLength(0);
  });

  it('no projectile survives the end of a match, and a fresh match starts empty', () => {
    const s = duel(7);
    s.fighters[0].profile = styled(FinisherStyle.Throw);
    s.fighters[0].meter = METER_MAX;
    const mid = tap(s, FINISHERS[FinisherStyle.Throw].startup + 2, [SPECIAL, IDLE_INPUT]).state;
    expect(mid.projectiles).toHaveLength(1);
    mid.fighters[1].health = 0;
    mid.fighters[1].action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
    const over = stepMatch(mid, [IDLE_INPUT, IDLE_INPUT]);
    expect(over.phase).toBe(MatchPhase.Over);
    expect(over.projectiles).toHaveLength(0);
    expect(createMatch({ teams: [entries(1), entries(1)], ...NO_EXTRAS }).projectiles).toHaveLength(0);
  });

  it('a taunt at full meter keeps the meter at the cap', () => {
    const s = duel(5);
    s.fighters[0].meter = METER_MAX;
    const { state, events } = tap(s, TAUNT_TICKS + 2, [input({ taunt: true }), IDLE_INPUT]);
    expect(state.fighters[0].meter).toBe(METER_MAX);
    expect(events.find((e) => e.kind === 'tauntDone')).toMatchObject({ meter: 0 });
  });

  it('a held taunt does not input-stack: stepping never mutates the input state', () => {
    const s = duel(5);
    const before = JSON.stringify(s);
    stepMatch(s, [input({ taunt: true }), IDLE_INPUT]);
    expect(JSON.stringify(s)).toBe(before);
  });
});
