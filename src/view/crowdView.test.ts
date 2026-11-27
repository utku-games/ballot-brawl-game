/**
 * Tests that the seated crowd is built as exactly two instanced meshes sized to the seat list.
 * An empty seat list yields an empty group, and each seat gets its own colour.
 * Runs without a DOM because only Three.js geometry and materials are created.
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildCrowd } from './crowdView';
import { seatsOnBenches } from './crowdLayout';

describe('buildCrowd', () => {
  it('uses two instanced meshes however many seats there are', () => {
    const seats = seatsOnBenches([{ top: 0.5, z: -6 }, { top: 1, z: -7 }], 9, 0.75, []);
    const crowd = buildCrowd(seats);
    const meshes = crowd.children as THREE.InstancedMesh[];
    expect(meshes).toHaveLength(2);
    for (const m of meshes) {
      expect(m).toBeInstanceOf(THREE.InstancedMesh);
      expect(m.count).toBe(seats.length);
      expect(m.instanceColor).not.toBeNull();
    }
  });

  it('returns an empty group for no seats', () => {
    expect(buildCrowd([]).children).toHaveLength(0);
  });
});
