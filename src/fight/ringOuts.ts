/**
 * Ring-outs on an open platform: a fighter whose knockback carries their centre past the platform edge falls off.
 * Only fighters being knocked back by a hit can go over; walking and dashing still stop at the edge like a wall.
 * A ring-out counts as a knockout, so the usual match-end rules decide the winner.
 */
import { isInsideArena } from '../core/arena';
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
