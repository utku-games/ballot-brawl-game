/**
 * Thrown finishers: spawns a projectile on the first active frame of a Throw finisher, then flies and resolves it.
 * A projectile travels straight, hits or is blocked by the first living enemy it touches, and disappears on contact,
 * at the arena wall or when its flight time runs out.
 * Hits reuse the melee contact rules, so damage, meter, guard breaks, knockdowns and knockouts work the same way.
 */
import { isInsideArena } from '../core/arena';
import { FinisherStyle } from '../roster/signatureTypes';
import { BODY_RADIUS, TICK_SECONDS } from './fightConstants';
import { ActionKind, type FightEvent, type FighterState, type ProjectileState } from './fightTypes';
import { applyContact, canBeHit } from './hitResolution';
import { FINISHERS, MoveKind } from './moves';

/** Flight speed, m/s. */
export const PROJECTILE_SPEED = 9;
/** Radius of a projectile's hit area, meters. */
export const PROJECTILE_RADIUS = 0.35;
/** Flight time in ticks before a projectile vanishes. */
export const PROJECTILE_TICKS = 54;
/** How far in front of the thrower's body edge a projectile starts, meters. */
const SPAWN_GAP = 0.25;

function throwsNow(f: Readonly<FighterState>): boolean {
  return f.action.kind === ActionKind.Attack && f.action.move === MoveKind.Finisher
    && f.profile.finisher === FinisherStyle.Throw && f.action.frame === FINISHERS[FinisherStyle.Throw].startup;
}

/** New projectiles released this tick, with ids unique within the match. */
export function spawnProjectiles(fighters: readonly FighterState[], tick: number, events: FightEvent[]): ProjectileState[] {
  const spawned: ProjectileState[] = [];
  for (const f of fighters) {
    if (!throwsNow(f)) continue;
    const gap = BODY_RADIUS * f.profile.sizeScale + SPAWN_GAP;
    const id = `${f.slotId}@${tick}`;
    spawned.push({ id, owner: f.slotId, team: f.team, x: f.x + f.facingX * gap, z: f.z + f.facingZ * gap, dirX: f.facingX, dirZ: f.facingZ, ticksLeft: PROJECTILE_TICKS });
    events.push({ kind: 'throw', attacker: f.slotId, projectile: id });
  }
  return spawned;
}

function firstVictim(p: Readonly<ProjectileState>, fighters: readonly FighterState[]): FighterState | null {
  for (const f of fighters) {
    if (f.team === p.team || !canBeHit(f)) continue;
    if (Math.hypot(f.x - p.x, f.z - p.z) <= PROJECTILE_RADIUS + BODY_RADIUS * f.profile.sizeScale) return f;
  }
  return null;
}

/** Moves every projectile one tick and applies its hit; returns the projectiles still flying. */
export function stepProjectiles(projectiles: readonly ProjectileState[], fighters: readonly FighterState[], events: FightEvent[]): ProjectileState[] {
  const flying: ProjectileState[] = [];
  for (const before of projectiles) {
    const p = { ...before, x: before.x + before.dirX * PROJECTILE_SPEED * TICK_SECONDS, z: before.z + before.dirZ * PROJECTILE_SPEED * TICK_SECONDS, ticksLeft: before.ticksLeft - 1 };
    const victim = firstVictim(p, fighters);
    const owner = fighters.find((f) => f.slotId === p.owner);
    if (victim && owner) {
      applyContact({ attacker: owner, target: victim, move: MoveKind.Finisher, dirX: p.dirX, dirZ: p.dirZ }, events);
      continue;
    }
    if (p.ticksLeft > 0 && isInsideArena(p)) flying.push(p);
  }
  return flying;
}
