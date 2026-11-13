/**
 * The PeerJS adapter for online play: opening a room under its code, joining one, and a connection that sends and
 * receives protocol messages over a reliable WebRTC data channel.
 * PeerJS is loaded on demand, so local play never downloads it, and it uses PeerJS's free public signalling server.
 * Failures become a LinkFailure (code taken, room not found, network) that the online screens explain to the player.
 */
import type { DataConnection, Peer } from 'peerjs';
import { GameError } from '../core/errors';
import { parseMessage, type NetMessage } from './protocol';
import { peerIdFor } from './roomCode';

export enum LinkFailure {
  CodeTaken = 'code-taken',
  RoomNotFound = 'room-not-found',
  Network = 'network',
  Protocol = 'protocol',
  /** Nothing arrived for several seconds. */
  Silent = 'silent',
}

/** A room could not be opened or joined; failure says why. */
export class NetLinkError extends GameError {
  constructor(readonly failure: LinkFailure) {
    super(`Online link failed: ${failure}`);
  }
}

/** How long a join waits for the host before giving up. */
const JOIN_TIMEOUT_MS = 12_000;
const SERIALIZATION_JSON = 'json';
const UNAVAILABLE_ID = 'unavailable-id';
const PEER_UNAVAILABLE = 'peer-unavailable';

function failureOf(type: string): LinkFailure {
  if (type === UNAVAILABLE_ID) return LinkFailure.CodeTaken;
  if (type === PEER_UNAVAILABLE) return LinkFailure.RoomNotFound;
  return LinkFailure.Network;
}

async function createPeer(id: string | null): Promise<Peer> {
  const { Peer: PeerClass } = await import('peerjs');
  const peer = id ? new PeerClass(id) : new PeerClass();
  return new Promise((resolve, reject) => {
    peer.once('open', () => resolve(peer));
    peer.once('error', (e) => {
      peer.destroy();
      reject(new NetLinkError(failureOf(e.type)));
    });
  });
}

/** One open connection to the other player. */
export class PeerConnection {
  private onMessageCb: (m: NetMessage) => void = () => undefined;
  private onCloseCb: (failure: LinkFailure | null) => void = () => undefined;
  private closed = false;

  constructor(private readonly peer: Peer, private readonly conn: DataConnection) {
    conn.on('data', (data) => this.receive(data));
    conn.on('close', () => this.end(null));
    conn.on('error', () => this.end(LinkFailure.Network));
    peer.on('error', () => this.end(LinkFailure.Network));
  }

  private receive(data: unknown): void {
    try {
      this.onMessageCb(parseMessage(data));
    } catch (e) {
      if (!(e instanceof GameError)) throw e;
      this.end(LinkFailure.Protocol);
    }
  }

  private end(failure: LinkFailure | null): void {
    if (this.closed) return;
    this.closed = true;
    this.peer.destroy();
    this.onCloseCb(failure);
  }

  onMessage(cb: (m: NetMessage) => void): void {
    this.onMessageCb = cb;
  }

  /** Called once when the link ends: null when the other side left, otherwise why it failed. */
  onClose(cb: (failure: LinkFailure | null) => void): void {
    this.onCloseCb = cb;
  }

  send(m: Readonly<NetMessage>): void {
    if (!this.closed && this.conn.open) this.conn.send(m);
  }

  close(): void {
    this.closed = true;
    this.peer.destroy();
  }
}

/** A hosted room waiting for its one guest. */
export class HostedRoom {
  constructor(private readonly peer: Peer) {}

  /** Resolves with the first guest's connection; later guests are turned away. */
  waitForGuest(): Promise<PeerConnection> {
    return new Promise((resolve) => {
      let taken = false;
      this.peer.on('connection', (conn) => {
        if (taken) {
          conn.on('open', () => conn.close());
          return;
        }
        taken = true;
        conn.on('open', () => resolve(new PeerConnection(this.peer, conn)));
      });
    });
  }

  close(): void {
    this.peer.destroy();
  }
}

/** Opens a room under code; rejects with NetLinkError (CodeTaken when someone already holds it). */
export async function openRoom(code: string): Promise<HostedRoom> {
  return new HostedRoom(await createPeer(peerIdFor(code)));
}

/** Joins the room under code; rejects with NetLinkError (RoomNotFound when nobody hosts it). */
export async function joinRoom(code: string): Promise<PeerConnection> {
  const peer = await createPeer(null);
  return new Promise((resolve, reject) => {
    const conn = peer.connect(peerIdFor(code), { reliable: true, serialization: SERIALIZATION_JSON });
    const timer = setTimeout(() => fail(LinkFailure.RoomNotFound), JOIN_TIMEOUT_MS);
    function fail(failure: LinkFailure): void {
      clearTimeout(timer);
      peer.destroy();
      reject(new NetLinkError(failure));
    }
    peer.once('error', (e) => fail(failureOf(e.type)));
    conn.on('open', () => {
      clearTimeout(timer);
      resolve(new PeerConnection(peer, conn));
    });
  });
}
