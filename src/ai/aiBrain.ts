/**
 * The CPU brain: turns a match state into one FighterInput for one fighter, deciding every few ticks.
 * Between decisions it keeps walking the same way and keeps defending, like a player holding the stick.
 * It is pure apart from the seeded engine Rng it is given, so a match with the same seed replays identically.
 */
import type { Rng } from '@utku/engine';
import { BODY_RADIUS, GUARD_MAX, METER_MAX } from '../fight/fightConstants';
import { ActionKind, IDLE_INPUT, type FighterInput, type FighterState, type MatchState } from '../fight/fightTypes';
import { distanceBetween, isAlive, nearestEnemy } from '../fight/matchQueries';
import { MoveKind, moveData } from '../fight/moves';
import { FinisherStyle } from '../roster/signatureTypes';
import type { AiProfile } from './aiProfile';

/** What the brain remembers between ticks. */
export interface AiMemory {
  cooldown: number;
  moveX: number;
  moveZ: number;
  defending: boolean;
}

export interface AiDecision {
  input: FighterInput;
  memory: AiMemory;
}

export const FRESH_MEMORY: Readonly<AiMemory> = { cooldown: 0, moveX: 0, moveZ: 0, defending: false };

/** Enemies within this many meters beyond the nearest one count as alternatives for focusing the weakest. */
const FOCUS_RANGE_SLACK = 1.5;
/** Distance at which an enemy swing is considered a threat, meters. */
const THREAT_RANGE = 2.6;
/** Sideways weight per slot so a team spreads around its target instead of queueing. */
const FLANK_WEIGHT = 0.45;
/** Fraction of reach the CPU closes to before swinging, so it does not swing at the very edge. */
const REACH_MARGIN = 0.9;
/** Distances from which each finisher style is worth firing, meters between body centres (Smash and Quake use reach). */
const THROW_RANGE = 6;
const RUSH_RANGE = 3;
/** Range in which a CPU holding an item throws it, meters. */
const ITEM_MIN_RANGE = 2.5;
const ITEM_MAX_RANGE = 7;
/** With no enemy closer than this, the CPU may taunt to build power. */
const TAUNT_DISTANCE = 4;
/** Chance to taunt per decision when alone. */
const TAUNT_CHANCE = 0.02;
/** Prefix before the slot number in a slot id such as "t1s3". */
const SLOT_MARKER = 's';

function pickTarget(state: Readonly<MatchState>, self: Readonly<FighterState>, profile: Readonly<AiProfile>): FighterState | null {
  const nearest = nearestEnemy(state.fighters, self);
  if (!nearest || !profile.focusWeakest) return nearest;
  const limit = distanceBetween(self, nearest) + FOCUS_RANGE_SLACK;
  let best = nearest;
  for (const f of state.fighters) {
    if (f.team === self.team || !isAlive(f) || distanceBetween(self, f) > limit) continue;
    if (f.health < best.health) best = f;
  }
  return best;
}

function underThreat(state: Readonly<MatchState>, self: Readonly<FighterState>): boolean {
  return state.fighters.some((f) =>
    f.team !== self.team && f.action.kind === ActionKind.Attack && distanceBetween(self, f) <= THREAT_RANGE,
  );
}

function reachTo(self: Readonly<FighterState>, target: Readonly<FighterState>, move: MoveKind): number {
  return (moveData(move, self.profile.finisher).reach + BODY_RADIUS * (self.profile.sizeScale + target.profile.sizeScale)) * REACH_MARGIN;
}

/** How close the target must be before this fighter's finisher style is worth firing. */
export function finisherRange(self: Readonly<FighterState>, target: Readonly<FighterState>): number {
  if (self.profile.finisher === FinisherStyle.Throw) return THROW_RANGE;
  if (self.profile.finisher === FinisherStyle.Rush) return RUSH_RANGE;
  return reachTo(self, target, MoveKind.Finisher);
}

function slotNumber(slotId: string): number {
  return Number(slotId.slice(slotId.lastIndexOf(SLOT_MARKER) + 1));
}

function approach(self: Readonly<FighterState>, target: Readonly<FighterState>): { x: number; z: number } {
  const dx = target.x - self.x;
  const dz = target.z - self.z;
  const dist = Math.hypot(dx, dz) || 1;
  const slot = slotNumber(self.slotId);
  const side = slot % 2 === 0 ? 1 : -1;
  const flank = FLANK_WEIGHT * side * Math.min(1, slot);
  const x = dx / dist - (dz / dist) * flank;
  const z = dz / dist + (dx / dist) * flank;
  const len = Math.hypot(x, z) || 1;
  return { x: x / len, z: z / len };
}

function decide(state: Readonly<MatchState>, self: Readonly<FighterState>, profile: Readonly<AiProfile>, rng: Rng): AiDecision {
  const memory: AiMemory = { ...FRESH_MEMORY, cooldown: profile.reactionTicks };
  const target = pickTarget(state, self, profile);
  if (!target) return { input: { ...IDLE_INPUT }, memory };
  const dist = distanceBetween(self, target);
  const guardLow = self.guard / GUARD_MAX < profile.retreatGuard;
  if (underThreat(state, self) && !guardLow && rng() < profile.defendChance) {
    return { input: { ...IDLE_INPUT, defend: true }, memory: { ...memory, defending: true } };
  }
  if (self.meter >= METER_MAX && dist <= finisherRange(self, target) && rng() < profile.finisherChance) {
    return { input: { ...IDLE_INPUT, special: true }, memory };
  }
  if (self.holding && dist >= ITEM_MIN_RANGE && dist <= ITEM_MAX_RANGE) {
    return { input: { ...IDLE_INPUT, punch: true }, memory };
  }
  const kick = rng() < profile.kickBias;
  if (dist <= reachTo(self, target, kick ? MoveKind.Kick : MoveKind.Punch)) {
    if (rng() < profile.attackChance) return { input: { ...IDLE_INPUT, punch: !kick, kick }, memory };
    return { input: { ...IDLE_INPUT }, memory };
  }
  if (dist > TAUNT_DISTANCE && self.meter < METER_MAX && rng() < TAUNT_CHANCE) {
    return { input: { ...IDLE_INPUT, taunt: true }, memory };
  }
  const dir = approach(self, target);
  const sign = guardLow ? -1 : 1;
  const next = { ...memory, moveX: dir.x * sign, moveZ: dir.z * sign };
  return { input: { ...IDLE_INPUT, moveX: next.moveX, moveZ: next.moveZ }, memory: next };
}

/** One tick of CPU control for one fighter. */
export function thinkAi(
  state: Readonly<MatchState>,
  self: Readonly<FighterState>,
  profile: Readonly<AiProfile>,
  memory: Readonly<AiMemory>,
  rng: Rng,
): AiDecision {
  if (!isAlive(self)) return { input: { ...IDLE_INPUT }, memory: { ...FRESH_MEMORY } };
  if (memory.cooldown > 0) {
    const input = { ...IDLE_INPUT, moveX: memory.moveX, moveZ: memory.moveZ, defend: memory.defending };
    return { input, memory: { ...memory, cooldown: memory.cooldown - 1 } };
  }
  return decide(state, self, profile, rng);
}
