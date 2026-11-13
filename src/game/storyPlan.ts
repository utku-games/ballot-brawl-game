/**
 * Turns the current stage of a story run into a MatchPlan: the player's fighter alone against one CPU opponent.
 * The opponent's skill and damage come from the ladder stage, and the boss fights with boss size and health.
 * The arena is the category's own arena so every story feels like a home fixture.
 */
import { PlayerId } from '../input/controlFrame';
import { currentStage, type StoryRun } from '../story/storyRun';
import { ARENA_FOR_CATEGORY } from '../view/arenaKinds';
import { PLAIN_FIGHT, type MatchPlan } from './matchPlan';

/** Player-side skill used if the CPU ever drives the player's fighter (it never should in story mode). */
const PLAYER_SIDE_LEVEL = 0.5;
const SEED_STRIDE = 7919;

export function storyMatchPlan(run: Readonly<StoryRun>, attempt: number): MatchPlan {
  const stage = currentStage(run);
  return {
    teams: [
      [{ fighterId: run.fighterId, player: PlayerId.One, cpuLevel: PLAYER_SIDE_LEVEL, damageScale: 1, boss: false }],
      [{ fighterId: stage.opponentId, player: null, cpuLevel: stage.level, damageScale: stage.damageScale, boss: stage.boss }],
    ],
    arena: ARENA_FOR_CATEGORY[run.category],
    seed: run.stageIndex * SEED_STRIDE + attempt,
    ...PLAIN_FIGHT,
  };
}
