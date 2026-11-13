/**
 * Picks which teammate a player controls: the next living one after the current slot, wrapping around the team.
 * Used both when the player presses Swap and when their fighter is knocked out in a team brawl.
 * Returns null when the whole team is down, so the caller can stop reading that player's input.
 */
import type { FighterState, TeamIndex } from './fightTypes';
import { isAlive } from './matchQueries';

/** Next living teammate after `currentSlot` (or the current one if it is the only one left). */
export function nextTeammate(
  fighters: readonly FighterState[],
  team: TeamIndex,
  currentSlot: string,
  taken: ReadonlySet<string>,
): string | null {
  const mates = fighters.filter((f) => f.team === team);
  const start = mates.findIndex((f) => f.slotId === currentSlot);
  for (let step = 1; step <= mates.length; step += 1) {
    const candidate = mates[(Math.max(0, start) + step) % mates.length];
    if (isAlive(candidate) && (!taken.has(candidate.slotId) || candidate.slotId === currentSlot)) return candidate.slotId;
  }
  return null;
}
