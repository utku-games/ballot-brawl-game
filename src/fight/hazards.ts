/**
 * Arena hazards: every few seconds an anvil is aimed at a living fighter, its shadow warns for a second, then it lands.
 * Everyone within the impact radius, on either team, takes damage and is knocked down; it cannot be blocked, only dodged.
 * Targets and offsets come from the match seed and tick, so matches with extras still replay identically.
 */
import { clampToArena } from '../core/arena';
import { KNOCKDOWN_TICKS, TICK_RATE } from './fightConstants';
import { ActionKind, type FightEvent, type FighterState, type HazardState } from './fightTypes';
import { extraRandom } from './extraRandom';
import { canBeHit } from './hitResolution';
import { isAlive } from './matchQueries';

/** Ticks between hazards, warning time before impact, impact radius and damage. */
export const HAZARD_INTERVAL_TICKS = 9 * TICK_RATE;
export const HAZARD_WARNING_TICKS = TICK_RATE;
export const HAZARD_RADIUS = 1.1;
export const HAZARD_DAMAGE = 16;
/** Who triggered a hazard knockout, in ko events. */
export const HAZARD_SOURCE = 'hazard';
/** Largest random offset from the targeted fighter, meters. */
const JITTER = 0.8;
const SALT_TARGET = 21;
const SALT_X = 22;
const SALT_Z = 23;

/** A new hazard on hazard ticks, aimed near a living fighter, otherwise nothing. */
export function spawnHazard(fighters: readonly FighterState[], tick: number, seed: number, events: FightEvent[]): HazardState | null {
  if (tick === 0 || tick % HAZARD_INTERVAL_TICKS !== 0) return null;
  const living = fighters.filter(isAlive);
  if (living.length === 0) return null;
  const target = living[Math.floor(extraRandom(seed, tick, SALT_TARGET) * living.length)];
  const spot = clampToArena({
    x: target.x + (extraRandom(seed, tick, SALT_X) * 2 - 1) * JITTER,
    z: target.z + (extraRandom(seed, tick, SALT_Z) * 2 - 1) * JITTER,
  }, HAZARD_RADIUS);
  const hazard = { id: `anvil@${tick}`, x: spot.x, z: spot.z, ticksLeft: HAZARD_WARNING_TICKS };
  events.push({ kind: 'hazard', id: hazard.id, x: hazard.x, z: hazard.z });
  return hazard;
}

function strike(h: Readonly<HazardState>, fighters: FighterState[], events: FightEvent[]): void {
  events.push({ kind: 'crash', id: h.id, x: h.x, z: h.z });
  for (const f of fighters) {
    if (!canBeHit(f) || Math.hypot(f.x - h.x, f.z - h.z) > HAZARD_RADIUS) continue;
    f.health = Math.max(0, f.health - HAZARD_DAMAGE);
    f.damageTaken += HAZARD_DAMAGE;
    events.push({ kind: 'hazardHit', target: f.slotId, damage: HAZARD_DAMAGE, x: f.x, z: f.z });
    f.combo = 0;
    if (f.health === 0) {
      f.action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
      events.push({ kind: 'ko', target: f.slotId, by: HAZARD_SOURCE });
    } else {
      f.action = { kind: ActionKind.Knockdown, frame: 0, duration: KNOCKDOWN_TICKS, move: null, hitIds: [] };
      events.push({ kind: 'knockdown', target: f.slotId });
    }
  }
}

/** Counts every hazard down one tick and lands those that reach zero; returns the ones still falling. */
export function stepHazards(hazards: readonly HazardState[], fighters: FighterState[], events: FightEvent[]): HazardState[] {
  const falling: HazardState[] = [];
  for (const before of hazards) {
    const h = { ...before, ticksLeft: before.ticksLeft - 1 };
    if (h.ticksLeft <= 0) strike(h, fighters, events);
    else falling.push(h);
  }
  return falling;
}
