/**
 * Deep check of a match state streamed by the host, before the guest renders it.
 * It confirms the fighters are exactly the expected ones in order with finite positions and known actions, and that
 * every other list holds objects with finite floor positions, so a broken or hostile host cannot crash the guest.
 * Pure, and it throws NetProtocolError for the first problem it finds.
 */
import { NetProtocolError } from '../core/errors';
import { ActionKind, MatchPhase, type MatchState } from '../fight/fightTypes';

type Fields = Record<string, unknown>;

const ACTIONS: ReadonlySet<string> = new Set(Object.values(ActionKind));
const PHASES: ReadonlySet<string> = new Set(Object.values(MatchPhase));
const TEAMS: ReadonlySet<unknown> = new Set([0, 1, 2, 3]);
const FIGHTER_NUMBERS = ['x', 'z', 'facingX', 'facingZ', 'pushX', 'pushZ', 'health', 'guard', 'meter', 'combo', 'invulnerable', 'damageTaken'] as const;
const FLOOR_LISTS = ['projectiles', 'items', 'hazards'] as const;

function fail(why: string): never {
  throw new NetProtocolError(`Bad state: ${why}`);
}

function object(v: unknown, what: string): Fields {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(`${what} is not an object`);
  return v as Fields;
}

function finite(v: unknown, what: string): void {
  if (typeof v !== 'number' || !Number.isFinite(v)) fail(`${what} is not a number`);
}

function checkFighter(v: unknown, expectedId: string): void {
  const f = object(v, 'fighter');
  if (f.fighterId !== expectedId) fail('unexpected fighter');
  if (typeof f.slotId !== 'string' || !TEAMS.has(f.team) || typeof f.ringedOut !== 'boolean') fail('fighter fields');
  for (const k of FIGHTER_NUMBERS) finite(f[k], k);
  const action = object(f.action, 'action');
  if (typeof action.kind !== 'string' || !ACTIONS.has(action.kind)) fail('unknown action');
  finite(action.frame, 'action frame');
  finite(action.duration, 'action duration');
  object(f.profile, 'profile');
}

function checkFloorList(v: unknown, what: string): void {
  if (!Array.isArray(v)) fail(`${what} is not a list`);
  for (const item of v) {
    const o = object(item, what);
    finite(o.x, `${what} x`);
    finite(o.z, `${what} z`);
  }
}

/** Returns v as a MatchState when it is a sound state for a match between expectedFighters, in slot order. */
export function checkState(v: unknown, expectedFighters: readonly string[]): MatchState {
  const s = object(v, 'state');
  finite(s.tick, 'tick');
  finite(s.ticksLeft, 'ticksLeft');
  if (typeof s.phase !== 'string' || !PHASES.has(s.phase)) fail('unknown phase');
  if (s.winner !== null && !TEAMS.has(s.winner)) fail('bad winner');
  if (!Array.isArray(s.fighters) || s.fighters.length !== expectedFighters.length) fail('wrong fighter count');
  s.fighters.forEach((f, i) => checkFighter(f, expectedFighters[i]));
  for (const k of FLOOR_LISTS) checkFloorList(s[k], k);
  if (!Array.isArray(s.events) || s.events.some((e) => typeof object(e, 'event').kind !== 'string')) fail('bad events');
  return s as unknown as MatchState;
}
