/**
 * Tests for the fight simulation rules: setup validation, hits, defending, the finisher, knockdowns and match end.
 * Each test builds a tiny match, drives it with scripted inputs and checks the resulting state and events.
 * Determinism is checked by replaying the same inputs twice.
 */
import { describe, expect, it } from 'vitest';
import { MatchSetupError } from '../core/errors';
import { GUARD_MAX, KNOCKDOWN_COMBO, MATCH_TIME_TICKS, METER_MAX } from './fightConstants';
import { ActionKind, EndReason, IDLE_INPUT, MatchPhase } from './fightTypes';
import { createMatch } from './matchSetup';
import { stepMatch } from './matchStep';
import { MoveKind, moveDuration, MOVES } from './moves';
import { duel, entries, input, NEUTRAL_PROFILE, run, tap } from './testFight';

const CLOSE = 1.2;
const PUNCH = input({ punch: true });
const KICK = input({ kick: true });
const DEFEND = input({ defend: true });
const SPECIAL = input({ special: true });

describe('createMatch', () => {
  it('rejects empty and oversized teams', () => {
    expect(() => createMatch({ teams: [entries(0), entries(1)] })).toThrow(MatchSetupError);
    expect(() => createMatch({ teams: [entries(5), entries(1)] })).toThrow(MatchSetupError);
  });

  it('spawns 4v4 with teams facing each other', () => {
    const s = createMatch({ teams: [entries(4), entries(4)] });
    expect(s.fighters).toHaveLength(8);
    expect(s.fighters.filter((f) => f.team === 0).every((f) => f.x < 0 && f.facingX > 0)).toBe(true);
    expect(s.fighters.filter((f) => f.team === 1).every((f) => f.x > 0 && f.facingX < 0)).toBe(true);
    expect(new Set(s.fighters.map((f) => f.slotId)).size).toBe(8);
  });
});

describe('attacks', () => {
  it('a punch hits a close enemy once for its damage', () => {
    const { state, events } = tap(duel(CLOSE), moveDuration(MOVES[MoveKind.Punch]), [PUNCH, IDLE_INPUT]);
    const hits = events.filter((e) => e.kind === 'hit');
    expect(hits).toHaveLength(1);
    expect(state.fighters[1].health).toBe(NEUTRAL_PROFILE.maxHealth - MOVES[MoveKind.Punch].damage);
    expect(state.fighters[1].damageTaken).toBe(MOVES[MoveKind.Punch].damage);
  });

  it('a punch out of reach misses', () => {
    const { events } = tap(duel(4), moveDuration(MOVES[MoveKind.Punch]), [PUNCH, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'hit')).toBe(false);
  });

  it('a kick reaches farther than a punch', () => {
    const gap = 1.85;
    const punch = tap(duel(gap), moveDuration(MOVES[MoveKind.Punch]), [PUNCH, IDLE_INPUT]);
    const kick = tap(duel(gap), moveDuration(MOVES[MoveKind.Kick]), [KICK, IDLE_INPUT]);
    expect(punch.events.some((e) => e.kind === 'hit')).toBe(false);
    expect(kick.events.some((e) => e.kind === 'hit')).toBe(true);
  });

  it('dealing damage fills the attacker meter', () => {
    const { state } = tap(duel(CLOSE), moveDuration(MOVES[MoveKind.Kick]), [KICK, IDLE_INPUT]);
    expect(state.fighters[0].meter).toBeGreaterThan(0);
  });
});

describe('defending', () => {
  it('takes no damage and drains the guard', () => {
    const { state, events } = run(duel(CLOSE), moveDuration(MOVES[MoveKind.Kick]), [KICK, DEFEND]);
    expect(events.some((e) => e.kind === 'block')).toBe(true);
    expect(state.fighters[1].health).toBe(NEUTRAL_PROFILE.maxHealth);
    expect(state.fighters[1].guard).toBeLessThan(GUARD_MAX);
  });

  it('a defended finisher breaks the guard without damage', () => {
    const start = duel(CLOSE);
    start.fighters[0].meter = METER_MAX;
    const { state, events } = run(start, moveDuration(MOVES[MoveKind.Finisher]), [SPECIAL, DEFEND]);
    expect(events.some((e) => e.kind === 'guardBreak')).toBe(true);
    expect(state.fighters[1].health).toBe(NEUTRAL_PROFILE.maxHealth);
  });
});

describe('finisher', () => {
  it('needs a full meter', () => {
    const { events } = tap(duel(CLOSE), 2, [SPECIAL, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'swing')).toBe(false);
  });

  it('empties the meter and deals heavy damage with a knockdown', () => {
    const start = duel(CLOSE);
    start.fighters[0].meter = METER_MAX;
    const { state, events } = tap(start, moveDuration(MOVES[MoveKind.Finisher]), [SPECIAL, IDLE_INPUT]);
    const hit = events.find((e) => e.kind === 'hit');
    expect(hit && hit.kind === 'hit' && hit.damage).toBe(MOVES[MoveKind.Finisher].damage);
    expect(events.some((e) => e.kind === 'knockdown')).toBe(true);
    expect(state.fighters[0].meter).toBeLessThan(METER_MAX);
  });
});

describe('knockdown and KO', () => {
  it('a long combo knocks the target down', () => {
    let s = duel(CLOSE);
    let knocked = false;
    for (let i = 0; i < KNOCKDOWN_COMBO * 2 && !knocked; i += 1) {
      s.fighters[1].x = s.fighters[0].x + CLOSE;
      s.fighters[1].z = s.fighters[0].z;
      const r = tap(s, MOVES[MoveKind.Punch].startup + MOVES[MoveKind.Punch].active + 1, [PUNCH, IDLE_INPUT]);
      knocked = r.events.some((e) => e.kind === 'knockdown');
      s = run(r.state, MOVES[MoveKind.Punch].recovery, [IDLE_INPUT, IDLE_INPUT]).state;
    }
    expect(knocked).toBe(true);
  });

  it('knocking out the last enemy ends the match', () => {
    const start = duel(CLOSE);
    start.fighters[1].health = 1;
    const { state, events } = tap(start, moveDuration(MOVES[MoveKind.Punch]), [PUNCH, IDLE_INPUT]);
    expect(state.phase).toBe(MatchPhase.Over);
    expect(state.winner).toBe(0);
    expect(state.fighters[1].action.kind).toBe(ActionKind.KnockedOut);
    const over = events.find((e) => e.kind === 'matchOver');
    expect(over && over.kind === 'matchOver' && over.reason).toBe(EndReason.KnockOut);
  });

  it('a team keeps fighting while one member stands', () => {
    const start = createMatch({ teams: [entries(1), entries(2)] });
    start.fighters[1].health = 0;
    start.fighters[1].action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
    expect(stepMatch(start, []).phase).toBe(MatchPhase.Fighting);
  });
});

describe('time over and determinism', () => {
  it('the healthier team wins when time runs out', () => {
    const start = duel(6);
    start.fighters[0].health = 50;
    start.ticksLeft = 1;
    const s = stepMatch(start, []);
    expect(s.phase).toBe(MatchPhase.Over);
    expect(s.winner).toBe(1);
    expect(MATCH_TIME_TICKS).toBeGreaterThan(0);
  });

  it('never mutates the input state and replays identically', () => {
    const start = createMatch({ teams: [entries(2), entries(2)] });
    const snapshot = JSON.stringify(start);
    const script = [input({ moveX: 1, punch: true }), KICK, DEFEND, input({ moveZ: -1 })];
    const a = run(start, 200, script).state;
    const b = run(start, 200, script).state;
    expect(JSON.stringify(start)).toBe(snapshot);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
