/**
 * Deterministic pseudo-random numbers for items and hazards, derived from the match seed, the tick and a salt.
 * The simulation keeps no random state, so the same seed and inputs always replay the same match.
 * A small integer hash spreads nearby inputs into unrelated values in 0..1.
 */

const MIX_A = 0x85ebca6b;
const MIX_B = 0xc2b2ae35;
const TICK_PRIME = 0x9e3779b1;
const SALT_PRIME = 0x27d4eb2f;
const UINT32 = 0x100000000;

function mix(x: number): number {
  let h = x >>> 0;
  h = Math.imul(h ^ (h >>> 16), MIX_A);
  h = Math.imul(h ^ (h >>> 13), MIX_B);
  return (h ^ (h >>> 16)) >>> 0;
}

/** A value in [0, 1) fixed by seed, tick and salt. */
export function extraRandom(seed: number, tick: number, salt: number): number {
  return mix(mix(seed) ^ Math.imul(tick, TICK_PRIME) ^ Math.imul(salt, SALT_PRIME)) / UINT32;
}
