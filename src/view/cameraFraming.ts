/**
 * Pure camera framing: finds the point to look at and the distance needed to keep every standing fighter on screen.
 * The camera looks at the arena from the front and above, so width is limited by the horizontal field of view and depth
 * by the vertical one; portrait phones therefore pull the camera farther back automatically.
 * The result is clamped between a minimum and maximum distance.
 */

export interface FramingInput {
  points: ReadonlyArray<{ x: number; z: number }>;
  /** Viewport width / height. */
  aspect: number;
  /** Vertical field of view, radians. */
  fovY: number;
}

export interface Framing {
  targetX: number;
  targetZ: number;
  distance: number;
}

/** Empty space kept around the fighters, meters. */
export const FRAME_MARGIN = 1.8;
export const MIN_DISTANCE = 8;
export const MAX_DISTANCE = 22;
/** Depth spread counts less than width because the camera looks down at the floor. */
const DEPTH_WEIGHT = 0.9;

export function frameFighters(input: Readonly<FramingInput>): Framing {
  if (input.points.length === 0) return { targetX: 0, targetZ: 0, distance: MIN_DISTANCE };
  const xs = input.points.map((p) => p.x);
  const zs = input.points.map((p) => p.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const halfWidth = (maxX - minX) / 2 + FRAME_MARGIN;
  const halfDepth = ((maxZ - minZ) / 2) * DEPTH_WEIGHT + FRAME_MARGIN;
  const tanY = Math.tan(input.fovY / 2);
  const needed = Math.max(halfWidth / (tanY * Math.max(0.1, input.aspect)), halfDepth / tanY);
  return {
    targetX: (minX + maxX) / 2,
    targetZ: (minZ + maxZ) / 2,
    distance: Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, needed)),
  };
}
