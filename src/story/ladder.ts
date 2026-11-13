/**
 * Builds a story ladder: ten opponents from the chosen category, each harder than the last, ending with the boss.
 * Nine regulars are drawn in a seeded random order from everyone except the player's fighter; the boss is always tenth.
 * Each stage raises the CPU skill level and its damage, so the climb gets steadily tougher.
 */
import type { Rng } from '@utku/engine';
import { MatchSetupError } from '../core/errors';
import { fighterById, fightersIn } from '../roster/roster';
import type { Category } from '../roster/rosterTypes';

/** Opponents in one story run, the last being the boss. */
export const LADDER_LENGTH = 10;
/** CPU skill level of the first and the last stage (0..1). */
export const FIRST_STAGE_LEVEL = 0.1;
export const BOSS_STAGE_LEVEL = 1;
/** CPU damage multiplier of the first stage and the extra gained by the last one. */
export const FIRST_STAGE_DAMAGE = 1;
export const LAST_STAGE_EXTRA_DAMAGE = 0.3;

export interface StoryStage {
  opponentId: string;
  /** CPU skill level for this fight (0..1). */
  level: number;
  /** Damage multiplier applied to the opponent. */
  damageScale: number;
  boss: boolean;
}

function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Progress through the ladder from 0 (first fight) to 1 (boss). */
function progress(index: number): number {
  return index / (LADDER_LENGTH - 1);
}

export function buildLadder(category: Category, playerId: string, rng: Rng): StoryStage[] {
  const player = fighterById(playerId);
  if (player.category !== category || player.boss) {
    throw new MatchSetupError(`${playerId} cannot start the ${category} story`);
  }
  const members = fightersIn(category);
  const boss = members.find((f) => f.boss);
  if (!boss) throw new MatchSetupError(`${category} has no boss`);
  const regulars = shuffled(members.filter((f) => !f.boss && f.id !== playerId), rng).slice(0, LADDER_LENGTH - 1);
  const ids = [...regulars.map((f) => f.id), boss.id];
  return ids.map((opponentId, i) => ({
    opponentId,
    level: FIRST_STAGE_LEVEL + (BOSS_STAGE_LEVEL - FIRST_STAGE_LEVEL) * progress(i),
    damageScale: FIRST_STAGE_DAMAGE + LAST_STAGE_EXTRA_DAMAGE * progress(i),
    boss: opponentId === boss.id,
  }));
}
