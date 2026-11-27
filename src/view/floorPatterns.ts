/**
 * Procedural floor patterns as brightness multipliers (0..1) that tint an arena floor's colour: wooden planks, marble tiles or a ticker grid.
 * Patterns are generated per pixel from integer hashes, so the same arena always gets the same floor and tests can check exact values.
 * Pure: returns a typed array of pixel brightness; floorTextures.ts turns it into a GPU texture.
 */

export enum FloorPattern {
  Plain = 'plain',
  Planks = 'planks',
  Tiles = 'tiles',
  Grid = 'grid',
}

/** Pixels along one side of a pattern tile. */
export const PATTERN_SIZE = 256;
/** Brightness of untouched floor. */
const BASE = 1;
/** Plank seams and tile grout. */
const SEAM = 0.55;
/** How much each plank or tile varies from its neighbours. */
const PIECE_VARIATION = 0.14;
/** Fine wood grain or marble mottling. */
const GRAIN = 0.06;
const PLANK_ROWS = 4;
const PLANK_SPLITS = 2;
const TILES_PER_SIDE = 2;
const GRID_CELLS = 4;
const SEAM_PX = 2;
/** Wood grain runs along the plank: one grain value spans this many pixels in x. */
const GRAIN_STRETCH = 8;
/** Marble mottling comes in blocks of 2^3 = 8 pixels. */
const MOTTLE_SHIFT = 3;
/** Centres a [0, 1) hash on zero. */
const CENTER = 0.5;
const HALF = 2;
/** The two marble tile tones, as brightness. */
const TILE_DARK = 0.8;
const HASH_A = 374761393;
const HASH_B = 668265263;
const HASH_C = 1274126177;
const HASH_RANGE = 0x100000000;

/** A stable pseudo-random number in [0, 1) for a pair of integers. */
export function hash2(x: number, y: number): number {
  let h = Math.imul(x, HASH_A) ^ Math.imul(y, HASH_B);
  h = Math.imul(h ^ (h >>> 13), HASH_C);
  return ((h ^ (h >>> 16)) >>> 0) / HASH_RANGE;
}

function planks(x: number, y: number): number {
  const rowHeight = PATTERN_SIZE / PLANK_ROWS;
  const row = Math.floor(y / rowHeight);
  const length = PATTERN_SIZE / PLANK_SPLITS;
  const shifted = x + (row % 2) * (length / HALF);
  const piece = Math.floor(shifted / length);
  const seam = y % rowHeight < SEAM_PX || shifted % length < SEAM_PX;
  if (seam) return SEAM;
  const grain = (hash2(Math.floor(x / GRAIN_STRETCH), y) - CENTER) * GRAIN;
  return BASE - hash2(piece, row) * PIECE_VARIATION + grain;
}

function tiles(x: number, y: number): number {
  const size = PATTERN_SIZE / TILES_PER_SIDE;
  const tx = Math.floor(x / size);
  const ty = Math.floor(y / size);
  if (x % size < SEAM_PX || y % size < SEAM_PX) return SEAM;
  const tone = (tx + ty) % 2 === 0 ? BASE : TILE_DARK;
  return tone - hash2(x >> MOTTLE_SHIFT, y >> MOTTLE_SHIFT) * GRAIN;
}

function grid(x: number, y: number): number {
  const cell = PATTERN_SIZE / GRID_CELLS;
  return x % cell < SEAM_PX || y % cell < SEAM_PX ? SEAM : BASE;
}

/** Brightness of every pixel of one pattern tile, row by row, clamped to [0, 1]. */
export function floorPatternPixels(pattern: FloorPattern): Float32Array {
  const out = new Float32Array(PATTERN_SIZE * PATTERN_SIZE);
  const sample = pattern === FloorPattern.Planks ? planks : pattern === FloorPattern.Tiles ? tiles : pattern === FloorPattern.Grid ? grid : () => BASE;
  for (let y = 0; y < PATTERN_SIZE; y += 1) {
    for (let x = 0; x < PATTERN_SIZE; x += 1) out[y * PATTERN_SIZE + x] = Math.min(1, Math.max(0, sample(x, y)));
  }
  return out;
}
