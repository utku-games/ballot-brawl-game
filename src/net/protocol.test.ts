/**
 * Tests for the online protocol parser: every valid message kind round-trips through JSON.
 * Malformed values (unknown kinds, fighters or arenas, wrong types, another protocol version) throw NetProtocolError.
 * Stick values are clamped to the -1..1 range so a bad peer cannot send superhuman movement.
 */
import { describe, expect, it } from 'vitest';
import { NetProtocolError } from '../core/errors';
import { EMPTY_FRAME } from '../input/controlFrame';
import { ArenaKind } from '../view/arenaKinds';
import { MsgKind, parseMessage, PROTOCOL_VERSION, type NetMessage } from './protocol';

function roundTrip(m: NetMessage): NetMessage {
  return parseMessage(JSON.parse(JSON.stringify(m)));
}

describe('protocol', () => {
  it('round-trips lobby messages', () => {
    const msgs: NetMessage[] = [
      { kind: MsgKind.Hello, version: PROTOCOL_VERSION },
      { kind: MsgKind.Pick, fighterId: 'goat' },
      { kind: MsgKind.Settings, arena: ArenaKind.Rooftop, extras: false },
      { kind: MsgKind.Start, hostFighter: 'goat', guestFighter: 'pig', arena: ArenaKind.Museum, extras: true, seed: 42 },
      { kind: MsgKind.Leave },
      { kind: MsgKind.Ping },
      { kind: MsgKind.Here, inLobby: false },
      { kind: MsgKind.Away, away: true },
    ];
    for (const m of msgs) expect(roundTrip(m)).toEqual(m);
  });

  it('round-trips an input frame and clamps the stick', () => {
    const m = roundTrip({ kind: MsgKind.Input, frame: { ...EMPTY_FRAME, moveX: 5, punch: true } });
    expect(m).toEqual({ kind: MsgKind.Input, frame: { ...EMPTY_FRAME, moveX: 1, punch: true } });
  });

  it('accepts a state with fighters and events', () => {
    const m = parseMessage({ kind: MsgKind.State, state: { tick: 3, fighters: [], events: [] } });
    expect(m.kind).toBe(MsgKind.State);
  });

  it('rejects malformed messages', () => {
    const bad: unknown[] = [
      null, 'hi', {}, { kind: 'nope' },
      { kind: MsgKind.Hello, version: PROTOCOL_VERSION + 1 },
      { kind: MsgKind.Hello, version: PROTOCOL_VERSION - 1 },
      { kind: MsgKind.Pick, fighterId: 'nobody' },
      { kind: MsgKind.Settings, arena: 'moon', extras: true },
      { kind: MsgKind.Start, hostFighter: 'goat', guestFighter: 'pig', arena: ArenaKind.Museum, extras: 'yes', seed: 1 },
      { kind: MsgKind.Input, frame: { ...EMPTY_FRAME, punch: 1 } },
      { kind: MsgKind.Input, frame: { ...EMPTY_FRAME, moveX: Number.NaN } },
      { kind: MsgKind.State, state: { tick: 1 } },
      { kind: MsgKind.Here, inLobby: 'yes' },
      { kind: MsgKind.Away, away: 'yes' },
    ];
    for (const b of bad) expect(() => parseMessage(b)).toThrow(NetProtocolError);
  });
});
