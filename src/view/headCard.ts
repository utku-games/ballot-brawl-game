/**
 * The photo sticker head: a gently curved card carrying the cut-out face texture, warped live for expressions.
 * Each fighter owns its card geometry so vertices can move around the eyes and mouth; updates are skipped while neutral.
 * Only the grid cells inside the face silhouette are kept, so the card is solid, ambient occlusion sees the real head
 * shape (no square, no see-through), and the alpha test only trims the last fraction of a cell at the edge.
 */
import * as THREE from 'three';
import type { FaceLandmarks } from '../roster/credits';
import { isNeutral, warpPoint, type Expression } from './faceWarp';
import { decodeSilhouette, dilate } from './silhouette';

/** Card width and height in meters, and how far its edges curve back. */
export const HEAD_CARD_SIZE = 1.1;
/** Cells per side of the card grid; matches the face pipeline's silhouette grid. */
export const HEAD_GRID = 48;
const CARD_BEND = 0.28;
const ALPHA_CUTOFF = 0.5;
const SKIN_ROUGHNESS = 0.65;
/** Expression change below which the mesh is not rebuilt. */
const CHANGE_EPSILON = 0.004;

export class HeadCard {
  readonly mesh: THREE.Mesh;
  private readonly geometry: THREE.PlaneGeometry;
  private readonly base: Float32Array;
  private last: Expression = { hurt: 0, happy: 0, ko: 0 };

  constructor(face: THREE.Texture, private readonly landmarks: Readonly<FaceLandmarks>, silhouette: readonly string[]) {
    this.geometry = new THREE.PlaneGeometry(HEAD_CARD_SIZE, HEAD_CARD_SIZE, HEAD_GRID, HEAD_GRID);
    this.keepSilhouette(silhouette);
    const pos = this.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i += 1) {
      const nx = pos.getX(i) / (HEAD_CARD_SIZE / 2);
      pos.setZ(i, -CARD_BEND * nx * nx * (HEAD_CARD_SIZE / 2));
    }
    this.base = Float32Array.from(pos.array as Float32Array);
    this.geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      map: face, alphaTest: ALPHA_CUTOFF, side: THREE.DoubleSide, roughness: SKIN_ROUGHNESS,
    });
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.castShadow = true;
  }

  /** Drops the grid cells outside the head so the geometry itself has the head's shape. */
  private keepSilhouette(silhouette: readonly string[]): void {
    const cells = dilate(decodeSilhouette(silhouette, HEAD_GRID));
    const stride = HEAD_GRID + 1;
    const index: number[] = [];
    for (let y = 0; y < HEAD_GRID; y += 1) {
      for (let x = 0; x < HEAD_GRID; x += 1) {
        if (!cells[y]?.[x]) continue;
        const a = y * stride + x;
        const b = a + stride;
        index.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    this.geometry.setIndex(index);
  }

  /** Warps the face toward an expression; cheap no-op when nothing changed. */
  setExpression(e: Readonly<Expression>): void {
    const moved = Math.abs(e.hurt - this.last.hurt) + Math.abs(e.happy - this.last.happy) + Math.abs(e.ko - this.last.ko);
    if (moved < CHANGE_EPSILON) return;
    this.last = { ...e };
    const pos = this.geometry.getAttribute('position');
    const arr = pos.array as Float32Array;
    if (isNeutral(e)) {
      arr.set(this.base);
    } else {
      for (let i = 0; i < pos.count; i += 1) {
        const bx = this.base[i * 3];
        const by = this.base[i * 3 + 1];
        const u = bx / HEAD_CARD_SIZE + 0.5;
        const y = 0.5 - by / HEAD_CARD_SIZE;
        const d = warpPoint(u, y, this.landmarks, e);
        arr[i * 3] = bx + d.du * HEAD_CARD_SIZE;
        arr[i * 3 + 1] = by - d.dy * HEAD_CARD_SIZE;
      }
    }
    pos.needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
