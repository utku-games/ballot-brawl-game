/**
 * Edge-case tests for signature specials: counters against projectiles, finishers and each other, grabs on unhittable targets, and ring-outs.
 * Each case builds a small scripted duel and checks that no state is corrupted, such as a dead fighter being hit again.
 * Fighters use the neutral profile with the special under test swapped in.
 */
import { describe, expect, it } from 'vitest';
import { ActionKind, IDLE_INPUT, ItemKind, type MatchState } from './fightTypes';
import { createMatch } from './matchSetup';
import { MoveKind, type SpecialMove } from './moves';
import { duel, entries, input, NEUTRAL_PROFILE, NO_EXTRAS, run, tap } from './testFight';

const SPECIAL = input({ special: true });

function withSpecial(state: MatchState, slot: number, special: SpecialMove): MatchState {
  state.fighters[slot]!.profile = { ...NEUTRAL_PROFILE, special };
  return state;
}

describe('special edge cases', () => {
  it('two counters facing each other deal no damage', () => {
    const s = withSpecial(withSpecial(duel(1.3), 0, MoveKind.Counter), 1, MoveKind.Counter);
    const { state } = run(s, 80, [SPECIAL, SPECIAL]);
    expect(state.fighters[0]!.damageTaken + state.fighters[1]!.damageTaken).toBe(0);
  });

  it('a grab does not hit a knocked-down or invulnerable target', () => {
    const down = withSpecial(duel(1.3), 0, MoveKind.Grab);
    down.fighters[1]!.action = { kind: ActionKind.Knockdown, frame: 0, duration: 200, move: null, hitIds: [] };
    expect(tap(down, 30, [SPECIAL, IDLE_INPUT]).events.some((e) => e.kind === 'hit')).toBe(false);
    const inv = withSpecial(duel(1.3), 0, MoveKind.Grab);
    inv.fighters[1]!.invulnerable = 100;
    expect(tap(inv, 30, [SPECIAL, IDLE_INPUT]).events.some((e) => e.kind === 'hit')).toBe(false);
  });

  it.each([
    ['dead', (f: MatchState['fighters'][number]) => { f.health = 0; f.action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] }; }],
    ['invulnerable', (f: MatchState['fighters'][number]) => { f.invulnerable = 500; }],
  ])('a counter does not reflect a thrown item onto a %s owner', (_name, mutate) => {
    const s = createMatch({ teams: [entries(2), entries(1)], ...NO_EXTRAS });
    const [a, mate, c] = s.fighters;
    a!.x = -2; a!.z = 0; mate!.x = -2; mate!.z = 6; c!.x = 2; c!.z = 0;
    c!.profile = { ...NEUTRAL_PROFILE, special: MoveKind.Counter };
    a!.holding = ItemKind.Gavel;
    let st = run(s, 1, [input({ punch: true }), IDLE_INPUT, IDLE_INPUT]).state;
    let pressed = false;
    let mutated = false;
    const hits: string[] = [];
    for (let i = 0; i < 100; i += 1) {
      const press: boolean = !pressed && st.projectiles.length > 0;
      pressed ||= press;
      st = run(st, 1, [IDLE_INPUT, IDLE_INPUT, press ? SPECIAL : IDLE_INPUT]).state;
      if (st.projectiles.length > 0 && !mutated) { mutated = true; mutate(st.fighters[0]!); }
      for (const e of st.events) if (e.kind === 'hit' || e.kind === 'ko') hits.push(e.kind);
    }
    expect(mutated).toBe(true);
    expect(hits).toEqual([]);
  });

  it('bullrush near the edge with ring-outs stays valid', () => {
    const s = createMatch({ teams: [entries(1), entries(1)], ...NO_EXTRAS, ringOuts: true });
    s.fighters[0]!.profile = { ...NEUTRAL_PROFILE, special: MoveKind.Bullrush };
    s.fighters[0]!.x = 5; s.fighters[0]!.z = 0; s.fighters[0]!.facingX = 1; s.fighters[0]!.facingZ = 0;
    s.fighters[1]!.x = 7; s.fighters[1]!.z = 0;
    const { state } = run(s, 120, [SPECIAL, IDLE_INPUT]);
    expect(Number.isFinite(state.fighters[0]!.x)).toBe(true);
    expect(Number.isFinite(state.fighters[1]!.x)).toBe(true);
  });
});
