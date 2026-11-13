/**
 * Throwable items: they appear on the floor every few seconds, fighters pick them up by walking over them, and the
 * next punch throws them as a projectile (handled by projectiles.ts).
 * A fighter who is knocked down or out drops the item they hold where they fall.
 * Placement is deterministic, from the match seed and tick, so matches with extras still replay identically.
 */
import { ARENA_HALF_DEPTH, ARENA_HALF_WIDTH } from '../core/arena';
import { TICK_RATE } from './fightConstants';
import { ActionKind, ItemKind, type FightEvent, type FighterState, type ItemState } from './fightTypes';
import { extraRandom } from './extraRandom';
import { isAlive } from './matchQueries';

/** Ticks between item spawns, and the most items allowed on the floor at once. */
export const ITEM_INTERVAL_TICKS = 6 * TICK_RATE;
export const MAX_FLOOR_ITEMS = 2;
/** Distance between a fighter's centre and an item at which it is picked up, meters. */
export const PICKUP_RADIUS = 0.7;
/** Items spawn at least this far inside the walls, meters. */
const WALL_MARGIN = 1.2;
const KINDS: readonly ItemKind[] = [ItemKind.Briefcase, ItemKind.Gavel, ItemKind.MoneyBag];
const SALT_X = 11;
const SALT_Z = 12;
const SALT_KIND = 13;

function spread(r: number, half: number): number {
  return (r * 2 - 1) * (half - WALL_MARGIN);
}

/** A new floor item on spawn ticks while there is room, otherwise nothing. */
export function spawnItem(items: readonly ItemState[], tick: number, seed: number): ItemState | null {
  if (tick === 0 || tick % ITEM_INTERVAL_TICKS !== 0 || items.length >= MAX_FLOOR_ITEMS) return null;
  const kind = KINDS[Math.floor(extraRandom(seed, tick, SALT_KIND) * KINDS.length)];
  return {
    id: `item@${tick}`,
    kind,
    x: spread(extraRandom(seed, tick, SALT_X), ARENA_HALF_WIDTH),
    z: spread(extraRandom(seed, tick, SALT_Z), ARENA_HALF_DEPTH),
  };
}

function canPickUp(f: Readonly<FighterState>): boolean {
  return isAlive(f) && f.holding === null && (f.action.kind === ActionKind.Idle || f.action.kind === ActionKind.Defend);
}

/** Hands floor items to fighters standing on them; returns the items left on the floor. */
export function pickUpItems(items: readonly ItemState[], fighters: FighterState[], events: FightEvent[]): ItemState[] {
  const left: ItemState[] = [];
  for (const item of items) {
    const taker = fighters.find((f) => canPickUp(f) && Math.hypot(f.x - item.x, f.z - item.z) <= PICKUP_RADIUS);
    if (taker) {
      taker.holding = item.kind;
      events.push({ kind: 'pickup', fighter: taker.slotId, item: item.kind });
    } else {
      left.push(item);
    }
  }
  return left;
}

/** Fighters who are down drop what they hold; returns the dropped items. */
export function dropFromFallen(fighters: FighterState[], tick: number): ItemState[] {
  const dropped: ItemState[] = [];
  for (const f of fighters) {
    const down = f.action.kind === ActionKind.Knockdown || f.action.kind === ActionKind.KnockedOut;
    if (!down || f.holding === null) continue;
    dropped.push({ id: `drop@${tick}:${f.slotId}`, kind: f.holding, x: f.x, z: f.z });
    f.holding = null;
  }
  return dropped;
}
