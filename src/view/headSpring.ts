/**
 * The bobblehead wobble: a damped spring on the head's sideways and forward tilt.
 * Hits, steps and landings add velocity impulses and the spring pulls the head back upright with a springy overshoot.
 * It is pure and frame-rate independent so it can be tested without rendering.
 */

export interface SpringState {
  x: number;
  z: number;
  vx: number;
  vz: number;
}

export const SPRING_STIFFNESS = 70;
export const SPRING_DAMPING = 5;
/** Largest tilt the head can reach, radians. */
export const MAX_TILT = 0.7;
/** Sub-steps used per update for stability at low frame rates. */
const MAX_SUBSTEP = 1 / 120;

export const RESTING_SPRING: Readonly<SpringState> = { x: 0, z: 0, vx: 0, vz: 0 };

export function kickSpring(state: Readonly<SpringState>, impulseX: number, impulseZ: number): SpringState {
  return { ...state, vx: state.vx + impulseX, vz: state.vz + impulseZ };
}

export function stepSpring(state: Readonly<SpringState>, dt: number): SpringState {
  let { x, z, vx, vz } = state;
  let left = Math.max(0, dt);
  while (left > 0) {
    const h = Math.min(MAX_SUBSTEP, left);
    vx += (-SPRING_STIFFNESS * x - SPRING_DAMPING * vx) * h;
    vz += (-SPRING_STIFFNESS * z - SPRING_DAMPING * vz) * h;
    x = Math.max(-MAX_TILT, Math.min(MAX_TILT, x + vx * h));
    z = Math.max(-MAX_TILT, Math.min(MAX_TILT, z + vz * h));
    left -= h;
  }
  return { x, z, vx, vz };
}
