/**
 * Pure procedural animation: turns a fighter's action, frame and movement into joint angles for the bobblehead rig.
 * Attack poses follow the real move frame data, so a punch visibly lands exactly on the simulation's active frames.
 * Angles are in radians: positive arm or leg pitch swings the limb forward, positive lean tips the torso forward.
 */
import { ActionKind } from '../fight/fightTypes';
import { MoveKind, MOVES } from '../fight/moves';

export interface Pose {
  armL: number;
  armR: number;
  legL: number;
  legR: number;
  lean: number;
  /** 0 standing, 1 lying flat on the back. */
  fall: number;
  /** Vertical body offset, meters. */
  bob: number;
  /** Sideways head tilt, radians. */
  tilt: number;
}

export interface PoseInput {
  kind: ActionKind;
  frame: number;
  duration: number;
  move: MoveKind | null;
  moving: boolean;
  /** Seconds since the match started (drives idle and walk cycles). */
  time: number;
}

const GUARD_ARM = 0.35;
const IDLE_BOB = 0.03;
const IDLE_RATE = 3;
const WALK_RATE = 11;
const WALK_LEG = 0.6;
const WALK_ARM = 0.45;
const DEFEND_ARM = 1.25;
const HIT_LEAN = -0.4;
const DIZZY_RATE = 8;
const DIZZY_TILT = 0.3;
/** Ticks to fall over and to stand back up during a knockdown. */
const FALL_TICKS = 10;
const GETUP_TICKS = 12;

export const STANDING_POSE: Readonly<Pose> = {
  armL: GUARD_ARM, armR: GUARD_ARM, legL: 0, legR: 0, lean: 0, fall: 0, bob: 0, tilt: 0,
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

/** Where an attack is: 0..1 through startup, then active, then recovery. */
export function attackPhase(move: MoveKind, frame: number): { phase: 'startup' | 'active' | 'recovery'; t: number } {
  const m = MOVES[move];
  if (frame < m.startup) return { phase: 'startup', t: frame / m.startup };
  if (frame < m.startup + m.active) return { phase: 'active', t: (frame - m.startup) / m.active };
  return { phase: 'recovery', t: (frame - m.startup - m.active) / m.recovery };
}

/** Wind-up value, full-extension value, and lerp between them by phase. */
function swing(move: MoveKind, frame: number, windUp: number, extend: number, rest: number): number {
  const { phase, t } = attackPhase(move, frame);
  if (phase === 'startup') return lerp(rest, windUp, t);
  if (phase === 'active') return extend;
  return lerp(extend, rest, t);
}

function attackPose(move: MoveKind, frame: number): Pose {
  if (move === MoveKind.Punch) {
    return { ...STANDING_POSE, armR: swing(move, frame, -0.5, 1.6, GUARD_ARM), lean: swing(move, frame, -0.1, 0.25, 0) };
  }
  if (move === MoveKind.Kick) {
    return { ...STANDING_POSE, legR: swing(move, frame, -0.4, 1.5, 0), lean: swing(move, frame, 0.1, -0.3, 0), armL: 0.8, armR: -0.3 };
  }
  const arms = swing(move, frame, 3, 1.2, GUARD_ARM);
  return { ...STANDING_POSE, armL: arms, armR: arms, lean: swing(move, frame, -0.3, 0.45, 0), bob: swing(move, frame, 0.15, -0.05, 0) };
}

function knockdownFall(frame: number, duration: number): number {
  if (frame < FALL_TICKS) return frame / FALL_TICKS;
  if (frame > duration - GETUP_TICKS) return (duration - frame) / GETUP_TICKS;
  return 1;
}

function movingPose(time: number): Pose {
  const s = Math.sin(time * WALK_RATE);
  return { ...STANDING_POSE, legL: s * WALK_LEG, legR: -s * WALK_LEG, armL: GUARD_ARM - s * WALK_ARM, armR: GUARD_ARM + s * WALK_ARM, bob: Math.abs(s) * IDLE_BOB };
}

export function computePose(input: Readonly<PoseInput>): Pose {
  switch (input.kind) {
    case ActionKind.Attack:
      return input.move ? attackPose(input.move, input.frame) : { ...STANDING_POSE };
    case ActionKind.Defend:
      return { ...(input.moving ? movingPose(input.time * 0.5) : STANDING_POSE), armL: DEFEND_ARM, armR: DEFEND_ARM, lean: 0.1 };
    case ActionKind.Hitstun:
      return { ...STANDING_POSE, lean: HIT_LEAN * (1 - input.frame / Math.max(1, input.duration)), armL: 0.9, armR: 0.7 };
    case ActionKind.GuardBroken:
      return { ...STANDING_POSE, armL: -0.2, armR: -0.2, tilt: Math.sin(input.time * DIZZY_RATE) * DIZZY_TILT };
    case ActionKind.Knockdown:
      return { ...STANDING_POSE, fall: knockdownFall(input.frame, input.duration), armL: 1.4, armR: 1.4 };
    case ActionKind.KnockedOut:
      return { ...STANDING_POSE, fall: Math.min(1, input.frame / FALL_TICKS), armL: 2.2, armR: 2.2, legL: 0.3 };
    default:
      return input.moving ? movingPose(input.time) : { ...STANDING_POSE, bob: Math.sin(input.time * IDLE_RATE) * IDLE_BOB };
  }
}
