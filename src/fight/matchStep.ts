/**
 * The deterministic fight step: given a MatchState and one input per fighter, produce the next MatchState.
 * Order per tick: timers, control (facing, actions, walking), hit resolution, projectiles, knockback, body separation,
 * walls, end check.
 * The input state is never mutated; fighters are cloned first, and the returned state lists this tick's events.
 */
import {
  EndReason, IDLE_INPUT, MatchPhase, type FightEvent, type FighterInput, type FighterState,
  type MatchState, type TeamIndex,
} from './fightTypes';
import { keepInArena, separateBodies, slideKnockback } from './bodyPhysics';
import { advanceTimers, controlFighter } from './fighterControl';
import { resolveAttacks } from './hitResolution';
import { spawnProjectiles, stepProjectiles } from './projectiles';
import { isAlive, livingOnTeam, teamHealthFraction } from './matchQueries';

function cloneFighter(f: Readonly<FighterState>): FighterState {
  return { ...f, profile: { ...f.profile }, action: { ...f.action, hitIds: [...f.action.hitIds] } };
}

interface Outcome {
  over: boolean;
  winner: TeamIndex | null;
  reason: EndReason;
}

function decideOutcome(fighters: readonly FighterState[], timeUp: boolean): Outcome {
  const alive0 = livingOnTeam(fighters, 0).length;
  const alive1 = livingOnTeam(fighters, 1).length;
  const ko = EndReason.KnockOut;
  if (alive0 === 0 && alive1 === 0) return { over: true, winner: null, reason: ko };
  if (alive0 === 0) return { over: true, winner: 1, reason: ko };
  if (alive1 === 0) return { over: true, winner: 0, reason: ko };
  const time = EndReason.TimeOver;
  if (!timeUp) return { over: false, winner: null, reason: time };
  const h0 = teamHealthFraction(fighters, 0);
  const h1 = teamHealthFraction(fighters, 1);
  if (h0 === h1) return { over: true, winner: null, reason: time };
  return { over: true, winner: h0 > h1 ? 0 : 1, reason: time };
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
  for (const f of fighters) slideKnockback(f);
  separateBodies(fighters);
  for (const f of fighters) keepInArena(f);
  const ticksLeft = Math.max(0, state.ticksLeft - 1);
  const result = decideOutcome(fighters, ticksLeft === 0);
  if (result.over) events.push({ kind: 'matchOver', winner: result.winner, reason: result.reason });
  return {
    tick: state.tick + 1,
    ticksLeft,
    phase: result.over ? MatchPhase.Over : MatchPhase.Fighting,
    fighters,
    projectiles: result.over ? [] : projectiles,
    winner: result.winner,
    events,
  };
}
