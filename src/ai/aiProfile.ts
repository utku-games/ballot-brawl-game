/**
 * Difficulty profiles for the CPU brain, interpolated from a single skill level between 0 (easiest) and 1 (hardest).
 * A profile sets how fast the CPU reacts, how often it attacks and defends, and how smartly it uses the finisher.
 * Brawl mode uses three named levels; story mode raises the level a little with every opponent.
 */

export interface AiProfile {
  /** Ticks between decisions (lower reacts faster). */
  reactionTicks: number;
  /** Chance to attack when an enemy is in reach, per decision. */
  attackChance: number;
  /** Chance to defend against a visible incoming attack, per decision. */
  defendChance: number;
  /** Fraction of attacks that are kicks rather than punches. */
  kickBias: number;
  /** Chance to fire a ready finisher when an enemy is in reach. */
  finisherChance: number;
  /** Below this guard fraction the CPU backs off instead of defending. */
  retreatGuard: number;
  /** True: focus the weakest nearby enemy instead of simply the nearest. */
  focusWeakest: boolean;
}

export enum Difficulty {
  Easy = 'easy',
  Normal = 'normal',
  Hard = 'hard',
}

export const DIFFICULTY_LEVEL: Readonly<Record<Difficulty, number>> = {
  [Difficulty.Easy]: 0.15,
  [Difficulty.Normal]: 0.5,
  [Difficulty.Hard]: 0.9,
};

type TunedFields = Omit<AiProfile, 'focusWeakest'>;

const EASIEST: Readonly<TunedFields> = {
  reactionTicks: 32, attackChance: 0.3, defendChance: 0.1, kickBias: 0.25, finisherChance: 0.2, retreatGuard: 0,
};
const HARDEST: Readonly<TunedFields> = {
  reactionTicks: 6, attackChance: 0.85, defendChance: 0.75, kickBias: 0.45, finisherChance: 0.95, retreatGuard: 0.3,
};
/** Skill level from which the CPU starts picking on the weakest enemy. */
const FOCUS_WEAKEST_LEVEL = 0.6;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Profile for a skill level; values outside 0..1 are clamped. */
export function profileForLevel(level: number): AiProfile {
  const t = Math.min(1, Math.max(0, level));
  return {
    reactionTicks: Math.round(lerp(EASIEST.reactionTicks, HARDEST.reactionTicks, t)),
    attackChance: lerp(EASIEST.attackChance, HARDEST.attackChance, t),
    defendChance: lerp(EASIEST.defendChance, HARDEST.defendChance, t),
    kickBias: lerp(EASIEST.kickBias, HARDEST.kickBias, t),
    finisherChance: lerp(EASIEST.finisherChance, HARDEST.finisherChance, t),
    retreatGuard: lerp(EASIEST.retreatGuard, HARDEST.retreatGuard, t),
    focusWeakest: t >= FOCUS_WEAKEST_LEVEL,
  };
}
