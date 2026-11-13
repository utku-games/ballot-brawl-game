/**
 * Story mode scoring, driven by how much damage the player takes across the whole run.
 * Each cleared stage is worth more than the last and a fight without damage earns a perfect bonus; every point of
 * damage taken, in won or lost attempts, costs points. The rank letter is based on the average damage per cleared stage.
 */

/** Points for clearing the first stage, and the extra for each later stage. */
export const STAGE_CLEAR_POINTS = 1000;
export const STAGE_STEP_POINTS = 150;
/** Bonus for winning a fight without taking damage. */
export const PERFECT_BONUS = 500;
/** Points lost per point of damage taken. */
export const DAMAGE_PENALTY = 4;

export enum Rank {
  S = 'S',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

/** Highest average damage per cleared stage that still earns each rank, best first. */
const RANK_LIMITS: ReadonlyArray<readonly [Rank, number]> = [
  [Rank.S, 15],
  [Rank.A, 40],
  [Rank.B, 70],
  [Rank.C, 110],
];

export interface ScoreInput {
  /** Number of stages cleared (0..10). */
  stagesCleared: number;
  /** Fights won without taking damage. */
  perfects: number;
  /** Damage taken across every attempt of the run. */
  totalDamage: number;
}

export interface ScoreBreakdown {
  clearPoints: number;
  perfectPoints: number;
  damagePenalty: number;
  total: number;
  rank: Rank;
}

export function stagePoints(stageIndex: number): number {
  return STAGE_CLEAR_POINTS + STAGE_STEP_POINTS * stageIndex;
}

export function rankFor(stagesCleared: number, totalDamage: number): Rank {
  if (stagesCleared <= 0) return Rank.D;
  const average = totalDamage / stagesCleared;
  for (const [rank, limit] of RANK_LIMITS) if (average <= limit) return rank;
  return Rank.D;
}

/** Damage values that are negative or not numbers count as zero. */
export function safeDamage(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function scoreRun(input: Readonly<ScoreInput>): ScoreBreakdown {
  const totalDamage = safeDamage(input.totalDamage);
  let clearPoints = 0;
  for (let i = 0; i < input.stagesCleared; i += 1) clearPoints += stagePoints(i);
  const perfectPoints = input.perfects * PERFECT_BONUS;
  const damagePenalty = Math.round(totalDamage * DAMAGE_PENALTY);
  return {
    clearPoints,
    perfectPoints,
    damagePenalty,
    total: Math.max(0, clearPoints + perfectPoints - damagePenalty),
    rank: rankFor(input.stagesCleared, totalDamage),
  };
}
