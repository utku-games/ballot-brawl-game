/**
 * Each fighter's personal gesture as a looping pose over time: used for the match entrance, the taunt and the win.
 * The rig's arms only swing forward and back, so every gesture is built from arm pitch, lean, bounce and head tilt.
 * Pure functions of the gesture and the seconds since it started, tested without a renderer.
 */
import { Gesture } from '../roster/signatureTypes';
import { STANDING_POSE, type Pose } from './poseTypes';

/** Arm pitch for an arm raised straight up, and for one pointing straight ahead. */
const ARM_UP = 2.9;
const ARM_AHEAD = Math.PI / 2;

const CHEER_RATE = 9;
const CHEER_PUMP = 0.35;
const CHEER_ARM = 2.7;
const JUMP_RATE = 6;
const JUMP = 0.22;
const FLEX_RATE = 7;
const WAVE_RATE = 10;
const BOW_RATE = 2.2;
const BOW_LEAN = 0.75;
const POINT_RATE = 8;
const CONDUCT_RATE = 6;
const SALUTE_ARM = 2.55;
const THINK_RATE = 1.5;
const V_BOUNCE_RATE = 4;
const DIAMOND_ARM = 1.0;

function cheer(t: number): Pose {
  const pump = Math.sin(t * CHEER_RATE) * CHEER_PUMP;
  return { ...STANDING_POSE, armL: CHEER_ARM + pump, armR: CHEER_ARM - pump, bob: Math.abs(Math.sin(t * JUMP_RATE)) * JUMP };
}

function flex(t: number): Pose {
  const squeeze = Math.sin(t * FLEX_RATE) * 0.2;
  return { ...STANDING_POSE, armL: 2.1 + squeeze, armR: 2.1 + squeeze, lean: -0.12, bob: Math.abs(squeeze) * 0.2 };
}

function wave(t: number): Pose {
  return { ...STANDING_POSE, armR: ARM_UP - 0.3 + Math.sin(t * WAVE_RATE) * 0.35, armL: 0.1, tilt: Math.sin(t * WAVE_RATE / 2) * 0.12 };
}

function bow(t: number): Pose {
  const dip = (1 - Math.cos(t * BOW_RATE)) / 2;
  return { ...STANDING_POSE, armL: 0.05, armR: 0.9 * dip, lean: BOW_LEAN * dip };
}

function point(t: number): Pose {
  return { ...STANDING_POSE, armR: ARM_AHEAD + Math.sin(t * POINT_RATE) * 0.12, armL: 0.1, lean: 0.12 };
}

function conduct(t: number): Pose {
  return {
    ...STANDING_POSE, armR: 1.9 + Math.sin(t * CONDUCT_RATE) * 0.5, armL: 1.5 + Math.sin(t * CONDUCT_RATE + Math.PI / 2) * 0.35,
    bob: Math.abs(Math.sin(t * CONDUCT_RATE / 2)) * 0.05, tilt: Math.sin(t * CONDUCT_RATE / 2) * 0.15,
  };
}

function salute(t: number): Pose {
  return { ...STANDING_POSE, armR: SALUTE_ARM, armL: 0, lean: -0.06, bob: Math.sin(t * 2) * 0.01 };
}

function thinker(t: number): Pose {
  return { ...STANDING_POSE, armR: 2.1, armL: 0.75, tilt: 0.18 + Math.sin(t * THINK_RATE) * 0.05, lean: 0.08 };
}

function vSign(t: number): Pose {
  return { ...STANDING_POSE, armR: ARM_UP + 0.1, armL: 0.05, bob: Math.abs(Math.sin(t * V_BOUNCE_RATE)) * 0.08 };
}

function diamond(t: number): Pose {
  return { ...STANDING_POSE, armL: DIAMOND_ARM, armR: DIAMOND_ARM, bob: Math.sin(t * 2) * 0.01, tilt: 0.04 };
}

const GESTURES: Readonly<Record<Gesture, (t: number) => Pose>> = {
  [Gesture.Cheer]: cheer,
  [Gesture.Flex]: flex,
  [Gesture.Wave]: wave,
  [Gesture.Bow]: bow,
  [Gesture.Point]: point,
  [Gesture.Conduct]: conduct,
  [Gesture.Salute]: salute,
  [Gesture.Thinker]: thinker,
  [Gesture.VSign]: vSign,
  [Gesture.Diamond]: diamond,
};

/** The gesture's pose `seconds` after it started. */
export function gesturePose(gesture: Gesture, seconds: number): Pose {
  return GESTURES[gesture](Math.max(0, seconds));
}
