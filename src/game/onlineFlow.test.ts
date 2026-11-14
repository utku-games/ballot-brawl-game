/**
 * Tests for the online start handshake, with two flows joined by in-memory connections whose messages are delivered by hand.
 * Delivering by hand lets each test cross messages the way a slow network would, such as a guest closing the fighter
 * list while the host's Start is in flight.
 * The check is always that both sides begin the same match or neither does.
 */
import { describe, expect, it, vi } from 'vitest';
import type { PeerConnection } from '../net/peerLink';
import { MsgKind, type NetMessage } from '../net/protocol';
import { NetRole } from './matchNet';
import { OnlineFlow, type OnlineShell } from './onlineFlow';

const FIXED_RANDOM = 0.5;

/** One side: its flow, the messages it sent and not yet delivered, and how it reacts. */
interface Side {
  flow: OnlineFlow;
  outbox: NetMessage[];
  receive: (m: NetMessage) => void;
  shell: { [K in keyof OnlineShell]: ReturnType<typeof vi.fn> };
}

function side(role: NetRole): Side {
  const outbox: NetMessage[] = [];
  let receive: (m: NetMessage) => void = () => undefined;
  const conn = {
    send: (m: NetMessage) => void outbox.push(m),
    onMessage: (cb: (m: NetMessage) => void) => { receive = cb; },
    onClose: () => undefined,
    close: () => undefined,
  };
  const shell = { show: vi.fn(), showOverlay: vi.fn(), startMatch: vi.fn(), pickFighter: vi.fn(), showTitle: vi.fn() };
  const flow = new OnlineFlow(shell, () => FIXED_RANDOM);
  (flow as unknown as { connected: (c: PeerConnection, r: NetRole) => void }).connected(conn as unknown as PeerConnection, role);
  return { flow, outbox, receive: (m) => receive(m), shell };
}

/** Delivers everything from sends to the other side, in order. */
function flush(from: Side, to: Side): void {
  for (const m of from.outbox.splice(0)) to.receive(m);
}

function pickVia(s: Side, fighterId: string): void {
  (s.flow as unknown as { pick: () => void }).pick();
  s.shell.pickFighter.mock.calls.at(-1)?.[0](fighterId);
}

function openPicker(s: Side): void {
  (s.flow as unknown as { pick: () => void }).pick();
}

function closePicker(s: Side): void {
  s.shell.pickFighter.mock.calls.at(-1)?.[1]();
}

function pressStart(host: Side): void {
  (host.flow as unknown as { startAsHost: () => void }).startAsHost();
}

/** A host and guest in the lobby with fighters picked and every message delivered. */
function lobby(): { host: Side; guest: Side } {
  const host = side(NetRole.Host);
  const guest = side(NetRole.Guest);
  pickVia(host, 'goat');
  pickVia(guest, 'pig');
  flush(host, guest);
  flush(guest, host);
  return { host, guest };
}

function started(s: Side): number {
  return s.shell.startMatch.mock.calls.length;
}

describe('online start handshake', () => {
  it('starts both sides', () => {
    const { host, guest } = lobby();
    pressStart(host);
    flush(host, guest);
    flush(guest, host);
    expect([started(host), started(guest)]).toEqual([1, 1]);
  });

  it('starts both when the guest opened and closed the fighter list while Start was in flight', () => {
    const { host, guest } = lobby();
    pressStart(host);
    openPicker(guest);
    closePicker(guest);
    flush(guest, host);
    flush(host, guest);
    flush(guest, host);
    expect([started(host), started(guest)]).toEqual([1, 1]);
  });

  it('starts neither when the guest is choosing a fighter, and a later Start works', () => {
    const { host, guest } = lobby();
    pressStart(host);
    openPicker(guest);
    flush(host, guest);
    flush(guest, host);
    expect([started(host), started(guest)]).toEqual([0, 0]);
    closePicker(guest);
    flush(guest, host);
    pressStart(host);
    flush(host, guest);
    flush(guest, host);
    expect([started(host), started(guest)]).toEqual([1, 1]);
  });

  it('ignores a second Start press while an offer is waiting', () => {
    const { host } = lobby();
    pressStart(host);
    pressStart(host);
    expect(host.outbox.filter((m) => m.kind === MsgKind.Start)).toHaveLength(1);
  });
  it('starts both from the offered match when the host changes fighter and settings while the offer is pending', () => {
    const { host, guest } = lobby();
    pressStart(host);
    pickVia(host, 'bull');
    (host.flow as unknown as { changeSettings: (a: unknown, e: boolean) => void }).changeSettings('rooftop', true);
    flush(host, guest);
    flush(guest, host);
    expect([started(host), started(guest)]).toEqual([1, 1]);
    const hostPlan = host.shell.startMatch.mock.calls[0][0];
    const guestPlan = guest.shell.startMatch.mock.calls[0][0];
    expect([hostPlan.seed, hostPlan.arena, hostPlan.twist]).toEqual([guestPlan.seed, guestPlan.arena, guestPlan.twist]);
  });

  it('starts neither when the guest leaves while the offer is pending', () => {
    const { host, guest } = lobby();
    pressStart(host);
    (guest.flow as unknown as { leave: (m: string | null) => void }).leave(null);
    flush(guest, host);
    flush(host, guest);
    expect([started(host), started(guest)]).toEqual([0, 0]);
    flush(guest, host);
    expect(started(host)).toBe(0);
  });

  it('starts neither on a repeated decline, and the host can offer again after each', () => {
    const { host, guest } = lobby();
    for (let n = 0; n < 3; n += 1) {
      openPicker(guest);
      pressStart(host);
      flush(host, guest);
      flush(guest, host);
      closePicker(guest);
      flush(guest, host);
    }
    expect([started(host), started(guest)]).toEqual([0, 0]);
    pressStart(host);
    flush(host, guest);
    flush(guest, host);
    expect([started(host), started(guest)]).toEqual([1, 1]);
  });

  it('ignores a stray accepted Ready when no offer is waiting', () => {
    const { host } = lobby();
    host.receive({ kind: MsgKind.Ready, accepted: true });
    expect(started(host)).toBe(0);
  });
});
