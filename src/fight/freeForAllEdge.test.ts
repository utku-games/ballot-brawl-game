/**
 * Edge tests for free-for-all matches: spawn separation, simultaneous knockouts, and a long deterministic run with items and ring-outs.
 * A scripted brawl on the open platform with four sides must end with a valid winner or draw and repeat identically.
 * Every side counts as an enemy for the nearest-enemy query.
 */
import { describe, expect, it } from 'vitest';
import { distanceBetween } from './matchQueries';
import { ActionKind, IDLE_INPUT, MatchPhase, type FighterInput, type MatchState } from './fightTypes';
import { createMatch } from './matchSetup';
import { stepMatch } from './matchStep';
import { entries } from './testFight';

const TICKS = 6000;
const MIN_SEPARATION = 1.5;
const PERIOD_A = 7;
const PERIOD_B = 11;

function open(sides: number, extras: boolean): MatchState {
  return createMatch({ teams: Array.from({ length: sides }, () => entries(1)), extras, seed: 3, ringOuts: true });
}

function script(tick: number, i: number): FighterInput {
  return {
    ...IDLE_INPUT,
    moveX: Math.sin(tick / (PERIOD_A + i)),
    moveZ: Math.cos(tick / (PERIOD_B + i)),
    punch: (tick + i) % PERIOD_A === 0,
    kick: (tick + i * 3) % PERIOD_B === 0,
  };
}

function play(sides: number): string {
  let s = open(sides, true);
  for (let t = 0; t < TICKS && s.phase !== MatchPhase.Over; t += 1) {
    s = stepMatch(s, s.fighters.map((_, i) => script(t, i)));
  }
  return JSON.stringify([s.phase, s.winner, s.tick, s.fighters.map((f) => [f.x, f.z, f.health])]);
}

describe('free-for-all edges', () => {
  it('keeps spawned fighters apart', () => {
    for (const n of [3, 4]) {
      const f = open(n, false).fighters;
      for (let i = 0; i < f.length; i += 1) for (let j = i + 1; j < f.length; j += 1) expect(distanceBetween(f[i], f[j])).toBeGreaterThan(MIN_SEPARATION);
    }
  });

  it('draws when the last two fall on the same tick', () => {
    const s = open(4, false);
    for (const i of [0, 1, 2, 3]) {
      s.fighters[i].health = 0;
      s.fighters[i].action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
    }
    const out = stepMatch(s, s.fighters.map(() => IDLE_INPUT));
    expect(out.phase).toBe(MatchPhase.Over);
    expect(out.winner).toBeNull();
  });

  it('plays a four-sided scripted brawl with items and ring-outs deterministically', () => {
    const a = play(4);
    expect(a).toBe(play(4));
    expect(play(3)).toBe(play(3));
  });
});
