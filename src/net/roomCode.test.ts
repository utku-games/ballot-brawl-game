/**
 * Tests for room codes: generated codes use the alphabet and length, and typed codes are normalised or rejected.
 * Normalisation forgives case, spaces and dashes but rejects look-alike characters and wrong lengths.
 * Peer ids carry the game prefix so they cannot clash with other apps.
 */
import { createRng } from '@utku/engine';
import { describe, expect, it } from 'vitest';
import { makeRoomCode, normalizeRoomCode, peerIdFor, PEER_ID_PREFIX, ROOM_CODE_LENGTH } from './roomCode';

describe('room codes', () => {
  it('generates valid codes that differ', () => {
    const rng = createRng(7);
    const codes = Array.from({ length: 20 }, () => makeRoomCode(rng));
    for (const c of codes) {
      expect(c).toHaveLength(ROOM_CODE_LENGTH);
      expect(normalizeRoomCode(c)).toBe(c);
    }
    expect(new Set(codes).size).toBeGreaterThan(15);
  });

  it('normalises typed codes', () => {
    expect(normalizeRoomCode(' ab-c 23 ')).toBe('ABC23');
  });

  it('rejects bad codes', () => {
    expect(normalizeRoomCode('ABCD')).toBeNull();
    expect(normalizeRoomCode('ABCDEF')).toBeNull();
    expect(normalizeRoomCode('ABC0O')).toBeNull();
    expect(normalizeRoomCode('')).toBeNull();
  });

  it('prefixes peer ids', () => {
    expect(peerIdFor('ABC23')).toBe(`${PEER_ID_PREFIX}ABC23`);
  });
});
