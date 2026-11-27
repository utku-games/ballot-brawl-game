/**
 * Poses of the directional moves and signature specials, timed to their frame data like the punch and kick: lunges, a headbutt, flips, spins, a bite, a leap, a counter stance, a shockwave and a grab.
 * Each pose winds up during startup, holds its strike through the active frames and settles back during recovery, so the hit lands where the simulation says it does.
 * Pure: frame in, joint angles out; poseLogic hands these moves over by kind.
 */
import { MoveKind, moveData, type DirectionalMove, type MoveData, type SpecialMove } from '../fight/moves';
import { FinisherStyle } from '../roster/signatureTypes';
import { GUARD_ARM, STANDING_POSE, type Pose } from './poseTypes';

const FULL_TURN = Math.PI * 2;
/** Body pitch of a bicycle kick at its peak: lying back in the air. */
const OVERHEAD_TILT = -1.4;
/** Turns a Tornado makes by the end of its active frames. */
const TORNADO_TURNS = 4;
/** Height of the Leap Slam's arc, meters. */
const LEAP_HEIGHT = 1;
/** Any style works: directional moves do not depend on the finisher. */
const ANY_STYLE = FinisherStyle.Smash;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

/** Wind-up during startup, the strike value through the active frames, back to rest during recovery. */
function swing(m: Readonly<MoveData>, frame: number, windUp: number, strike: number, rest: number): number {
  if (frame < m.startup) return lerp(rest, windUp, frame / m.startup);
  if (frame < m.startup + m.active) return strike;
  return lerp(strike, rest, (frame - m.startup - m.active) / m.recovery);
}

/** 0 at the start of the move to 1 at the end of its active frames, held at 1 through recovery. */
function through(m: Readonly<MoveData>, frame: number): number {
  return Math.min(1, frame / (m.startup + m.active));
}

type PoseBuilder = (m: Readonly<MoveData>, f: number) => Pose;

type AnimatedMove = DirectionalMove | SpecialMove;

const BUILDERS: Readonly<Record<AnimatedMove, PoseBuilder>> = {
  [MoveKind.FlyingPunch]: (m, f) => ({
    ...STANDING_POSE, armR: swing(m, f, -0.6, 1.7, GUARD_ARM), armL: swing(m, f, 0.2, -0.5, GUARD_ARM),
    lean: swing(m, f, -0.1, 0.9, 0), legL: swing(m, f, 0, -0.5, 0), legR: swing(m, f, 0, -0.3, 0), bob: swing(m, f, 0, 0.25, 0),
  }),
  [MoveKind.Headbutt]: (m, f) => ({
    ...STANDING_POSE, lean: swing(m, f, -0.5, 1, 0), armL: swing(m, f, GUARD_ARM, -0.6, GUARD_ARM), armR: swing(m, f, GUARD_ARM, -0.6, GUARD_ARM),
  }),
  [MoveKind.ShoulderCharge]: (m, f) => ({
    ...STANDING_POSE, lean: swing(m, f, 0.2, 0.6, 0), spin: swing(m, f, -0.3, -0.7, 0), armR: -0.2,
    legL: Math.sin(f * 0.9) * 0.6, legR: -Math.sin(f * 0.9) * 0.6,
  }),
  [MoveKind.Dropkick]: (m, f) => ({
    ...STANDING_POSE, legL: swing(m, f, -0.3, 1.6, 0), legR: swing(m, f, -0.3, 1.6, 0), lean: swing(m, f, 0, -0.9, 0),
    bob: swing(m, f, 0.1, 0.5, 0), armL: 1.2, armR: 1.2,
  }),
  [MoveKind.BicycleKick]: (m, f) => ({
    ...STANDING_POSE, flip: swing(m, f, -0.4, OVERHEAD_TILT, 0), bob: swing(m, f, 0.3, 0.8, 0),
    legR: swing(m, f, -0.5, 2.6, 0), legL: swing(m, f, 1.2, -0.4, 0), armL: 1.8, armR: 1.8,
  }),
  [MoveKind.SlideKick]: (m, f) => ({
    ...STANDING_POSE, legR: swing(m, f, 0.4, 1.5, 0), legL: swing(m, f, 0, -0.2, 0), lean: swing(m, f, -0.2, -0.8, 0),
    bob: swing(m, f, -0.1, -0.35, 0), armL: -0.5,
  }),
  [MoveKind.Uppercut]: (m, f) => ({
    ...STANDING_POSE, armR: swing(m, f, -0.4, 2.8, GUARD_ARM), lean: swing(m, f, 0.3, -0.25, 0), bob: swing(m, f, -0.1, 0.12, 0),
  }),
  [MoveKind.SpinningBackfist]: (m, f) => ({
    ...STANDING_POSE, spin: through(m, f) * FULL_TURN, armR: swing(m, f, GUARD_ARM, 1.5, GUARD_ARM), lean: swing(m, f, 0, 0.15, 0),
  }),
  [MoveKind.BackflipKick]: (m, f) => ({
    ...STANDING_POSE, flip: -through(m, f) * FULL_TURN, bob: swing(m, f, 0.4, 0.8, 0),
    legR: swing(m, f, -0.3, 2, 0), legL: swing(m, f, 0.3, 0.6, 0), armL: 2.4, armR: 2.4,
  }),
  [MoveKind.SpinKick]: (m, f) => ({
    ...STANDING_POSE, spin: through(m, f) * FULL_TURN, legR: swing(m, f, 0.2, 1.4, 0), lean: swing(m, f, 0, -0.2, 0), armL: 0.9, armR: -0.4,
  }),
  [MoveKind.Bite]: (m, f) => ({
    ...STANDING_POSE, lean: swing(m, f, -0.3, 0.9, 0), armL: swing(m, f, GUARD_ARM, -0.4, GUARD_ARM), armR: swing(m, f, GUARD_ARM, -0.4, GUARD_ARM), tilt: swing(m, f, 0, 0.25, 0),
  }),
  [MoveKind.Bullrush]: (m, f) => ({
    ...STANDING_POSE, lean: swing(m, f, 0.3, 0.75, 0), armL: 0.3, armR: 0.3, legL: Math.sin(f * 0.9) * 0.7, legR: -Math.sin(f * 0.9) * 0.7,
  }),
  [MoveKind.LeapSlam]: (m, f) => ({
    ...STANDING_POSE, bob: f < m.startup ? Math.sin((Math.PI * f) / m.startup) * LEAP_HEIGHT : swing(m, f, 0, -0.05, 0),
    armL: swing(m, f, 3, 1.2, GUARD_ARM), armR: swing(m, f, 3, 1.2, GUARD_ARM), legL: swing(m, f, 0.8, 0, 0), legR: swing(m, f, 0.8, 0, 0), lean: swing(m, f, -0.2, 0.5, 0),
  }),
  [MoveKind.Tornado]: (m, f) => ({
    ...STANDING_POSE, spin: through(m, f) * FULL_TURN * TORNADO_TURNS, armL: swing(m, f, GUARD_ARM, 1.5, GUARD_ARM), armR: swing(m, f, GUARD_ARM, 1.5, GUARD_ARM), bob: swing(m, f, 0, 0.1, 0),
  }),
  [MoveKind.Counter]: (m, f) => ({
    ...STANDING_POSE, armL: swing(m, f, 2.2, 2.2, GUARD_ARM), armR: swing(m, f, 2.2, 2.2, GUARD_ARM), lean: swing(m, f, -0.15, -0.15, 0), tilt: swing(m, f, 0.1, 0.1, 0),
  }),
  [MoveKind.Shockwave]: (m, f) => ({
    ...STANDING_POSE, armL: swing(m, f, -0.8, 1.8, GUARD_ARM), armR: swing(m, f, -0.8, 1.8, GUARD_ARM), lean: swing(m, f, -0.3, 0.4, 0), bob: swing(m, f, 0.1, 0, 0),
  }),
  [MoveKind.Grab]: (m, f) => ({
    ...STANDING_POSE, armL: f < m.startup + m.active ? swing(m, f, 0.6, 1.5, GUARD_ARM) : lerp(1.5, 3, (f - m.startup - m.active) / m.recovery),
    armR: f < m.startup + m.active ? swing(m, f, 0.6, 1.5, GUARD_ARM) : lerp(1.5, 3, (f - m.startup - m.active) / m.recovery), lean: swing(m, f, 0.1, 0.35, 0),
  }),
};

/** True for the moves this module animates (directional moves and signature specials). */
export function isDirectionalMove(move: MoveKind): move is AnimatedMove {
  return move in BUILDERS;
}

/** The pose of a directional move or signature special at a frame of it. */
export function directionalPose(move: AnimatedMove, frame: number): Pose {
  return BUILDERS[move](moveData(move, ANY_STYLE), frame);
}
