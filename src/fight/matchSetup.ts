/**
 * Builds the opening MatchState from two team lists of roster fighters and their combat profiles.
 * Two teams line up facing each other on either side of the centre; three or four sides (party free-for-all) stand
 * around a circle facing the centre.
 * Team sizes outside 1..4 raise MatchSetupError so a bad menu choice never reaches the simulation.
 */
import { MatchSetupError } from '../core/errors';
import {
  GUARD_MAX, MATCH_TIME_TICKS, MAX_TEAM_SIZE, MAX_TEAMS, MIN_TEAMS, PARTY_SPAWN_RADIUS, SPAWN_FRONT_X, SPAWN_ROW_SPACING_X,
  SPAWN_SPACING_Z,
} from './fightConstants';
import {
  ActionKind, MatchPhase, type CombatProfile, type FighterState, type MatchState, type TeamIndex,
} from './fightTypes';

export interface TeamEntry {
  fighterId: string;
  profile: CombatProfile;
}

export interface MatchSetup {
  /** Two to four sides of one to four fighters each. */
  teams: readonly (readonly TeamEntry[])[];
  /** True to spawn throwable items and hazards. */
  extras: boolean;
  /** Seed for item and hazard placement. */
  seed: number;
  /** True on an open platform where hard hits can knock fighters off. */
  ringOuts: boolean;
}

/** Slot id of the index-th fighter of a team, e.g. "t1s0". */
export function slotIdFor(team: TeamIndex, index: number): string {
  return `t${team}s${index}`;
}

interface Spawn {
  x: number;
  z: number;
  facingX: number;
  facingZ: number;
}

/** Two teams line up facing each other across the centre, as rows spread along the depth axis. */
function lineSpawn(team: TeamIndex, index: number, count: number): Spawn {
  const side = team === 0 ? -1 : 1;
  const row = index % 2;
  return { x: side * (SPAWN_FRONT_X + row * SPAWN_ROW_SPACING_X), z: (index - (count - 1) / 2) * SPAWN_SPACING_Z, facingX: -side, facingZ: 0 };
}

/** Three or four sides stand evenly around a circle facing the centre; teammates spread a little along it. */
function circleSpawn(team: TeamIndex, teamCount: number, index: number, count: number): Spawn {
  const angle = Math.PI + (team / teamCount) * Math.PI * 2 + (index - (count - 1) / 2) * (SPAWN_SPACING_Z / PARTY_SPAWN_RADIUS);
  const x = Math.cos(angle) * PARTY_SPAWN_RADIUS;
  const z = Math.sin(angle) * PARTY_SPAWN_RADIUS;
  return { x, z, facingX: -Math.cos(angle), facingZ: -Math.sin(angle) };
}

function spawnFighter(entry: Readonly<TeamEntry>, team: TeamIndex, teamCount: number, index: number, count: number): FighterState {
  const at = teamCount === MIN_TEAMS ? lineSpawn(team, index, count) : circleSpawn(team, teamCount, index, count);
  return {
    slotId: slotIdFor(team, index),
    fighterId: entry.fighterId,
    team,
    profile: { ...entry.profile },
    x: at.x,
    z: at.z,
    facingX: at.facingX,
    facingZ: at.facingZ,
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
    holding: null,
    ringedOut: false,
  };
}

export function createMatch(setup: Readonly<MatchSetup>): MatchState {
  if (setup.teams.length < MIN_TEAMS || setup.teams.length > MAX_TEAMS) {
    throw new MatchSetupError(`A match needs ${MIN_TEAMS} to ${MAX_TEAMS} teams, got ${setup.teams.length}`);
  }
  const fighters: FighterState[] = [];
  setup.teams.forEach((entries, teamIndex) => {
    if (entries.length < 1 || entries.length > MAX_TEAM_SIZE) {
      throw new MatchSetupError(`Team ${teamIndex} has ${entries.length} fighters; allowed 1..${MAX_TEAM_SIZE}`);
    }
    const team = teamIndex as TeamIndex;
    entries.forEach((entry, i) => fighters.push(spawnFighter(entry, team, setup.teams.length, i, entries.length)));
  });
  return {
    tick: 0, ticksLeft: MATCH_TIME_TICKS, phase: MatchPhase.Fighting, fighters, projectiles: [], items: [], hazards: [],
    extras: setup.extras, seed: setup.seed, ringOuts: setup.ringOuts, winner: null, events: [],
  };
}
