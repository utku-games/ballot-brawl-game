/**
 * A MatchPlan describes a match before it starts: who stands in each slot, who controls them, CPU skill and the arena.
 * Both brawl and story mode produce a plan; buildMatchSetup turns it into the simulation's MatchSetup.
 * Keeping this pure means mode logic can be tested without rendering anything.
 */
import { combatProfile } from '../fight/combatProfile';
import type { TeamIndex } from '../fight/fightTypes';
import type { MatchSetup, TeamEntry } from '../fight/matchSetup';
import { slotIdFor } from '../fight/matchSetup';
import type { PlayerId } from '../input/controlFrame';
import { fighterById } from '../roster/roster';
import type { ArenaKind } from '../view/arenaKinds';

export interface SlotPlan {
  fighterId: string;
  /** Local player controlling this slot at the start, or null for the CPU. */
  player: PlayerId | null;
  /** CPU skill level (0..1) used whenever the CPU drives this slot. */
  cpuLevel: number;
  damageScale: number;
  boss: boolean;
}

export interface MatchPlan {
  teams: readonly [readonly SlotPlan[], readonly SlotPlan[]];
  arena: ArenaKind;
  seed: number;
}

function entry(slot: Readonly<SlotPlan>): TeamEntry {
  return {
    fighterId: slot.fighterId,
    profile: combatProfile(
      fighterById(slot.fighterId).stats, { boss: slot.boss, damageScale: slot.damageScale }, fighterById(slot.fighterId).signature.style,
    ),
  };
}

export function buildMatchSetup(plan: Readonly<MatchPlan>): MatchSetup {
  return { teams: [plan.teams[0].map(entry), plan.teams[1].map(entry)] };
}

/** Initial player assignment: each player's first slot. */
export function initialAssignment(plan: Readonly<MatchPlan>): Map<PlayerId, string> {
  const out = new Map<PlayerId, string>();
  plan.teams.forEach((slots, team) => {
    slots.forEach((slot, i) => {
      if (slot.player && !out.has(slot.player)) out.set(slot.player, slotIdFor(team as TeamIndex, i));
    });
  });
  return out;
}

/** CPU skill per slot id. */
export function cpuLevels(plan: Readonly<MatchPlan>): Map<string, number> {
  const out = new Map<string, number>();
  plan.teams.forEach((slots, team) => slots.forEach((slot, i) => out.set(slotIdFor(team as TeamIndex, i), slot.cpuLevel)));
  return out;
}
