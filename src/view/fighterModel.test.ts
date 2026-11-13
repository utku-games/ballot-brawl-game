/**
 * Builds every roster fighter's rig in a headless scene and checks costume geometry against the floor and the marker.
 * It also checks that hit-flash materials are never shared between rigs and that disposing one fighter keeps shared geometry.
 * The tests need three.js objects but no WebGL, so they run in plain node.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { RigBuildError, RosterDataError } from '../core/errors';
import { creditFor, toneOf } from '../roster/credits';
import { ROSTER } from '../roster/roster';
import { bodyDims } from './buildShapes';
import { buildFighterRig, setFall, type FighterRig } from './fighterModel';
import { attachParts, MaterialSet } from './outfitMeshes';
import { Anchor, ColorSlot, Shape, type PartSpec } from './partSpec';

const TEAM = 0x3a8dff;
const FLOOR_EPSILON = 0.02;
/** Fully fallen, as at the end of a knockout. */
const KO_FALL = 1;

function rigFor(id: string): FighterRig {
  const def = ROSTER.find((f) => f.id === id);
  if (!def) throw new RosterDataError(`No fighter ${id}`);
  return buildFighterRig(def, toneOf(id), new THREE.Texture(), creditFor(id), TEAM);
}

function lowestMeshY(root: THREE.Object3D, skip: THREE.Object3D | null): number {
  root.updateMatrixWorld(true);
  const skipped = new Set<THREE.Object3D>();
  skip?.traverse((o) => skipped.add(o));
  let low = Infinity;
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || o.parent?.visible === false || skipped.has(o)) return;
    const box = new THREE.Box3().setFromObject(o);
    if (box.min.y < low) low = box.min.y;
  });
  return low;
}

describe('fighter rigs', () => {
  it('keeps every costume above the floor while standing', () => {
    for (const f of ROSTER) {
      const rig = rigFor(f.id);
      rig.ring.visible = false;
      rig.marker.visible = false;
      rig.stars.visible = false;
      rig.root.remove(rig.ring);
      expect(lowestMeshY(rig.root, null), f.id).toBeGreaterThanOrEqual(-FLOOR_EPSILON);
    }
  });

  it('keeps every costume no deeper under the floor than the torso when fallen flat', () => {
    for (const f of ROSTER) {
      const rig = rigFor(f.id);
      rig.root.remove(rig.ring);
      rig.stars.visible = false;
      setFall(rig, KO_FALL);
      const sinkAllowed = bodyDims(f.look.build).torsoDepth / 2 + FLOOR_EPSILON;
      // The head and its hat turn to face the camera every frame, so their rest pose says nothing about a fall.
      expect(lowestMeshY(rig.root, rig.head), f.id).toBeGreaterThanOrEqual(-sinkAllowed);
    }
  });

  it('puts the marker above the head top', () => {
    for (const f of ROSTER) {
      const rig = rigFor(f.id);
      const head = new THREE.Box3().setFromObject(rig.head);
      expect(rig.marker.position.y, f.id).toBeGreaterThan(head.max.y);
    }
  });

  it('never shares flash materials between two fighters wearing the same colours', () => {
    const a = rigFor('donald-trump');
    const b = rigFor('donald-trump');
    for (const m of a.flashMaterials) expect(b.flashMaterials).not.toContain(m);
  });

  it('keeps shared geometry alive when one fighter is disposed', () => {
    const a = rigFor('winston-churchill');
    const b = rigFor('winston-churchill');
    const geometries: THREE.BufferGeometry[] = [];
    b.root.traverse((o) => { if (o instanceof THREE.Mesh && o !== b.card.mesh) geometries.push(o.geometry); });
    let disposed = 0;
    for (const g of geometries) g.addEventListener('dispose', () => { disposed += 1; });
    a.card.dispose();
    a.materials.dispose();
    expect(disposed).toBe(0);
  });
});

describe('attachParts', () => {
  const part: PartSpec = {
    shape: Shape.Box, anchor: Anchor.HandR, position: [0, 0, 0], size: [1, 1, 1], rotation: [0, 0, 0], color: ColorSlot.Main, fixedColor: 0,
  };
  it('throws RigBuildError for an anchor the rig lacks', () => {
    const look = ROSTER[0].look;
    expect(() => attachParts([part], new Map(), new MaterialSet(look, 0xcc9966))).toThrow(RigBuildError);
  });
});
