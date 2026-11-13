/**
 * Arena geometry shared by the simulation and the view: a flat rectangular floor centred on the origin.
 * Fighters move on the X (left-right) and Z (toward the camera) axes and are kept inside the walls.
 * The clamp is pure so the deterministic fight simulation and its tests can use it directly.
 */

/** Half of the arena floor width along X, in meters. */
export const ARENA_HALF_WIDTH = 8;
/** Half of the arena floor depth along Z, in meters. */
export const ARENA_HALF_DEPTH = 4.5;

export interface FloorPoint {
  x: number;
  z: number;
}

/** Keeps a body of the given radius inside the arena walls. */
export function clampToArena(point: Readonly<FloorPoint>, radius: number): FloorPoint {
  const maxX = Math.max(0, ARENA_HALF_WIDTH - radius);
  const maxZ = Math.max(0, ARENA_HALF_DEPTH - radius);
  return {
    x: Math.min(maxX, Math.max(-maxX, point.x)),
    z: Math.min(maxZ, Math.max(-maxZ, point.z)),
  };
}

/** True when a point lies on the floor (radius 0), walls included. */
export function isInsideArena(point: Readonly<FloorPoint>): boolean {
  return Math.abs(point.x) <= ARENA_HALF_WIDTH && Math.abs(point.z) <= ARENA_HALF_DEPTH;
}
