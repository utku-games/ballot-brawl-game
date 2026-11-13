/**
 * Tests for the CPU brain and its difficulty profiles.
 * They check that the CPU approaches, attacks in reach, defends threats, uses a full meter and stays deterministic.
 * Full CPU-versus-CPU matches must also finish.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '@utku/engine';
import { METER_MAX } from '../fight/fightConstants';
import { ActionKind, MatchPhase } from '../fight/fightTypes';
import { createMatch } from '../fight/matchSetup';
import { stepMatch } from '../fight/matchStep';
import { MoveKind } from '../fight/moves';
import { duel, entries } from '../fight/testFight';
import { FRESH_MEMORY, thinkAi, type AiMemory } from './aiBrain';
import { Difficulty, DIFFICULTY_LEVEL, profileForLevel } from './aiProfile';

const HARD = profileForLevel(1);
const SEED = 7;
const TRIES = 10;
const IN_REACH = 1.1;

describe('profileForLevel', () => {
  it('reacts faster and attacks more as the level rises', () => {
    const easy = profileForLevel(DIFFICULTY_LEVEL[Difficulty.Easy]);
    const hard = profileForLevel(DIFFICULTY_LEVEL[Difficulty.Hard]);
    expect(hard.reactionTicks).toBeLessThan(easy.reactionTicks);
    expect(hard.attackChance).toBeGreaterThan(easy.attackChance);
    expect(profileForLevel(5)).toEqual(profileForLevel(1));
  });
});

describe('thinkAi', () => {
  it('walks toward a distant enemy', () => {
    const s = duel(8);
    const { input } = thinkAi(s, s.fighters[0], HARD, FRESH_MEMORY, createRng(SEED));
    expect(input.moveX).toBeGreaterThan(0);
  });

  it('attacks an enemy in reach', () => {
    const s = duel(IN_REACH);
    const rng = createRng(SEED);
    let attacked = false;
    for (let i = 0; i < TRIES && !attacked; i += 1) {
      const { input } = thinkAi(s, s.fighters[0], HARD, FRESH_MEMORY, rng);
      attacked = input.punch || input.kick;
    }
    expect(attacked).toBe(true);
  });

  it('defends against a swing in progress', () => {
    const s = duel(IN_REACH);
    s.fighters[1].action = { kind: ActionKind.Attack, frame: 1, duration: 20, move: MoveKind.Kick, hitIds: [] };
    const rng = createRng(SEED);
    let defended = false;
    for (let i = 0; i < TRIES && !defended; i += 1) defended = thinkAi(s, s.fighters[0], HARD, FRESH_MEMORY, rng).input.defend;
    expect(defended).toBe(true);
  });

  it('fires a full meter in reach', () => {
    const s = duel(IN_REACH);
    s.fighters[0].meter = METER_MAX;
    const rng = createRng(SEED);
    let fired = false;
    for (let i = 0; i < TRIES && !fired; i += 1) fired = thinkAi(s, s.fighters[0], HARD, FRESH_MEMORY, rng).input.special;
    expect(fired).toBe(true);
  });
});

function cpuMatch(seed: number, size: number): { winner: number | null; tick: number; health: number[] } {
  let s = createMatch({ teams: [entries(size), entries(size)] });
  const rng = createRng(seed);
  const memories: AiMemory[] = s.fighters.map(() => ({ ...FRESH_MEMORY }));
  while (s.phase === MatchPhase.Fighting) {
    const current = s;
    const inputs = current.fighters.map((f, i) => {
      const d = thinkAi(current, f, HARD, memories[i], rng);
      memories[i] = d.memory;
      return d.input;
    });
    s = stepMatch(current, inputs);
  }
  return { winner: s.winner, tick: s.tick, health: s.fighters.map((f) => f.health) };
}

describe('CPU versus CPU', () => {
  it('a 4v4 brawl ends and replays identically with the same seed', () => {
    expect(cpuMatch(SEED, 4)).toEqual(cpuMatch(SEED, 4));
  });

  it('a 1v1 ends by knockout before time runs out', () => {
    expect(cpuMatch(SEED + 1, 1).health.some((h) => h === 0)).toBe(true);
  });
});
