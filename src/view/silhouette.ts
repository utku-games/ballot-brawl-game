/**
 * Decodes a face's silhouette grid (hex rows from the face pipeline) into occupied cells for the 3D head card.
 * The grid is grown by one cell so the alpha-tested texture edge always lies inside the geometry.
 * Shaping the geometry this way keeps heads solid while depth-based effects such as ambient occlusion see the real head.
 */

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
