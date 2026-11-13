/**
 * Body motion that is not walking: knockback sliding with decay, pushing overlapping bodies apart, and the arena walls.
 * Knocked-out fighters still slide but no longer push or get pushed, so they never block the living.
 * Everything mutates fighters that the caller has already cloned for this tick.
 */
import { clampToArena } from '../core/arena';
import { BODY_RADIUS, KNOCKBACK_DECAY, KNOCKBACK_STOP, SEPARATION_STRENGTH, TICK_SECONDS } from './fightConstants';
import type { FighterState } from './fightTypes';
import { isAlive } from './matchQueries';

/** Distance below which two bodies are treated as coincident and pushed along X. */
const COINCIDENT_EPSILON = 1e-6;

/** Radius of a fighter's body on the floor, scaled with their size. */
export function bodyRadius(f: Readonly<FighterState>): number {
  return BODY_RADIUS * f.profile.sizeScale;
}

export function slideKnockback(f: FighterState): void {
  f.x += f.pushX * TICK_SECONDS;
  f.z += f.pushZ * TICK_SECONDS;
  f.pushX *= KNOCKBACK_DECAY;
  f.pushZ *= KNOCKBACK_DECAY;
  if (Math.hypot(f.pushX, f.pushZ) < KNOCKBACK_STOP) {
    f.pushX = 0;
    f.pushZ = 0;
  }
}

function separatePair(a: FighterState, b: FighterState, index: number): void {
  const minDist = bodyRadius(a) + bodyRadius(b);
  let dx = b.x - a.x;
  let dz = b.z - a.z;
  let dist = Math.hypot(dx, dz);
  if (dist >= minDist) return;
  if (dist < COINCIDENT_EPSILON) {
    dx = index % 2 === 0 ? 1 : -1;
    dz = 0;
    dist = 1;
  }
  const push = ((minDist - Math.hypot(b.x - a.x, b.z - a.z)) * SEPARATION_STRENGTH) / 2;
  a.x -= (dx / dist) * push;
  a.z -= (dz / dist) * push;
  b.x += (dx / dist) * push;
  b.z += (dz / dist) * push;
}

export function separateBodies(fighters: FighterState[]): void {
  for (let i = 0; i < fighters.length; i += 1) {
    if (!isAlive(fighters[i])) continue;
    for (let j = i + 1; j < fighters.length; j += 1) {
      if (isAlive(fighters[j])) separatePair(fighters[i], fighters[j], i + j);
    }
  }
}

export function keepInArena(f: FighterState): void {
  const p = clampToArena(f, bodyRadius(f));
  f.x = p.x;
  f.z = p.z;
}
