/**
 * Pure camera framing: finds the point to look at and the distance needed to keep every standing fighter on screen.
 * The camera looks at the arena from the front and above, so width is limited by the horizontal field of view and depth
 * by the vertical one; portrait phones therefore pull the camera farther back automatically.
 * Overlays (HUD, touch buttons) are passed as insets: the fighters are fitted into the uncovered rectangle, clamped between
 * a minimum and maximum distance (the maximum grows on narrow screens until the arena's width fits), and pitch and yaw
 * shifts centre them in it; portrait screens also get a wider field of view.
 */
import { ARENA_HALF_WIDTH } from '../core/arena';
import type { ScreenInsets } from './screenInsets';

export interface FramingInput {
  points: ReadonlyArray<{ x: number; z: number }>;
  /** Viewport width / height. */
  aspect: number;
  /** Vertical field of view, radians. */
  fovY: number;
  /** Screen fractions covered by overlays; NO_INSETS for a clear screen. */
  insets: Readonly<ScreenInsets>;
}

export interface Framing {
  targetX: number;
  targetZ: number;
  distance: number;
  /** Radians to turn the camera about its own X axis (negative tilts down) so the fighters sit in the uncovered area. */
  pitchShift: number;
  /** Radians to turn the camera about its own Y axis (positive turns left). */
  yawShift: number;
}

/** Empty space kept around the fighters, meters. */
export const FRAME_MARGIN = 1.8;
export const MIN_DISTANCE = 8;
export const MAX_DISTANCE = 22;
/** Depth spread counts less than width because the camera looks down at the floor. */
const DEPTH_WEIGHT = 0.9;
/** Smallest aspect ratio used, so a degenerate viewport never divides by zero. */
const MIN_ASPECT = 0.1;
/** Vertical field of view on wide screens, and the wider one used on tall (portrait) screens, degrees. */
export const WIDE_FOV_DEGREES = 40;
export const TALL_FOV_DEGREES = 62;
/** Aspect ratios at and below which the tall field of view applies fully, and at and above which the wide one does. */
const TALL_ASPECT = 0.5;
const WIDE_ASPECT = 1;

/** The vertical field of view for a viewport aspect: wider on portrait screens so the arena's width still fits. */
export function fovForAspect(aspect: number): number {
  const t = Math.min(1, Math.max(0, (WIDE_ASPECT - aspect) / (WIDE_ASPECT - TALL_ASPECT)));
  return WIDE_FOV_DEGREES + (TALL_FOV_DEGREES - WIDE_FOV_DEGREES) * t;
}

/** The shifts that move the screen centre to the centre of the uncovered rectangle. */
function shifts(input: Readonly<FramingInput>): { pitchShift: number; yawShift: number } {
  const tanY = Math.tan(input.fovY / 2);
  const { top, bottom, left, right } = input.insets;
  return {
    pitchShift: -Math.atan((bottom - top) * tanY),
    yawShift: Math.atan((left - right) * tanY * Math.max(MIN_ASPECT, input.aspect)),
  };
}

export function frameFighters(input: Readonly<FramingInput>): Framing {
  const shift = shifts(input);
  if (input.points.length === 0) return { targetX: 0, targetZ: 0, distance: MIN_DISTANCE, ...shift };
  const xs = input.points.map((p) => p.x);
  const zs = input.points.map((p) => p.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const halfWidth = (maxX - minX) / 2 + FRAME_MARGIN;
  const halfDepth = ((maxZ - minZ) / 2) * DEPTH_WEIGHT + FRAME_MARGIN;
  const { top, bottom, left, right } = input.insets;
  const tanY = Math.tan(input.fovY / 2) * (1 - top - bottom);
  const aspect = (Math.max(MIN_ASPECT, input.aspect) * (1 - left - right)) / (1 - top - bottom);
  const needed = Math.max(halfWidth / (tanY * aspect), halfDepth / tanY);
  /** Far enough to show the whole arena's width, so a narrow screen may pull back past MAX_DISTANCE. */
  const arenaFit = (ARENA_HALF_WIDTH + FRAME_MARGIN) / (tanY * aspect);
  return {
    targetX: (minX + maxX) / 2,
    targetZ: (minZ + maxZ) / 2,
    distance: Math.min(Math.max(MAX_DISTANCE, arenaFit), Math.max(MIN_DISTANCE, needed)),
    ...shift,
  };
}
