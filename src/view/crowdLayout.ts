/**
 * Lays out a seated crowd along rows of benches: one seat every `spacing` meters, skipping gaps such as the Speaker's chair, with a suit colour, skin tone and slight lean per member.
 * Choices come from a stable hash of the seat, so the same arena always seats the same crowd and tests can check exact results.
 * Pure: returns plain seat data; crowdView.ts turns it into instanced meshes.
 */
import { hash2 } from './floorPatterns';

/** One bench row: the height of its seat surface and its depth position. */
export interface BenchRow {
  top: number;
  z: number;
}

/** A stretch of a row left empty (for example where a chair stands), from x0 to x1. */
export interface SeatGap {
  row: number;
  x0: number;
  x1: number;
}

export interface Seat {
  x: number;
  y: number;
  z: number;
  suit: number;
  skin: number;
  /** Small sideways lean in radians, so the crowd does not look drilled. */
  lean: number;
}

/** Dark politicians' suits with the odd colourful one. */
export const SUIT_COLORS: readonly number[] = [0x1d2433, 0x2b2b2e, 0x3a3f4a, 0x1f2a44, 0x4a2a2a, 0x23303a, 0x5a6270, 0x7a2e3a];
export const SKIN_TONES: readonly number[] = [0xf1c7a6, 0xe0a87e, 0xc68a5e, 0x9a6440, 0x6e452a, 0xf6d5bd];
/** Share of seats left empty, so the benches read as a real, slightly patchy sitting. */
export const EMPTY_SHARE = 0.15;
/** Largest sideways lean, radians. */
export const MAX_LEAN = 0.12;
/** Largest offset along the bench from the even seat spacing, as a share of the spacing. */
const JITTER = 0.25;
const CENTER = 0.5;
const TWICE = 2;
/** Separate hash streams for each choice, so suit, skin and lean do not move together. */
const STREAM_EMPTY = 11;
const STREAM_SUIT = 23;
const STREAM_SKIN = 37;
const STREAM_LEAN = 53;
const STREAM_JITTER = 71;

function pick<T>(list: readonly T[], value: number): T {
  return list[Math.min(list.length - 1, Math.floor(value * list.length))] as T;
}

/** Seats along every row from -halfWidth to halfWidth, outside the gaps. */
export function seatsOnBenches(rows: readonly BenchRow[], halfWidth: number, spacing: number, gaps: readonly SeatGap[]): Seat[] {
  const seats: Seat[] = [];
  const count = Math.floor((halfWidth * TWICE) / spacing) + 1;
  rows.forEach((row, r) => {
    for (let i = 0; i < count; i += 1) {
      const id = r * count + i;
      if (hash2(id, STREAM_EMPTY) < EMPTY_SHARE) continue;
      const x = -halfWidth + i * spacing + (hash2(id, STREAM_JITTER) - CENTER) * spacing * JITTER;
      if (gaps.some((g) => g.row === r && x >= g.x0 && x <= g.x1)) continue;
      seats.push({
        x,
        y: row.top,
        z: row.z,
        suit: pick(SUIT_COLORS, hash2(id, STREAM_SUIT)),
        skin: pick(SKIN_TONES, hash2(id, STREAM_SKIN)),
        lean: (hash2(id, STREAM_LEAN) - CENTER) * TWICE * MAX_LEAN,
      });
    }
  });
  return seats;
}
