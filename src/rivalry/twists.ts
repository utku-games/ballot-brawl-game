/**
 * Pure rules for rivalry twists: the speed and damage multipliers a twist gives both fighters, and Blackout lighting.
 * Blackout dims the arena in an irregular on-off pattern over time, like a failing power line.
 * The simulation and the view read these values; nothing here touches the DOM or the renderer.
 */
import { Twist } from './rivalryTypes';

export interface TwistModifiers {
  speedScale: number;
  damageScale: number;
}

/** Extra walking speed under Turbo and extra damage under Heavy Hitters. */
export const TURBO_SPEED = 1.35;
export const HEAVY_DAMAGE = 1.5;
/** Light level while the power is out (0 is black, 1 is normal). */
export const BLACKOUT_DIM = 0.12;
/** Seconds of one flicker cycle, and the share of it spent in the dark. */
const BLACKOUT_CYCLE = 2.6;
const BLACKOUT_DARK_SHARE = 0.35;
/** Fast stutter while the lights come back. */
const STUTTER_RATE = 40;
const STUTTER_SHARE = 0.08;

const NO_CHANGE: Readonly<TwistModifiers> = { speedScale: 1, damageScale: 1 };

export function twistModifiers(twist: Twist): TwistModifiers {
  if (twist === Twist.Turbo) return { ...NO_CHANGE, speedScale: TURBO_SPEED };
  if (twist === Twist.HeavyHitters) return { ...NO_CHANGE, damageScale: HEAVY_DAMAGE };
  return { ...NO_CHANGE };
}

/** Arena light level (0..1) at `seconds` into the fight; always 1 unless the twist is Blackout. */
export function blackoutLight(twist: Twist, seconds: number): number {
  if (twist !== Twist.Blackout || seconds < 0) return 1;
  const phase = (seconds % BLACKOUT_CYCLE) / BLACKOUT_CYCLE;
  if (phase < BLACKOUT_DARK_SHARE) return BLACKOUT_DIM;
  if (phase < BLACKOUT_DARK_SHARE + STUTTER_SHARE) return Math.sin(seconds * STUTTER_RATE) > 0 ? 1 : BLACKOUT_DIM;
  return 1;
}
