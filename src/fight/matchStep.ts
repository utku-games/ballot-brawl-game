/**
 * The deterministic fight step: given a MatchState and one input per fighter, produce the next MatchState.
 * Order per tick: timers, control (facing, actions, walking), hit resolution, projectiles, items and hazards,
 * knockback, ring-outs, body separation, walls, end check.
 * The input state is never mutated; fighters are cloned first, and the returned state lists this tick's events.
 */
import {
  EndReason, IDLE_INPUT, MatchPhase, type FightEvent, type FighterInput, type FighterState, type HazardState,
  type ItemState, type MatchState, type TeamIndex,
} from './fightTypes';
import { keepInArena, separateBodies, slideKnockback } from './bodyPhysics';
import { advanceTimers, controlFighter } from './fighterControl';
import { resolveAttacks } from './hitResolution';
import { spawnHazard, stepHazards } from './hazards';
import { dropFromFallen, pickUpItems, spawnItem } from './items';
import { spawnProjectiles, stepProjectiles } from './projectiles';
import { applyRingOuts, canRingOut, keepOnPlatform } from './ringOuts';
import { isAlive, livingOnTeam, teamHealthFraction } from './matchQueries';

function cloneFighter(f: Readonly<FighterState>): FighterState {
  return { ...f, profile: { ...f.profile }, action: { ...f.action, hitIds: [...f.action.hitIds] } };
}

interface Outcome {
  over: boolean;
  winner: TeamIndex | null;
  reason: EndReason;
}

function teamsIn(fighters: readonly FighterState[]): TeamIndex[] {
  return [...new Set(fighters.map((f) => f.team))].sort();
}

/** The match ends when at most one side has living fighters, or at time over with the healthiest side winning. */
function decideOutcome(fighters: readonly FighterState[], timeUp: boolean): Outcome {
  const teams = teamsIn(fighters);
  const standing = teams.filter((t) => livingOnTeam(fighters, t).length > 0);
  const ko = EndReason.KnockOut;
  if (standing.length === 0) return { over: true, winner: null, reason: ko };
  if (standing.length === 1) return { over: true, winner: standing[0], reason: ko };
  const time = EndReason.TimeOver;
  if (!timeUp) return { over: false, winner: null, reason: time };
  const health = standing.map((t) => teamHealthFraction(fighters, t));
  const best = Math.max(...health);
  const leaders = standing.filter((_, i) => health[i] === best);
  return { over: true, winner: leaders.length === 1 ? leaders[0] : null, reason: time };
}

/** On an open platform, rung-out fighters and fighters mid-knockback are not held in by the walls. */
function onOpenEdge(f: Readonly<FighterState>, ringOuts: boolean): boolean {
  return ringOuts && (f.ringedOut || canRingOut(f));
}

/** Items and hazards for this tick: lands falling anvils, drops items from fallen fighters, hands out and spawns items. */
function stepExtras(state: Readonly<MatchState>, fighters: FighterState[], events: FightEvent[]): { items: ItemState[]; hazards: HazardState[] } {
  const hazards = stepHazards(state.hazards, fighters, events);
  const items = pickUpItems([...state.items, ...dropFromFallen(fighters, state.tick)], fighters, events);
  if (!state.extras) return { items, hazards };
  const item = spawnItem(items, state.tick, state.seed);
  const hazard = spawnHazard(fighters, state.tick, state.seed, events);
  return { items: item ? [...items, item] : items, hazards: hazard ? [...hazards, hazard] : hazards };
}

/** Advances the match by one tick; a finished match is returned unchanged except for cleared events. */
export function stepMatch(state: Readonly<MatchState>, inputs: readonly Readonly<FighterInput>[]): MatchState {
  if (state.phase === MatchPhase.Over) return { ...state, events: [] };
  const fighters = state.fighters.map(cloneFighter);
  const events: FightEvent[] = [];
  for (const f of fighters) advanceTimers(f, events);
  fighters.forEach((f, i) => {
    if (isAlive(f)) controlFighter(f, inputs[i] ?? IDLE_INPUT, fighters, events);
    else f.moving = false;
  });
  resolveAttacks(fighters, events);
  const projectiles = [...stepProjectiles(state.projectiles, fighters, events), ...spawnProjectiles(fighters, state.tick, events)];
  const extras = stepExtras(state, fighters, events);
  for (const f of fighters) slideKnockback(f);
  if (state.ringOuts) applyRingOuts(fighters, events);
  separateBodies(fighters);
  fighters.forEach((f, i) => {
    if (onOpenEdge(f, state.ringOuts)) return;
    if (state.ringOuts) keepOnPlatform(f, state.fighters[i]);
    else keepInArena(f);
  });
  const ticksLeft = Math.max(0, state.ticksLeft - 1);
  const result = decideOutcome(fighters, ticksLeft === 0);
  if (result.over) events.push({ kind: 'matchOver', winner: result.winner, reason: result.reason });
  return {
    tick: state.tick + 1,
    ticksLeft,
    phase: result.over ? MatchPhase.Over : MatchPhase.Fighting,
    fighters,
    projectiles: result.over ? [] : projectiles,
    items: result.over ? [] : extras.items,
    hazards: result.over ? [] : extras.hazards,
    extras: state.extras,
    seed: state.seed,
    ringOuts: state.ringOuts,
    winner: result.winner,
    events,
  };
}
