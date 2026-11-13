/**
 * Turns a fighter's build into body dimensions: leg, torso and arm lengths, widths and limb thickness, in metres.
 * Average matches the original bobblehead rig; every other build is a named table of multipliers on Average.
 * Pure data with no Three.js, so the rig, the outfit part lists and the tests all share the same numbers.
 */
import { Build } from '../roster/lookTypes';

export interface BodyDims {
  legLength: number;
  legRadius: number;
  hipWidth: number;
  torsoHeight: number;
  torsoWidth: number;
  torsoDepth: number;
  armLength: number;
  limbRadius: number;
  shoulderWidth: number;
}

const LIMB_RADIUS = 0.09;
const LEG_RADIUS_RATIO = 1.2;
const AVERAGE: Readonly<BodyDims> = {
  legLength: 0.72,
  legRadius: LIMB_RADIUS * LEG_RADIUS_RATIO,
  hipWidth: 0.16,
  torsoHeight: 0.62,
  torsoWidth: 0.62,
  torsoDepth: 0.34,
  armLength: 0.58,
  limbRadius: LIMB_RADIUS,
  shoulderWidth: 0.38,
};

/** How far the torso pivot sits below the top of the legs. */
export const TORSO_OVERLAP = 0.05;
export const NECK_HEIGHT = 0.08;

interface Multipliers {
  leg: number;
  torsoH: number;
  torsoW: number;
  depth: number;
  arm: number;
  limb: number;
  shoulder: number;
}

const SAME: Readonly<Multipliers> = { leg: 1, torsoH: 1, torsoW: 1, depth: 1, arm: 1, limb: 1, shoulder: 1 };

const MULTIPLIERS: Readonly<Record<Build, Readonly<Multipliers>>> = {
  [Build.Average]: SAME,
  [Build.Tall]: { ...SAME, leg: 1.2, torsoH: 1.12, arm: 1.12 },
  [Build.Lanky]: { leg: 1.25, torsoH: 1.15, torsoW: 0.82, depth: 0.85, arm: 1.25, limb: 0.8, shoulder: 0.85 },
  [Build.Short]: { ...SAME, leg: 0.68, torsoH: 0.88, arm: 0.85 },
  [Build.Round]: { ...SAME, leg: 0.8, torsoW: 1.35, depth: 1.6, limb: 1.1, shoulder: 1.15 },
  [Build.Stocky]: { ...SAME, leg: 0.92, torsoW: 1.25, depth: 1.2, limb: 1.3, shoulder: 1.25 },
};

export function bodyDims(build: Build): BodyDims {
  const m = MULTIPLIERS[build];
  return {
    legLength: AVERAGE.legLength * m.leg,
    legRadius: AVERAGE.legRadius * m.limb,
    hipWidth: AVERAGE.hipWidth * m.shoulder,
    torsoHeight: AVERAGE.torsoHeight * m.torsoH,
    torsoWidth: AVERAGE.torsoWidth * m.torsoW,
    torsoDepth: AVERAGE.torsoDepth * m.depth,
    armLength: AVERAGE.armLength * m.arm,
    limbRadius: AVERAGE.limbRadius * m.limb,
    shoulderWidth: AVERAGE.shoulderWidth * m.shoulder,
  };
}

/** Height of the torso pivot above the floor. */
export function torsoPivotHeight(dims: Readonly<BodyDims>): number {
  return dims.legLength - TORSO_OVERLAP;
}

/** Height of the neck pivot above the floor. */
export function headPivotHeight(dims: Readonly<BodyDims>): number {
  return torsoPivotHeight(dims) + dims.torsoHeight + NECK_HEIGHT;
}
