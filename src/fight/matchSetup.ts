/**
 * Builds the opening MatchState from two team lists of roster fighters and their combat profiles.
 * Teams line up facing each other on either side of the centre, spread along the depth axis.
 * Team sizes outside 1..4 raise MatchSetupError so a bad menu choice never reaches the simulation.
 */
import { MatchSetupError } from '../core/errors';
import {
  GUARD_MAX, MATCH_TIME_TICKS, MAX_TEAM_SIZE, SPAWN_FRONT_X, SPAWN_ROW_SPACING_X, SPAWN_SPACING_Z, TEAM_COUNT,
} from './fightConstants';
import {
  ActionKind, MatchPhase, type CombatProfile, type FighterState, type MatchState, type TeamIndex,
} from './fightTypes';

export interface TeamEntry {
  fighterId: string;
  profile: CombatProfile;
}

export interface MatchSetup {
  teams: readonly [readonly TeamEntry[], readonly TeamEntry[]];
}

/** Slot id of the index-th fighter of a team, e.g. "t1s0". */
export function slotIdFor(team: TeamIndex, index: number): string {
  return `t${team}s${index}`;
}

function spawnFighter(entry: Readonly<TeamEntry>, team: TeamIndex, index: number, count: number): FighterState {
  const side = team === 0 ? -1 : 1;
  const row = index % 2;
  return {
    slotId: slotIdFor(team, index),
    fighterId: entry.fighterId,
    team,
    profile: { ...entry.profile },
    x: side * (SPAWN_FRONT_X + row * SPAWN_ROW_SPACING_X),
    z: (index - (count - 1) / 2) * SPAWN_SPACING_Z,
    facingX: -side,
    facingZ: 0,
    pushX: 0,
    pushZ: 0,
    moving: false,
    health: entry.profile.maxHealth,
    guard: GUARD_MAX,
    meter: 0,
    action: { kind: ActionKind.Idle, frame: 0, duration: 0, move: null, hitIds: [] },
    combo: 0,
    invulnerable: 0,
    damageTaken: 0,
  };
}

export function createMatch(setup: Readonly<MatchSetup>): MatchState {
  if (setup.teams.length !== TEAM_COUNT) throw new MatchSetupError(`A match needs exactly ${TEAM_COUNT} teams`);
  const fighters: FighterState[] = [];
  setup.teams.forEach((entries, teamIndex) => {
    if (entries.length < 1 || entries.length > MAX_TEAM_SIZE) {
      throw new MatchSetupError(`Team ${teamIndex} has ${entries.length} fighters; allowed 1..${MAX_TEAM_SIZE}`);
    }
    const team = teamIndex as TeamIndex;
    entries.forEach((entry, i) => fighters.push(spawnFighter(entry, team, i, entries.length)));
  });
  return { tick: 0, ticksLeft: MATCH_TIME_TICKS, phase: MatchPhase.Fighting, fighters, projectiles: [], winner: null, events: [] };
}
