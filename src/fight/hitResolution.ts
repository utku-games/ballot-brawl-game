/**
 * Resolves attacks in their active frames: finds every enemy inside a swing's reach and arc, then applies hits or blocks.
 * All contacts of a tick are collected before any is applied, so two fighters trading blows both land, independent of order.
 * Defending takes no damage at all but drains the guard; damage, meter, combo knockdowns and KOs are applied here.
 */
import {
  BODY_RADIUS, GUARD_BREAK_TICKS, KNOCKDOWN_COMBO, KNOCKDOWN_KNOCKBACK_SCALE, KNOCKDOWN_TICKS, METER_GAIN_BLOCK,
  METER_GAIN_DEAL, METER_GAIN_TAKE, METER_MAX,
} from './fightConstants';
import { ActionKind, type FightEvent, type FighterAction, type FighterState } from './fightTypes';
import { isAlive } from './matchQueries';
import { hitsByProjectile, isActiveFrame, MoveKind, moveData, type MoveData } from './moves';

/** Knockback kept when a hit is blocked. */
const BLOCK_KNOCKBACK_SCALE = 0.4;
/** Distance below which two bodies count as on top of each other (no arc test). */
const OVERLAP_EPSILON = 1e-6;

export interface Contact {
  attacker: FighterState;
  target: FighterState;
  move: MoveKind;
  dirX: number;
  dirZ: number;
}

function action(kind: ActionKind, duration: number): FighterAction {
  return { kind, frame: 0, duration, move: null, hitIds: [] };
}

/** True when the target can currently take a hit (alive, not invulnerable, not lying down). */
export function canBeHit(target: Readonly<FighterState>): boolean {
  return isAlive(target) && target.invulnerable <= 0 && target.action.kind !== ActionKind.Knockdown;
}

function contactWith(attacker: FighterState, target: FighterState, move: MoveKind, data: MoveData): Contact | null {
  if (target.team === attacker.team || !canBeHit(target) || attacker.action.hitIds.includes(target.slotId)) return null;
  const dx = target.x - attacker.x;
  const dz = target.z - attacker.z;
  const dist = Math.hypot(dx, dz);
  const reach = data.reach + BODY_RADIUS * (attacker.profile.sizeScale + target.profile.sizeScale);
  if (dist > reach) return null;
  if (dist < OVERLAP_EPSILON) return { attacker, target, move, dirX: attacker.facingX, dirZ: attacker.facingZ };
  const dirX = dx / dist;
  const dirZ = dz / dist;
  if (dirX * attacker.facingX + dirZ * attacker.facingZ < data.arcCos) return null;
  return { attacker, target, move, dirX, dirZ };
}

function collectContacts(fighters: readonly FighterState[]): Contact[] {
  const contacts: Contact[] = [];
  for (const attacker of fighters) {
    const move = attacker.action.move;
    if (attacker.action.kind !== ActionKind.Attack || move === null) continue;
    if (hitsByProjectile(move, attacker.profile.finisher)) continue;
    const data = moveData(move, attacker.profile.finisher);
    if (!isActiveFrame(data, attacker.action.frame)) continue;
    for (const target of fighters) {
      const contact = contactWith(attacker, target, move, data);
      if (contact) contacts.push(contact);
    }
  }
  return contacts;
}

function addMeter(f: FighterState, amount: number): void {
  f.meter = Math.min(METER_MAX, f.meter + amount);
}

function applyBlock(c: Contact, events: FightEvent[]): void {
  const data = moveData(c.move, c.attacker.profile.finisher);
  const t = c.target;
  t.guard -= data.guardDamage;
  addMeter(t, Math.min(data.guardDamage, METER_MAX) * METER_GAIN_BLOCK);
  t.pushX += c.dirX * data.knockback * BLOCK_KNOCKBACK_SCALE;
  t.pushZ += c.dirZ * data.knockback * BLOCK_KNOCKBACK_SCALE;
  events.push({ kind: 'block', attacker: c.attacker.slotId, target: t.slotId, move: c.move, x: t.x, z: t.z });
  if (t.guard <= 0) {
    t.guard = 0;
    t.action = action(ActionKind.GuardBroken, GUARD_BREAK_TICKS);
    events.push({ kind: 'guardBreak', target: t.slotId });
  }
}

function applyHit(c: Contact, events: FightEvent[]): void {
  const data = moveData(c.move, c.attacker.profile.finisher);
  const t = c.target;
  const damage = Math.max(1, Math.round(data.damage * c.attacker.profile.damageScale));
  t.health = Math.max(0, t.health - damage);
  t.damageTaken += damage;
  t.combo += 1;
  addMeter(c.attacker, damage * METER_GAIN_DEAL);
  addMeter(t, damage * METER_GAIN_TAKE);
  events.push({ kind: 'hit', attacker: c.attacker.slotId, target: t.slotId, move: c.move, damage, x: t.x, z: t.z });
  let knock = data.knockback;
  if (t.health === 0) {
    t.action = action(ActionKind.KnockedOut, 0);
    knock *= KNOCKDOWN_KNOCKBACK_SCALE;
    events.push({ kind: 'ko', target: t.slotId, by: c.attacker.slotId });
  } else if (t.combo >= KNOCKDOWN_COMBO || c.move === MoveKind.Finisher) {
    t.action = action(ActionKind.Knockdown, KNOCKDOWN_TICKS);
    t.combo = 0;
    knock *= KNOCKDOWN_KNOCKBACK_SCALE;
    events.push({ kind: 'knockdown', target: t.slotId });
  } else {
    t.action = action(ActionKind.Hitstun, data.hitstun);
  }
  t.pushX += c.dirX * knock;
  t.pushZ += c.dirZ * knock;
}

/** Applies one contact as a block or a hit, as melee and projectiles both do. */
export function applyContact(c: Contact, events: FightEvent[]): void {
  if (c.target.action.kind === ActionKind.Defend) applyBlock(c, events);
  else applyHit(c, events);
}

/** Applies every contact of this tick; mutates the fighters (already cloned by the caller). */
export function resolveAttacks(fighters: FighterState[], events: FightEvent[]): void {
  const contacts = collectContacts(fighters);
  for (const c of contacts) c.attacker.action.hitIds.push(c.target.slotId);
  for (const c of contacts) {
    if (!isAlive(c.target)) continue;
    applyContact(c, events);
  }
}
