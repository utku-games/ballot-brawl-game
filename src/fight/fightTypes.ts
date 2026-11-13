/**
 * State, input and event types of the deterministic fight simulation.
 * A MatchState holds every fighter of both teams; stepMatch turns it plus one FighterInput per fighter into the next state.
 * Events describe what happened during the last tick so the view, audio and HUD can react without diffing states.
 */
import type { FinisherStyle } from '../roster/signatureTypes';
import type { MoveKind } from './moves';

/** Side index: 0 is the left team (players by default), 1 the right team; party free-for-alls add sides 2 and 3. */
export type TeamIndex = 0 | 1 | 2 | 3;

/** One tick of control for one fighter, from a player or the CPU. */
export interface FighterInput {
  /** Move intent on the floor: +x right, +z toward the camera; length 0..1. */
  moveX: number;
  moveZ: number;
  /** Fresh presses this tick. */
  punch: boolean;
  kick: boolean;
  special: boolean;
  taunt: boolean;
  /** Held this tick. */
  defend: boolean;
}

export enum ActionKind {
  Idle = 'idle',
  Attack = 'attack',
  Defend = 'defend',
  Hitstun = 'hitstun',
  GuardBroken = 'guardBroken',
  Knockdown = 'knockdown',
  KnockedOut = 'knockedOut',
  /** Showing off: cannot act, earns meter if it ends without being hit. */
  Taunt = 'taunt',
}

export interface FighterAction {
  kind: ActionKind;
  /** Ticks since the action started. */
  frame: number;
  /** Ticks the action lasts (0 = until changed). */
  duration: number;
  /** Attack being performed when kind is Attack. */
  move: MoveKind | null;
  /** Slot ids already hit by this attack, so one swing hits each target once. */
  hitIds: string[];
}

/** Combat numbers derived from roster stats once per match. */
export interface CombatProfile {
  maxHealth: number;
  damageScale: number;
  speedScale: number;
  sizeScale: number;
  /** How this fighter's meter finisher plays. */
  finisher: FinisherStyle;
}

export interface FighterState {
  /** Unique within the match, e.g. "t0s2". */
  slotId: string;
  /** Roster fighter id. */
  fighterId: string;
  team: TeamIndex;
  profile: CombatProfile;
  x: number;
  z: number;
  /** Unit facing direction on the floor. */
  facingX: number;
  facingZ: number;
  /** Knockback velocity, m/s. */
  pushX: number;
  pushZ: number;
  /** True while the fighter walked this tick (for animation). */
  moving: boolean;
  health: number;
  guard: number;
  meter: number;
  action: FighterAction;
  /** Hits taken in the current combo (reset when stun ends). */
  combo: number;
  /** Ticks left of invulnerability after getting up. */
  invulnerable: number;
  /** Total damage taken this match (for scoring). */
  damageTaken: number;
  /** Item in hand, thrown by the next punch. */
  holding: ItemKind | null;
  /** True once knocked off an open platform; such a fighter is out of the match. */
  ringedOut: boolean;
}

/** Throwable items that appear on the floor when extras are on; the kind only changes the look. */
export enum ItemKind {
  Briefcase = 'briefcase',
  Gavel = 'gavel',
  MoneyBag = 'money-bag',
}

/** An item lying on the floor, waiting to be picked up. */
export interface ItemState {
  id: string;
  kind: ItemKind;
  x: number;
  z: number;
}

/** A falling anvil: its shadow marks the spot until it lands. */
export interface HazardState {
  id: string;
  x: number;
  z: number;
  /** Ticks until impact. */
  ticksLeft: number;
}

/** A thrown finisher or item in flight. */
export interface ProjectileState {
  /** Unique within the match: thrower slot and tick. */
  id: string;
  /** Slot id of the thrower. */
  owner: string;
  team: TeamIndex;
  x: number;
  z: number;
  /** Unit flight direction on the floor. */
  dirX: number;
  dirZ: number;
  ticksLeft: number;
  /** Move that threw it: the finisher or a picked-up item. */
  move: MoveKind;
  /** The thrown item, or null for a finisher projectile. */
  item: ItemKind | null;
}

export enum MatchPhase {
  Fighting = 'fighting',
  Over = 'over',
}

export enum EndReason {
  KnockOut = 'knockOut',
  TimeOver = 'timeOver',
}

export type FightEvent =
  | { kind: 'swing'; attacker: string; move: MoveKind }
  | { kind: 'throw'; attacker: string; projectile: string }
  | { kind: 'taunt'; fighter: string }
  | { kind: 'pickup'; fighter: string; item: ItemKind }
  | { kind: 'hazard'; id: string; x: number; z: number }
  | { kind: 'crash'; id: string; x: number; z: number }
  | { kind: 'ringOut'; target: string; x: number; z: number }
  | { kind: 'hazardHit'; target: string; damage: number; x: number; z: number }
  | { kind: 'tauntDone'; fighter: string; meter: number }
  | { kind: 'hit'; attacker: string; target: string; move: MoveKind; damage: number; x: number; z: number }
  | { kind: 'block'; attacker: string; target: string; move: MoveKind; x: number; z: number }
  | { kind: 'guardBreak'; target: string }
  | { kind: 'knockdown'; target: string }
  | { kind: 'ko'; target: string; by: string }
  | { kind: 'matchOver'; winner: TeamIndex | null; reason: EndReason };

export interface MatchState {
  tick: number;
  ticksLeft: number;
  phase: MatchPhase;
  fighters: FighterState[];
  /** Thrown finishers and items in flight. */
  projectiles: ProjectileState[];
  /** Items lying on the floor. */
  items: ItemState[];
  /** Anvils on their way down. */
  hazards: HazardState[];
  /** True when items and hazards are on. */
  extras: boolean;
  /** True on an open platform where hard hits can knock fighters off. */
  ringOuts: boolean;
  /** Seed for the deterministic placement of items and hazards. */
  seed: number;
  winner: TeamIndex | null;
  events: FightEvent[];
}

/** An input that does nothing; used for knocked-out fighters and missing controllers. */
export const IDLE_INPUT: Readonly<FighterInput> = {
  moveX: 0, moveZ: 0, punch: false, kick: false, special: false, taunt: false, defend: false,
};
