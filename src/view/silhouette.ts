/**
 * Decodes a face's silhouette grid (hex rows from the face pipeline) into occupied cells for the 3D head card.
 * The grid is grown by one cell so the alpha-tested texture edge always lies inside the geometry.
 * Shaping the geometry this way keeps heads solid while depth-based effects such as ambient occlusion see the real head,
 * and the same grid tells hats where the top of the head is.
 */
import type { FaceLandmarks } from '../roster/credits';

const HEX_RADIX = 16;
const BITS_PER_HEX = 4;

/** Occupied cells, indexed [row][column] with row 0 at the top. */
export function decodeSilhouette(rows: readonly string[], cells: number): boolean[][] {
  return rows.slice(0, cells).map((hex) => {
    const bits = [...hex].map((d) => Number.parseInt(d, HEX_RADIX).toString(2).padStart(BITS_PER_HEX, '0')).join('');
    return Array.from({ length: cells }, (_, i) => bits[i] === '1');
  });
}

/** Grows the occupied area by one cell in every direction (including diagonals). */
export function dilate(grid: readonly (readonly boolean[])[]): boolean[][] {
  return grid.map((row, y) => row.map((_, x) => {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) if (grid[y + dy]?.[x + dx]) return true;
    }
    return false;
  }));
}

/** Where the head is on the card, in card-space metres: origin at the card centre, +y up, +x to the viewer's right. */
export interface HeadFrame {
  /** Top of the head (the highest occupied row). */
  top: number;
  /** Head width halfway between the top and the eye line. */
  width: number;
  eyeY: number;
  eyeLeft: number;
  eyeRight: number;
}

/** Head top and width used when a face has no silhouette, as fractions of the card size. */
export const DEFAULT_TOP_FRACTION = 0.4;
export const DEFAULT_WIDTH_FRACTION = 0.6;

function rowSpan(row: readonly boolean[]): number {
  const first = row.indexOf(true);
  return first < 0 ? 0 : row.lastIndexOf(true) - first + 1;
}

export function headFrame(rows: readonly string[], landmarks: Readonly<FaceLandmarks>, cells: number, cardSize: number): HeadFrame {
  const grid = decodeSilhouette(rows, cells);
  const topRow = grid.findIndex((row) => row.includes(true));
  const eyeV = (landmarks.eyeA.y + landmarks.eyeB.y) / 2;
  const toY = (v: number): number => cardSize / 2 - v * cardSize;
  const toX = (u: number): number => (u - 0.5) * cardSize;
  const eyeRow = Math.round(eyeV * cells);
  const browRow = topRow < 0 ? -1 : Math.round((topRow + Math.max(topRow, eyeRow)) / 2);
  const span = browRow < 0 ? 0 : rowSpan(grid[browRow] ?? []);
  return {
    top: topRow < 0 ? cardSize * DEFAULT_TOP_FRACTION : toY(topRow / cells),
    width: span > 0 ? (span / cells) * cardSize : cardSize * DEFAULT_WIDTH_FRACTION,
    eyeY: toY(eyeV),
    eyeLeft: toX(Math.min(landmarks.eyeA.x, landmarks.eyeB.x)),
    eyeRight: toX(Math.max(landmarks.eyeA.x, landmarks.eyeB.x)),
  };
}
