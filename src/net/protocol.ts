/**
 * The online protocol: every message the host and guest exchange, and parseMessage, which checks an incoming value.
 * Lobby messages carry fighter picks, the host's arena and items choice and the start of a match; during a match the
 * guest sends control frames and the host sends match states.
 * Parsing rejects unknown kinds, wrong field types, unknown fighters or arenas and other protocol versions with NetProtocolError.
 */
import { NetProtocolError } from '../core/errors';
import type { MatchState } from '../fight/fightTypes';
import type { ControlFrame } from '../input/controlFrame';
import { ROSTER } from '../roster/roster';
import { ArenaKind } from '../view/arenaKinds';

/** Bumped whenever a message or the match state changes shape; both sides must match. */
export const PROTOCOL_VERSION = 1;

export enum MsgKind {
  Hello = 'hello',
  Pick = 'pick',
  Settings = 'settings',
  Start = 'start',
  Input = 'input',
  State = 'state',
  Leave = 'leave',
}

/** Everything both sides need to build the same match. */
export interface StartInfo {
  hostFighter: string;
  guestFighter: string;
  arena: ArenaKind;
  extras: boolean;
  seed: number;
}

export type NetMessage =
  | { kind: MsgKind.Hello; version: number }
  | { kind: MsgKind.Pick; fighterId: string }
  | { kind: MsgKind.Settings; arena: ArenaKind; extras: boolean }
  | ({ kind: MsgKind.Start } & StartInfo)
  | { kind: MsgKind.Input; frame: ControlFrame }
  | { kind: MsgKind.State; state: MatchState }
  | { kind: MsgKind.Leave };

type Fields = Record<string, unknown>;

const FRAME_NUMBERS = ['moveX', 'moveY'] as const;
const FRAME_FLAGS = ['punch', 'kick', 'special', 'taunt', 'swap', 'pause', 'defend'] as const;
const ARENAS: ReadonlySet<string> = new Set(Object.values(ArenaKind));

function fail(why: string): never {
  throw new NetProtocolError(`Bad message: ${why}`);
}

function fighter(v: unknown): string {
  if (typeof v !== 'string' || !ROSTER.some((f) => f.id === v)) fail('unknown fighter');
  return v;
}

function arena(v: unknown): ArenaKind {
  if (typeof v !== 'string' || !ARENAS.has(v)) fail('unknown arena');
  return v as ArenaKind;
}

function flag(v: unknown): boolean {
  if (typeof v !== 'boolean') fail('expected a boolean');
  return v;
}

function finite(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) fail('expected a number');
  return v;
}

function frame(v: unknown): ControlFrame {
  if (typeof v !== 'object' || v === null) fail('missing frame');
  const f = v as Fields;
  const out = {} as Record<string, number | boolean>;
  for (const k of FRAME_NUMBERS) out[k] = Math.max(-1, Math.min(1, finite(f[k])));
  for (const k of FRAME_FLAGS) out[k] = flag(f[k]);
  return out as unknown as ControlFrame;
}

function state(v: unknown): MatchState {
  const s = v as Fields | null;
  if (typeof s !== 'object' || s === null || !Array.isArray(s.fighters) || !Array.isArray(s.events)) fail('bad state');
  finite(s.tick);
  return s as unknown as MatchState;
}

function parseStart(m: Fields): NetMessage {
  return {
    kind: MsgKind.Start,
    hostFighter: fighter(m.hostFighter),
    guestFighter: fighter(m.guestFighter),
    arena: arena(m.arena),
    extras: flag(m.extras),
    seed: finite(m.seed),
  };
}

/** Checks an incoming value and returns it as a typed message; throws NetProtocolError when it is not one. */
export function parseMessage(data: unknown): NetMessage {
  if (typeof data !== 'object' || data === null) fail('not an object');
  const m = data as Fields;
  switch (m.kind) {
    case MsgKind.Hello: {
      const version = finite(m.version);
      if (version !== PROTOCOL_VERSION) fail('other game version');
      return { kind: MsgKind.Hello, version };
    }
    case MsgKind.Pick: return { kind: MsgKind.Pick, fighterId: fighter(m.fighterId) };
    case MsgKind.Settings: return { kind: MsgKind.Settings, arena: arena(m.arena), extras: flag(m.extras) };
    case MsgKind.Start: return parseStart(m);
    case MsgKind.Input: return { kind: MsgKind.Input, frame: frame(m.frame) };
    case MsgKind.State: return { kind: MsgKind.State, state: state(m.state) };
    case MsgKind.Leave: return { kind: MsgKind.Leave };
    default: return fail('unknown kind');
  }
}
