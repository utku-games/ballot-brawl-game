/**
 * A quick 2 versus 2 plan used until the menus exist: Player 1 and a CPU ally against two CPU opponents.
 * Fighters are drawn at random from the whole roster (bosses excluded) using a seeded engine Rng.
 * The arena follows the category of Player 1's fighter.
 */
import type { Rng } from '@utku/engine';
import { DIFFICULTY_LEVEL, Difficulty } from '../ai/aiProfile';
import { PlayerId } from '../input/controlFrame';
import { fighterById, ROSTER } from '../roster/roster';
import { ARENA_FOR_CATEGORY } from '../view/arenaKinds';
import type { MatchPlan, SlotPlan } from './matchPlan';

const DEMO_TEAM_SIZE = 2;
const SEED_RANGE = 1_000_000;

function cpu(fighterId: string): SlotPlan {
  return { fighterId, player: null, cpuLevel: DIFFICULTY_LEVEL[Difficulty.Normal], damageScale: 1, boss: false };
}

export function demoPlan(rng: Rng): MatchPlan {
  const pool = ROSTER.filter((f) => !f.boss).map((f) => f.id);
  const picks: string[] = [];
  while (picks.length < DEMO_TEAM_SIZE * 2) {
    const id = pool[Math.floor(rng() * pool.length)];
    if (!picks.includes(id)) picks.push(id);
  }
  const teamA = [{ ...cpu(picks[0]), player: PlayerId.One }, cpu(picks[1])];
  const teamB = [cpu(picks[2]), cpu(picks[3])];
  return { teams: [teamA, teamB], arena: ARENA_FOR_CATEGORY[fighterById(picks[0]).category], seed: Math.floor(rng() * SEED_RANGE) };
}
