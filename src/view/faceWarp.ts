/**
 * Pure facial-expression warp for the photo sticker heads: moves texture points around the eyes and mouth.
 * Hurt squints the eyes and drops the jaw, happy stretches the mouth into a grin with raised corners, knocked out shuts the eyes.
 * Coordinates are face-texture units (0..1, origin top left) and the landmarks come from the face pipeline.
 */
import type { FaceLandmarks } from '../roster/credits';

export interface Expression {
  /** 0..1 strength of each expression; they can mix. */
  hurt: number;
  happy: number;
  ko: number;
}

export const NEUTRAL: Readonly<Expression> = { hurt: 0, happy: 0, ko: 0 };

const EYE_SIGMA = 0.07;
const SQUINT_HURT = 0.6;
const SQUINT_KO = 0.85;
const SQUINT_HAPPY = 0.3;
const MOUTH_SIGMA_SCALE = 0.75;
const MOUTH_SIGMA_MIN = 0.06;
const JAW_DROP = 0.1;
const JAW_KO = 0.4;
const GRIN_STRETCH = 0.55;
const GRIN_LIFT = 0.6;

function gauss(du: number, dv: number, sigma: number): number {
  return Math.exp(-(du * du + dv * dv) / (2 * sigma * sigma));
}

/** Displacement (texture units) of the texture point (u, y) for an expression. */
export function warpPoint(u: number, y: number, lm: Readonly<FaceLandmarks>, e: Readonly<Expression>): { du: number; dy: number } {
  let du = 0;
  let dy = 0;
  const squint = Math.min(1, SQUINT_HURT * e.hurt + SQUINT_KO * e.ko + SQUINT_HAPPY * e.happy);
  for (const eye of [lm.eyeA, lm.eyeB]) {
    dy += (eye.y - y) * gauss(u - eye.x, y - eye.y, EYE_SIGMA) * squint;
  }
  const sigma = Math.max(MOUTH_SIGMA_MIN, lm.mouthWidth * MOUTH_SIGMA_SCALE);
  const w = gauss(u - lm.mouth.x, y - lm.mouth.y, sigma);
  const open = e.hurt + JAW_KO * e.ko;
  if (y > lm.mouth.y) dy += open * JAW_DROP * w;
  du += (u - lm.mouth.x) * w * GRIN_STRETCH * e.happy;
  dy -= Math.abs(u - lm.mouth.x) * w * GRIN_LIFT * e.happy;
  return { du, dy };
}

/** True when an expression is close enough to neutral that the mesh can stay unwarped. */
export function isNeutral(e: Readonly<Expression>): boolean {
  return e.hurt < 1e-3 && e.happy < 1e-3 && e.ko < 1e-3;
}
