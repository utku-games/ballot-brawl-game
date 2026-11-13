/**
 * The joint-angle pose every animation function produces for the bobblehead rig, and the neutral standing pose.
 * Angles are in radians: positive arm or leg pitch swings the limb forward (pi/2 points it ahead, pi straight up).
 * Kept apart from poseLogic so gesture and finisher pose modules can share it without import cycles.
 */

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

/** Arms held slightly forward, ready to fight. */
export const GUARD_ARM = 0.35;

export const STANDING_POSE: Readonly<Pose> = {
  armL: GUARD_ARM, armR: GUARD_ARM, legL: 0, legR: 0, lean: 0, fall: 0, bob: 0, tilt: 0,
};
