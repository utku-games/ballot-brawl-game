/**
 * Turns a chosen rivalry, the side the player picked and a CPU difficulty into a 1v1 MatchPlan.
 * The player always fights on the left team so the HUD and the result read the same as in other modes.
 * The plan carries the rivalry's title as the intro banner and its twist for the simulation and the view.
 */
import { Difficulty, DIFFICULTY_LEVEL } from '../ai/aiProfile';
import { PlayerId } from '../input/controlFrame';
import type { Rivalry } from '../rivalry/rivalryTypes';
import type { MatchPlan, SlotPlan } from './matchPlan';

export enum RivalrySide {
  Left = 'left',
  Right = 'right',
}

/** Damage multiplier for both fighters; rivalries are even fights. */
const EVEN_DAMAGE = 1;

function slot(fighterId: string, player: PlayerId | null, level: number): SlotPlan {
  return { fighterId, player, cpuLevel: level, damageScale: EVEN_DAMAGE, boss: false };
}

/** The fighter the player controls for a side. */
export function playerFighter(rivalry: Readonly<Rivalry>, side: RivalrySide): string {
  return side === RivalrySide.Left ? rivalry.left : rivalry.right;
}

export function rivalryMatchPlan(rivalry: Readonly<Rivalry>, side: RivalrySide, difficulty: Difficulty, seed: number): MatchPlan {
  const level = DIFFICULTY_LEVEL[difficulty];
  const mine = playerFighter(rivalry, side);
  const theirs = side === RivalrySide.Left ? rivalry.right : rivalry.left;
  return {
    teams: [[slot(mine, PlayerId.One, level)], [slot(theirs, null, level)]],
    arena: rivalry.arena,
    seed,
    banner: rivalry.title,
    twist: rivalry.twist,
    extras: false,
  };
}
