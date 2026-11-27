/**
 * Tests directional moves inside real matches: Punch or Kick while walking toward or away from the opponent becomes the kit's move, which carries the fighter by its dash.
 * Standing still keeps the plain punch, a slide kick knocks down on a clean hit, and blocking a charge move still drains guard instead of hitting.
 * Both test fighters have neutral stats, so they fight with the Trickster kit.
 */
import { describe, expect, it } from 'vitest';
import { ActionKind } from './fightTypes';
import { KIT_MOVES, MoveKit } from './moveKits';
import { MoveKind } from './moves';
import { duel, input, run, tap } from './testFight';

const TRICKSTER = KIT_MOVES[MoveKit.Trickster];
function swingOf(events: ReturnType<typeof tap>['events']): MoveKind | undefined {
  for (const e of events) if (e.kind === 'swing' && e.attacker === 't0s0') return e.move;
  return undefined;
}

describe('directional moves in a match', () => {
  it('keeps the plain punch when standing still', () => {
    const { events, state } = tap(duel(4), 30, [input({ punch: true }), input({})]);
    expect(swingOf(events)).toBe(MoveKind.Punch);
    expect(state.fighters[0]!.x).toBeCloseTo(-2, 5);
  });

  it('turns a punch toward the opponent into the charge move and dashes forward', () => {
    const { events, state } = tap(duel(4), 30, [input({ punch: true, moveX: 1 }), input({})]);
    expect(swingOf(events)).toBe(TRICKSTER.punchToward);
    expect(state.fighters[0]!.x).toBeGreaterThan(-1.8);
  });

  it('turns a kick away from the opponent into the evasive move and backs off', () => {
    const { events, state } = tap(duel(4), 40, [input({ kick: true, moveX: -1 }), input({})]);
    expect(swingOf(events)).toBe(TRICKSTER.kickAway);
    expect(state.fighters[0]!.x).toBeLessThan(-2.2);
  });

  it('knocks down with a clean slide kick', () => {
    const { events } = tap(duel(1.6), 40, [input({ kick: true, moveX: 1 }), input({})]);
    expect(swingOf(events)).toBe(MoveKind.SlideKick);
    expect(events.some((e) => e.kind === 'knockdown')).toBe(true);
  });

  it('is blocked like any other attack', () => {
    const start = duel(1.6);
    const { events, state } = run(start, 40, [input({ kick: true, moveX: 1 }), input({ defend: true })]);
    expect(events.some((e) => e.kind === 'block')).toBe(true);
    expect(events.some((e) => e.kind === 'knockdown')).toBe(false);
    expect(state.fighters[1]!.action.kind).not.toBe(ActionKind.Knockdown);
  });
});
