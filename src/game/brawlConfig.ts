/**
 * Brawl mode setup as pure data: team sizes from 1 to 4, a fighter (or Random) and a controller (P1, P2 or CPU) per slot,
 * the CPU difficulty and the arena.
 * Player 1 always holds the first slot of the left team; Player 2 can take any other slot, but only one.
 * toMatchPlan resolves Random picks without duplicates using a seeded engine Rng.
 */
import type { Rng } from '@utku/engine';
import { Difficulty, DIFFICULTY_LEVEL } from '../ai/aiProfile';
import { MatchSetupError } from '../core/errors';
import { MAX_TEAM_SIZE } from '../fight/fightConstants';
import { PlayerId } from '../input/controlFrame';
import { ROSTER } from '../roster/roster';
import type { ArenaKind } from '../view/arenaKinds';
import { PLAIN_FIGHT, type MatchPlan, type SlotPlan } from './matchPlan';

export const RANDOM_FIGHTER = 'random';
const SEED_RANGE = 1_000_000;

export enum Controller {
  P1 = 'p1',
  P2 = 'p2',
  Cpu = 'cpu',
}

export interface SlotConfig {
  fighterId: string;
  controller: Controller;
}

export interface BrawlConfig {
  teams: [SlotConfig[], SlotConfig[]];
  difficulty: Difficulty;
  arena: ArenaKind;
  /** Throwable items and falling anvils; on by default. */
  extras: boolean;
}

const CPU_SLOT: Readonly<SlotConfig> = { fighterId: RANDOM_FIGHTER, controller: Controller.Cpu };

export function defaultBrawl(arena: ArenaKind): BrawlConfig {
  return {
    teams: [[{ fighterId: RANDOM_FIGHTER, controller: Controller.P1 }], [{ ...CPU_SLOT }]],
    difficulty: Difficulty.Normal,
    arena,
    extras: true,
  };
}

function cloneTeams(config: Readonly<BrawlConfig>): [SlotConfig[], SlotConfig[]] {
  return [config.teams[0].map((s) => ({ ...s })), config.teams[1].map((s) => ({ ...s }))];
}

export function setTeamSize(config: Readonly<BrawlConfig>, team: 0 | 1, size: number): BrawlConfig {
  const n = Math.min(MAX_TEAM_SIZE, Math.max(1, Math.round(size)));
  const teams = cloneTeams(config);
  const slots = teams[team].slice(0, n);
  while (slots.length < n) slots.push({ ...CPU_SLOT });
  teams[team] = slots;
  return { ...config, teams };
}

export function setFighter(config: Readonly<BrawlConfig>, team: 0 | 1, index: number, fighterId: string): BrawlConfig {
  const teams = cloneTeams(config);
  if (!teams[team][index]) throw new MatchSetupError(`No slot ${team}:${index}`);
  teams[team][index].fighterId = fighterId;
  return { ...config, teams };
}

/** Toggles a slot between CPU and Player 2 (Player 1's own slot cannot change). */
export function togglePlayerTwo(config: Readonly<BrawlConfig>, team: 0 | 1, index: number): BrawlConfig {
  const teams = cloneTeams(config);
  const slot = teams[team][index];
  if (!slot || slot.controller === Controller.P1) return { ...config, teams };
  const becomeP2 = slot.controller !== Controller.P2;
  for (const t of teams) for (const s of t) if (s.controller === Controller.P2) s.controller = Controller.Cpu;
  slot.controller = becomeP2 ? Controller.P2 : Controller.Cpu;
  return { ...config, teams };
}

function resolveFighters(config: Readonly<BrawlConfig>, rng: Rng): string[][] {
  const chosen = new Set(config.teams.flat().map((s) => s.fighterId).filter((id) => id !== RANDOM_FIGHTER));
  const pool = ROSTER.filter((f) => !f.boss && !chosen.has(f.id)).map((f) => f.id);
  return config.teams.map((slots) => slots.map((s) => {
    if (s.fighterId !== RANDOM_FIGHTER) return s.fighterId;
    const pick = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    if (!pick) throw new MatchSetupError('Not enough fighters for random picks');
    return pick;
  }));
}

const CONTROLLER_PLAYER: Readonly<Record<Controller, PlayerId | null>> = {
  [Controller.P1]: PlayerId.One,
  [Controller.P2]: PlayerId.Two,
  [Controller.Cpu]: null,
};

export function toMatchPlan(config: Readonly<BrawlConfig>, rng: Rng): MatchPlan {
  const ids = resolveFighters(config, rng);
  const level = DIFFICULTY_LEVEL[config.difficulty];
  const plan = (team: 0 | 1): SlotPlan[] => config.teams[team].map((s, i) => ({
    fighterId: ids[team][i],
    player: CONTROLLER_PLAYER[s.controller],
    cpuLevel: level,
    damageScale: 1,
    boss: false,
  }));
  return { teams: [plan(0), plan(1)], arena: config.arena, seed: Math.floor(rng() * SEED_RANGE), ...PLAIN_FIGHT, extras: config.extras };
}
