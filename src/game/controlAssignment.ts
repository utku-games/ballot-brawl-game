/**
 * Pure bookkeeping of which fighter each local player controls during a match.
 * A player keeps their fighter until they press Swap or it is knocked out; then control moves to the next living teammate
 * that no other player holds, and the fighter they left is taken over by the CPU.
 * Everything here is pure so swaps and knockouts can be tested without a browser.
 */
import type { FighterState } from '../fight/fightTypes';
import { isAlive } from '../fight/matchQueries';
import { nextTeammate } from '../fight/teamSwap';
import type { PlayerId } from '../input/controlFrame';

export type Assignment = ReadonlyMap<PlayerId, string>;

/** Moves control for one player when they asked to swap or their fighter is down; other players are unchanged. */
export function updateAssignment(
  assignment: Assignment,
  fighters: readonly FighterState[],
  player: PlayerId,
  wantsSwap: boolean,
): Map<PlayerId, string> {
  const next = new Map(assignment);
  const current = assignment.get(player);
  if (current === undefined) return next;
  const fighter = fighters.find((f) => f.slotId === current);
  if (!fighter || (!wantsSwap && isAlive(fighter))) return next;
  const taken = new Set([...assignment].filter(([p]) => p !== player).map(([, slot]) => slot));
  const target = nextTeammate(fighters, fighter.team, current, taken);
  if (target === null) next.delete(player);
  else next.set(player, target);
  return next;
}

/** Slot ids currently driven by a player. */
export function playerSlots(assignment: Assignment): Set<string> {
  return new Set(assignment.values());
}
