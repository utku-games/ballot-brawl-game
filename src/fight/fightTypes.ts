/**
 * State, input and event types of the deterministic fight simulation.
 * A MatchState holds every fighter of both teams; stepMatch turns it plus one FighterInput per fighter into the next state.
 * Events describe what happened during the last tick so the view, audio and HUD can react without diffing states.
 */
import type { FinisherStyle } from '../roster/signatureTypes';
import type { MoveKind } from './moves';

/** Side index: 0 is the left team (players by default), 1 the right team. */
export type TeamIndex = 0 | 1;

/** One tick of control for one fighter, from a player or the CPU. */
export interface FighterInput {
  /** Move intent on the floor: +x right, +z toward the camera; length 0..1. */
  moveX: number;
  moveZ: number;
  /** Fresh presses this tick. */
  punch: boolean;
  kick: boolean;
  special: boolean;
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
  winner: TeamIndex | null;
  events: FightEvent[];
}

/** An input that does nothing; used for knocked-out fighters and missing controllers. */
export const IDLE_INPUT: Readonly<FighterInput> = {
  moveX: 0, moveZ: 0, punch: false, kick: false, special: false, defend: false,
};
