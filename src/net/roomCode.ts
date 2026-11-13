/**
 * Room codes for online play: five characters from an alphabet without look-alikes (no 0/O, 1/I/L).
 * A code maps to a PeerJS peer id with a game prefix, so the host is reachable by that id on the signalling server.
 * normalizeRoomCode accepts what a player types (any case, spaces and dashes) and returns null for anything invalid.
 */
import type { Rng } from '@utku/engine';

export const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 5;
/** Prefix that keeps this game's peer ids apart from other apps on the shared signalling server. */
export const PEER_ID_PREFIX = 'ballot-brawl-room-';

const TYPING_NOISE = /[\s-]/g;

export function makeRoomCode(rng: Rng): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) code += ROOM_ALPHABET[Math.floor(rng() * ROOM_ALPHABET.length)];
  return code;
}

export function normalizeRoomCode(typed: string): string | null {
  const code = typed.replace(TYPING_NOISE, '').toUpperCase();
  if (code.length !== ROOM_CODE_LENGTH) return null;
  return [...code].every((c) => ROOM_ALPHABET.includes(c)) ? code : null;
}

export function peerIdFor(code: string): string {
  return `${PEER_ID_PREFIX}${code}`;
}
