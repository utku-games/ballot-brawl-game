/**
 * Edge-case tests for the Brawl extras: contested pick-ups, throws by fighters who fall, anvils on fallen fighters.
 * They also cover matches ending with items and hazards in flight, long seeded matches and purity of the step.
 * Everything runs through the pure simulation, with no mocks.
 */
import { describe, expect, it } from 'vitest';
import { ActionKind, IDLE_INPUT, ItemKind, MatchPhase, type FighterInput, type MatchState } from './fightTypes';
import { HAZARD_INTERVAL_TICKS, HAZARD_WARNING_TICKS } from './hazards';
import { MAX_FLOOR_ITEMS } from './items';
import { createMatch } from './matchSetup';
import { MoveKind, MOVES } from './moves';
import { stepMatch } from './matchStep';
import { PROJECTILE_TICKS } from './projectiles';
import { duel, entries, input, run, tap } from './testFight';

const PUNCH = input({ punch: true });
const IDLE2 = [IDLE_INPUT, IDLE_INPUT];

function scripted(tick: number, i: number): FighterInput {
  const h = (tick * 31 + i * 17) % 11;
  return input({
    punch: h === 0, kick: h === 1, special: h === 2, defend: h === 3 || h === 4,
    moveX: ((tick + i) % 7) - 3 > 0 ? 1 : -1, moveZ: ((tick * 3 + i) % 5) - 2 > 0 ? 1 : -1,
  });
}

function long(seed: number, ticks: number): { state: MatchState; maxItems: number } {
  let s = createMatch({ teams: [entries(4), entries(4)], extras: true, seed, ringOuts: false });
  let maxItems = 0;
  for (let t = 0; t < ticks && s.phase === MatchPhase.Fighting; t += 1) {
    s = stepMatch(s, s.fighters.map((_, i) => scripted(t, i)));
    maxItems = Math.max(maxItems, s.items.length);
  }
  return { state: s, maxItems };
}

describe('extras edge cases', () => {
  it('gives a contested item to exactly one fighter', () => {
    const s = duel(0.2);
    s.items = [{ id: 'i', kind: ItemKind.Gavel, x: 0, z: 0 }];
    const { state } = run(s, 1, IDLE2);
    expect(state.fighters.filter((f) => f.holding !== null)).toHaveLength(1);
    expect(state.items).toHaveLength(0);
  });

  it('does not pick up an item mid-throw', () => {
    const s = duel(5);
    s.fighters[0].holding = ItemKind.Gavel;
    const thrown = tap(s, 3, [PUNCH, IDLE_INPUT]).state;
    thrown.items = [{ id: 'j', kind: ItemKind.Briefcase, x: thrown.fighters[0].x, z: thrown.fighters[0].z }];
    const { state } = run(thrown, 1, IDLE2);
    expect(state.fighters[0].action.kind).toBe(ActionKind.Attack);
    expect(state.items).toHaveLength(1);
  });

  it('keeps a thrown item flying when the thrower is knocked out', () => {
    const s = duel(5);
    s.fighters[0].holding = ItemKind.Gavel;
    const thrown = run(s, 1, [PUNCH, IDLE_INPUT]).state;
    const flying = run(thrown, MOVES[MoveKind.Item].startup, IDLE2).state;
    expect(flying.projectiles).toHaveLength(1);
    flying.fighters[0].health = 0;
    flying.fighters[0].action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
    const { state } = run(flying, PROJECTILE_TICKS, IDLE2);
    expect(state.fighters.every((f) => Number.isFinite(f.health) && f.health >= 0)).toBe(true);
    expect(state.projectiles).toHaveLength(0);
  });

  it('lets an anvil skip a fighter who is already knocked out', () => {
    const s = { ...duel(1), extras: true, seed: 5, ringOuts: false };
    const before = run(s, HAZARD_INTERVAL_TICKS + 1, IDLE2).state;
    const h = before.hazards[0];
    const [a, b] = before.fighters;
    a.x = h.x; a.z = h.z; a.health = 0;
    a.action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
    b.x = 9; b.z = 9;
    const { state, events } = run(before, HAZARD_WARNING_TICKS, IDLE2);
    expect(events.filter((e) => e.kind === 'hazardHit')).toHaveLength(0);
    expect(state.fighters[0].action.kind).toBe(ActionKind.KnockedOut);
  });

  it('clears items and hazards when the match ends', () => {
    const s = { ...duel(1), extras: true, seed: 5, ringOuts: false };
    const before = run(s, HAZARD_INTERVAL_TICKS + 1, IDLE2).state;
    before.items = [{ id: 'x', kind: ItemKind.Gavel, x: 5, z: 5 }];
    before.fighters[1].health = 0;
    before.fighters[1].action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
    const { state } = run(before, 2, IDLE2);
    expect(state.phase).toBe(MatchPhase.Over);
    expect(state.items).toHaveLength(0);
    expect(state.hazards).toHaveLength(0);
    expect(run(state, 5, IDLE2).state.items).toHaveLength(0);
  });

  it('stays deterministic, finite and bounded over a long scripted 4v4', () => {
    const a = long(777, 20000);
    const b = long(777, 20000);
    expect(a.state).toEqual(b.state);
    expect(a.state.fighters.every((f) => Number.isFinite(f.x) && Number.isFinite(f.z) && f.health >= 0)).toBe(true);
    expect(a.maxItems).toBeLessThan(MAX_FLOOR_ITEMS + 9);
  });

  it('does not mutate the previous state when stepping with extras', () => {
    const s = createMatch({ teams: [entries(2), entries(2)], extras: true, seed: 9, ringOuts: false });
    s.fighters[0].holding = ItemKind.Gavel;
    const snapshot = JSON.stringify(s);
    stepMatch(s, s.fighters.map((_, i) => scripted(0, i)));
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});
