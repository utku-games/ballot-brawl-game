/**
 * Ring-outs on an open platform: a fighter whose knockback carries their centre past the platform edge falls off.
 * Only fighters being knocked back by a hit can go over; walking and dashing stop at the edge like a wall, and a
 * fighter left teetering past the wall line stays put instead of snapping back.
 * A ring-out counts as a knockout, so the usual match-end rules decide the winner.
 */
import { ARENA_HALF_DEPTH, ARENA_HALF_WIDTH, isInsideArena, type FloorPoint } from '../core/arena';
import { bodyRadius } from './bodyPhysics';
import { ActionKind, type FightEvent, type FighterState } from './fightTypes';
import { isAlive } from './matchQueries';

/** Who caused a ring-out knockout, in ko events. */
export const RING_OUT_SOURCE = 'ringout';

const KNOCKED_BACK: ReadonlySet<ActionKind> = new Set([ActionKind.Hitstun, ActionKind.Knockdown, ActionKind.GuardBroken]);

/** True when this fighter is mid-knockback and could be carried over the edge. */
export function canRingOut(f: Readonly<FighterState>): boolean {
  return isAlive(f) && !f.ringedOut && KNOCKED_BACK.has(f.action.kind);
}

/** Knocks out every fighter whose knockback carried them off the platform this tick. */
export function applyRingOuts(fighters: FighterState[], events: FightEvent[]): void {
  for (const f of fighters) {
    if (!canRingOut(f) || isInsideArena(f)) continue;
    f.ringedOut = true;
    f.health = 0;
    f.holding = null;
    f.action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
    events.push({ kind: 'ringOut', target: f.slotId, x: f.x, z: f.z });
    events.push({ kind: 'ko', target: f.slotId, by: RING_OUT_SOURCE });
  }
}

function limit(half: number, radius: number, before: number): number {
  return Math.min(half, Math.max(half - radius, Math.abs(before)));
}

/**
 * Holds a fighter on an open platform: like the walls, but a fighter whose knockback left them between the wall line
 * and the edge may stay where they were (before is their position at the start of the tick); they cannot move further out.
 */
export function keepOnPlatform(f: FighterState, before: Readonly<FloorPoint>): void {
  const r = bodyRadius(f);
  const maxX = limit(ARENA_HALF_WIDTH, r, before.x);
  const maxZ = limit(ARENA_HALF_DEPTH, r, before.z);
  f.x = Math.min(maxX, Math.max(-maxX, f.x));
  f.z = Math.min(maxZ, Math.max(-maxZ, f.z));
}
