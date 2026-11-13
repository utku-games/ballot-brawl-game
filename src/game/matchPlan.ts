/**
 * A MatchPlan describes a match before it starts: who stands in each slot, who controls them, CPU skill and the arena.
 * Brawl, story and rivalry modes produce a plan; buildMatchSetup turns it into the simulation's MatchSetup, applying
 * any rivalry twist to both teams' combat profiles.
 * Keeping this pure means mode logic can be tested without rendering anything.
 */
import { combatProfile } from '../fight/combatProfile';
import type { TeamIndex } from '../fight/fightTypes';
import type { MatchSetup, TeamEntry } from '../fight/matchSetup';
import { slotIdFor } from '../fight/matchSetup';
import type { PlayerId } from '../input/controlFrame';
import { fighterById } from '../roster/roster';
import { Twist } from '../rivalry/rivalryTypes';
import { twistModifiers } from '../rivalry/twists';
import { arenaHasRingOuts, type ArenaKind } from '../view/arenaKinds';

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
  /** Shown instead of "READY?" during the intro (a rivalry title), or null. */
  banner: string | null;
  /** Rule twist for both teams; Twist.None for a normal fight. */
  twist: Twist;
  /** True to spawn throwable items and hazards. */
  extras: boolean;
}

/** Plan fields for an ordinary fight with no banner and no twist. */
export const PLAIN_FIGHT: Readonly<Pick<MatchPlan, 'banner' | 'twist' | 'extras'>> = { banner: null, twist: Twist.None, extras: false };

function entry(slot: Readonly<SlotPlan>, twist: Twist): TeamEntry {
  const def = fighterById(slot.fighterId);
  const base = combatProfile(def.stats, { boss: slot.boss, damageScale: slot.damageScale }, def.signature.style);
  const mods = twistModifiers(twist);
  return {
    fighterId: slot.fighterId,
    profile: { ...base, speedScale: base.speedScale * mods.speedScale, damageScale: base.damageScale * mods.damageScale },
  };
}

export function buildMatchSetup(plan: Readonly<MatchPlan>): MatchSetup {
  return {
    teams: [plan.teams[0].map((s) => entry(s, plan.twist)), plan.teams[1].map((s) => entry(s, plan.twist))],
    extras: plan.extras,
    seed: plan.seed,
    ringOuts: arenaHasRingOuts(plan.arena),
  };
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
