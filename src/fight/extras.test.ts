/**
 * Tests for the Brawl extras: floor items, picking up and throwing them, falling anvils, and determinism.
 * Items spawn on a fixed interval up to a cap, are picked up by walking over them, and a punch throws them instead.
 * Anvils warn first, then knock down everyone in range on both teams; nothing spawns when extras are off.
 */
import { describe, expect, it } from 'vitest';
import { GUARD_MAX } from './fightConstants';
import { ActionKind, IDLE_INPUT, ItemKind, type MatchState } from './fightTypes';
import { HAZARD_DAMAGE, HAZARD_INTERVAL_TICKS, HAZARD_RADIUS, HAZARD_SOURCE, HAZARD_WARNING_TICKS } from './hazards';
import { ITEM_INTERVAL_TICKS, MAX_FLOOR_ITEMS, PICKUP_RADIUS } from './items';
import { createMatch } from './matchSetup';
import { MoveKind, MOVES } from './moves';
import { PROJECTILE_TICKS } from './projectiles';
import { duel, entries, input, run, tap } from './testFight';

const PUNCH = input({ punch: true });
const DEFEND = input({ defend: true });
const SEED = 1234;

function withExtras(state: MatchState, seed: number): MatchState {
  return { ...state, extras: true, seed, ringOuts: false };
}

function holding(state: MatchState): MatchState {
  state.fighters[0].holding = ItemKind.Gavel;
  return state;
}

describe('items', () => {
  it('spawns on the interval up to the cap, only with extras on', () => {
    const idle = [IDLE_INPUT, IDLE_INPUT];
    const off = run(duel(8), ITEM_INTERVAL_TICKS * 3 + 1, idle).state;
    expect(off.items).toHaveLength(0);
    const start = withExtras(duel(8), SEED);
    start.fighters[0].z = -4;
    start.fighters[1].z = -4;
    const first = run(start, ITEM_INTERVAL_TICKS + 1, idle).state;
    expect(first.items).toHaveLength(1);
    const many = run(first, ITEM_INTERVAL_TICKS * 4, idle).state;
    expect(many.items.length).toBeLessThanOrEqual(MAX_FLOOR_ITEMS);
  });

  it('is picked up by walking over it, and not mid-attack', () => {
    const s = duel(8);
    s.items = [{ id: 'i', kind: ItemKind.Briefcase, x: s.fighters[0].x + PICKUP_RADIUS * 0.5, z: 0 }];
    const { state, events } = run(s, 1, [IDLE_INPUT, IDLE_INPUT]);
    expect(state.fighters[0].holding).toBe(ItemKind.Briefcase);
    expect(state.items).toHaveLength(0);
    expect(events.some((e) => e.kind === 'pickup')).toBe(true);
    const busy = tap(duel(8), 2, [PUNCH, IDLE_INPUT]).state;
    busy.items = [{ id: 'j', kind: ItemKind.Gavel, x: busy.fighters[0].x, z: busy.fighters[0].z }];
    expect(run(busy, 1, [IDLE_INPUT, IDLE_INPUT]).state.fighters[0].holding).toBeNull();
  });

  it('turns a punch into a throw that hits at range for item damage', () => {
    const { state, events } = tap(holding(duel(5)), MOVES[MoveKind.Item].startup + PROJECTILE_TICKS, [PUNCH, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'swing' && e.move === MoveKind.Item)).toBe(true);
    const hit = events.find((e) => e.kind === 'hit');
    expect(hit).toMatchObject({ move: MoveKind.Item });
    expect(state.fighters[0].holding).toBeNull();
    expect(state.fighters[1].damageTaken).toBeGreaterThan(0);
  });

  it('is blocked by defending without breaking a full guard', () => {
    const first = run(holding(duel(5)), 1, [PUNCH, DEFEND]);
    const { state, events } = run(first.state, MOVES[MoveKind.Item].startup + PROJECTILE_TICKS, [IDLE_INPUT, DEFEND]);
    expect(events.some((e) => e.kind === 'block')).toBe(true);
    expect(events.some((e) => e.kind === 'guardBreak')).toBe(false);
    expect(state.fighters[1].damageTaken).toBe(0);
    expect(state.fighters[1].guard).toBeLessThan(GUARD_MAX);
  });

  it('is dropped when its holder is knocked down', () => {
    const s = holding(duel(1.2));
    s.fighters[0].action = { kind: ActionKind.Knockdown, frame: 0, duration: 40, move: null, hitIds: [] };
    const { state } = run(s, 1, [IDLE_INPUT, IDLE_INPUT]);
    expect(state.fighters[0].holding).toBeNull();
    expect(state.items).toHaveLength(1);
  });
});

describe('hazards', () => {
  it('warns, then knocks down everyone in range on both teams', () => {
    const s = withExtras(duel(1), SEED);
    const before = run(s, HAZARD_INTERVAL_TICKS + 1, [IDLE_INPUT, IDLE_INPUT]);
    expect(before.events.some((e) => e.kind === 'hazard')).toBe(true);
    const h = before.state.hazards[0];
    for (const f of before.state.fighters) { f.x = h.x; f.z = h.z; }
    const { state, events } = run(before.state, HAZARD_WARNING_TICKS, [IDLE_INPUT, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'crash')).toBe(true);
    expect(events.filter((e) => e.kind === 'hazardHit')).toHaveLength(2);
    expect(state.fighters.every((f) => f.damageTaken === HAZARD_DAMAGE)).toBe(true);
  });

  it('spares fighters outside the radius and credits knockouts to the hazard', () => {
    const s = withExtras(duel(1), SEED);
    const before = run(s, HAZARD_INTERVAL_TICKS + 1, [IDLE_INPUT, IDLE_INPUT]).state;
    const h = before.hazards[0];
    const [a, b] = before.fighters;
    a.x = h.x; a.z = h.z; a.health = HAZARD_DAMAGE;
    b.x = h.x + HAZARD_RADIUS * 3; b.z = h.z;
    const { state, events } = run(before, HAZARD_WARNING_TICKS, [IDLE_INPUT, IDLE_INPUT]);
    expect(events).toContainEqual({ kind: 'ko', target: a.slotId, by: HAZARD_SOURCE });
    expect(state.fighters[1].damageTaken).toBe(0);
  });

  it('never appears with extras off', () => {
    expect(run(duel(1), HAZARD_INTERVAL_TICKS * 2, [IDLE_INPUT, IDLE_INPUT]).events.some((e) => e.kind === 'hazard')).toBe(false);
  });
});

describe('determinism', () => {
  it('replays the same extras for the same seed and differs for another', () => {
    const play = (seed: number): MatchState => run(withExtras(createMatch({ teams: [entries(2), entries(2)], extras: true, seed, ringOuts: false }), seed), ITEM_INTERVAL_TICKS * 2 + 2, [IDLE_INPUT, IDLE_INPUT, IDLE_INPUT, IDLE_INPUT]).state;
    expect(play(SEED)).toEqual(play(SEED));
    expect(play(SEED).items).not.toEqual(play(SEED + 1).items);
  });
});
