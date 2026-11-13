/**
 * Pure procedural animation: turns a fighter's action, frame and movement into joint angles for the bobblehead rig.
 * Attack poses follow the real move frame data, including each finisher style, so a punch visibly lands exactly on
 * the simulation's active frames; taunts, the match intro and wins play the fighter's own gesture.
 * Angles are in radians: positive arm or leg pitch swings the limb forward, positive lean tips the torso forward.
 */
import { ActionKind } from '../fight/fightTypes';
import { MoveKind, moveData, type MoveData } from '../fight/moves';
import { FinisherStyle, type Gesture } from '../roster/signatureTypes';
import { gesturePose } from './gesturePoses';
import { GUARD_ARM, STANDING_POSE, type Pose } from './poseTypes';

export { STANDING_POSE, type Pose } from './poseTypes';

/** How the match ended for this fighter's team; drives celebration and defeat poses. */
export enum Mood {
  None = 'none',
  Win = 'win',
  Lose = 'lose',
}

export interface PoseInput {
  kind: ActionKind;
  frame: number;
  duration: number;
  move: MoveKind | null;
  moving: boolean;
  /** Seconds since the match started (drives idle and walk cycles). */
  time: number;
  mood: Mood;
  /** Seconds since this fighter was knocked out, or a negative number while still standing. */
  koSeconds: number;
  /** The fighter's finisher style, which shapes the finisher animation. */
  style: FinisherStyle;
  /** The fighter's personal gesture for taunts, the intro and wins. */
  gesture: Gesture;
  /** True during the match intro, when every fighter shows off their gesture. */
  intro: boolean;
}

const IDLE_BOB = 0.03;
const IDLE_RATE = 3;
const WALK_RATE = 11;
const WALK_LEG = 0.6;
const WALK_ARM = 0.45;
const DEFEND_ARM = 1.25;
const HIT_LEAN = -0.4;
const DIZZY_RATE = 8;
const DIZZY_TILT = 0.3;
/** Seconds a knocked-out fighter takes to hit the floor, and the height of the bounce when they land. */
export const KO_FALL_SECONDS = 0.45;
const KO_BOUNCE = 0.08;
const KO_BOUNCE_SECONDS = 0.25;
const LOSE_LEAN = 0.55;
const LOSE_SWAY_RATE = 1.5;
const LOSE_SWAY = 0.12;
/** Ticks to fall over and to stand back up during a knockdown. */
const FALL_TICKS = 10;
const TICKS_PER_SECOND = 60;
const RUSH_STRIDE_RATE = 0.9;
const RUSH_STRIDE = 0.7;
const GETUP_TICKS = 12;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

/** Where an attack is: 0..1 through startup, then active, then recovery. */
export function attackPhase(m: Readonly<MoveData>, frame: number): { phase: 'startup' | 'active' | 'recovery'; t: number } {
  if (frame < m.startup) return { phase: 'startup', t: frame / m.startup };
  if (frame < m.startup + m.active) return { phase: 'active', t: (frame - m.startup) / m.active };
  return { phase: 'recovery', t: (frame - m.startup - m.active) / m.recovery };
}

/** Wind-up value, full-extension value, and lerp between them by phase. */
function swing(move: Readonly<MoveData>, frame: number, windUp: number, extend: number, rest: number): number {
  const { phase, t } = attackPhase(move, frame);
  if (phase === 'startup') return lerp(rest, windUp, t);
  if (phase === 'active') return extend;
  return lerp(extend, rest, t);
}

function finisherPose(style: FinisherStyle, frame: number): Pose {
  const m = moveData(MoveKind.Finisher, style);
  if (style === FinisherStyle.Rush) {
    const stride = Math.sin(frame * RUSH_STRIDE_RATE) * RUSH_STRIDE;
    return { ...STANDING_POSE, armL: swing(m, frame, -0.6, 1.7, GUARD_ARM), armR: swing(m, frame, -0.6, 1.7, GUARD_ARM), lean: swing(m, frame, -0.2, 0.6, 0), legL: stride, legR: -stride };
  }
  if (style === FinisherStyle.Throw) {
    return { ...STANDING_POSE, armR: swing(m, frame, 3.2, 1.3, GUARD_ARM), armL: 0.8, lean: swing(m, frame, -0.3, 0.35, 0) };
  }
  if (style === FinisherStyle.Quake) {
    const arms = swing(m, frame, 3, 0.4, GUARD_ARM);
    return { ...STANDING_POSE, armL: arms, armR: arms, bob: swing(m, frame, 0.45, -0.08, 0), lean: swing(m, frame, -0.2, 0.5, 0) };
  }
  const arms = swing(m, frame, 3, 1.2, GUARD_ARM);
  return { ...STANDING_POSE, armL: arms, armR: arms, lean: swing(m, frame, -0.3, 0.45, 0), bob: swing(m, frame, 0.15, -0.05, 0) };
}

function attackPose(move: MoveKind, frame: number, style: FinisherStyle): Pose {
  const m = moveData(move, style);
  if (move === MoveKind.Punch) {
    return { ...STANDING_POSE, armR: swing(m, frame, -0.5, 1.6, GUARD_ARM), lean: swing(m, frame, -0.1, 0.25, 0) };
  }
  if (move === MoveKind.Kick) {
    return { ...STANDING_POSE, legR: swing(m, frame, -0.4, 1.5, 0), lean: swing(m, frame, 0.1, -0.3, 0), armL: 0.8, armR: -0.3 };
  }
  if (move === MoveKind.Item) {
    return { ...STANDING_POSE, armR: swing(m, frame, 3, 1.4, GUARD_ARM), lean: swing(m, frame, -0.2, 0.3, 0) };
  }
  return finisherPose(style, frame);
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

/** Fall amount and bounce of a knocked-out fighter, from the seconds since the knockout. */
export function koFall(seconds: number): { fall: number; bob: number } {
  if (seconds < 0) return { fall: 0, bob: 0 };
  const t = seconds / KO_FALL_SECONDS;
  if (t < 1) return { fall: t * t, bob: 0 };
  const b = (seconds - KO_FALL_SECONDS) / KO_BOUNCE_SECONDS;
  return { fall: 1, bob: b < 1 ? Math.sin(b * Math.PI) * KO_BOUNCE : 0 };
}

function moodPose(mood: Mood, time: number, gesture: Gesture): Pose | null {
  if (mood === Mood.Win) return gesturePose(gesture, time);
  if (mood === Mood.Lose) {
    return { ...STANDING_POSE, armL: -0.1, armR: -0.1, lean: LOSE_LEAN, tilt: Math.sin(time * LOSE_SWAY_RATE) * LOSE_SWAY, bob: -0.05 };
  }
  return null;
}

export function computePose(input: Readonly<PoseInput>): Pose {
  if (input.kind === ActionKind.KnockedOut) {
    const ko = koFall(input.koSeconds);
    return { ...STANDING_POSE, fall: ko.fall, bob: ko.bob, armL: 2.2, armR: 2.2, legL: 0.3 };
  }
  const celebrating = moodPose(input.mood, input.time, input.gesture);
  if (celebrating) return celebrating;
  if (input.intro) return gesturePose(input.gesture, input.time);
  switch (input.kind) {
    case ActionKind.Attack:
      return input.move ? attackPose(input.move, input.frame, input.style) : { ...STANDING_POSE };
    case ActionKind.Taunt:
      return gesturePose(input.gesture, input.frame / TICKS_PER_SECOND);
    case ActionKind.Defend:
      return { ...(input.moving ? movingPose(input.time * 0.5) : STANDING_POSE), armL: DEFEND_ARM, armR: DEFEND_ARM, lean: 0.1 };
    case ActionKind.Hitstun:
      return { ...STANDING_POSE, lean: HIT_LEAN * (1 - input.frame / Math.max(1, input.duration)), armL: 0.9, armR: 0.7 };
    case ActionKind.GuardBroken:
      return { ...STANDING_POSE, armL: -0.2, armR: -0.2, tilt: Math.sin(input.time * DIZZY_RATE) * DIZZY_TILT };
    case ActionKind.Knockdown:
      return { ...STANDING_POSE, fall: knockdownFall(input.frame, input.duration), armL: 1.4, armR: 1.4 };
    default:
      return input.moving ? movingPose(input.time) : { ...STANDING_POSE, bob: Math.sin(input.time * IDLE_RATE) * IDLE_BOB };
  }
}

/** How flat a skirt folds once its wearer lies on the floor, as a fraction of its radius. */
export const SKIRT_FOLD = 0.3;

export interface SkirtFold {
  /** Scale across the skirt's floor-facing axis. */
  scale: number;
  /** Lift along that axis, so the flattened skirt rests on the floor instead of sinking into it. */
  lift: number;
}

/** Folds a skirt of the given hem radius as the body falls (fall 0 standing, 1 flat on the floor). */
export function skirtFold(fall: number, radius: number): SkirtFold {
  const f = Math.min(1, Math.max(0, fall));
  const scale = 1 - (1 - SKIRT_FOLD) * f;
  return { scale, lift: radius * SKIRT_FOLD * f * 0.5 };
}
