/**
 * Shared geometry for the bobblehead fighters: limbs, torso, neck, hands and shoes per build, plus ring, marker and stars.
 * The photo head itself is a per-fighter card (headCard.ts) because its vertices animate expressions.
 * Body geometry is built once per build and reused by every fighter of that build; only materials differ per fighter.
 */
import * as THREE from 'three';
import type { Build } from '../roster/lookTypes';
import type { BodyDims } from './buildShapes';

const CAPSULE_SEGMENTS = 6;
const RADIAL_SEGMENTS = 10;
const HAND_SCALE = 1.5;

export type BodyPart = 'limb' | 'leg' | 'torso' | 'neck' | 'hand' | 'shoe';
export type SharedPart = 'star' | 'ring' | 'marker';

function buildBody(d: Readonly<BodyDims>): Record<BodyPart, THREE.BufferGeometry> {
  const limb = new THREE.CapsuleGeometry(d.limbRadius, d.armLength - d.limbRadius * 2, CAPSULE_SEGMENTS, RADIAL_SEGMENTS);
  limb.translate(0, -d.armLength / 2, 0);
  const leg = new THREE.CapsuleGeometry(d.legRadius, d.legLength - d.legRadius * 2, CAPSULE_SEGMENTS, RADIAL_SEGMENTS);
  leg.translate(0, -d.legLength / 2, 0);
  const torso = new THREE.CapsuleGeometry(d.torsoDepth / 2, d.torsoHeight - d.torsoDepth, CAPSULE_SEGMENTS, RADIAL_SEGMENTS);
  torso.scale(d.torsoWidth / d.torsoDepth, 1, 1);
  torso.translate(0, d.torsoHeight / 2, 0);
  return {
    limb,
    leg,
    torso,
    neck: new THREE.CylinderGeometry(0.09, 0.11, 0.22, RADIAL_SEGMENTS),
    hand: new THREE.SphereGeometry(d.limbRadius * HAND_SCALE, RADIAL_SEGMENTS, 8),
    shoe: new THREE.BoxGeometry(0.16, 0.1, 0.28),
  };
}

const bodies = new Map<Build, Record<BodyPart, THREE.BufferGeometry>>();

/** Body geometry for one build, built on first use and shared by every fighter of that build. */
export function bodyGeometry(build: Build, dims: Readonly<BodyDims>, name: BodyPart): THREE.BufferGeometry {
  let set = bodies.get(build);
  if (!set) {
    set = buildBody(dims);
    bodies.set(build, set);
  }
  return set[name];
}

let shared: Record<SharedPart, THREE.BufferGeometry> | null = null;

export function partGeometry(name: SharedPart): THREE.BufferGeometry {
  shared ??= {
    star: new THREE.OctahedronGeometry(0.07),
    ring: new THREE.RingGeometry(0.42, 0.55, 32).rotateX(-Math.PI / 2),
    marker: new THREE.ConeGeometry(0.14, 0.26, 4).rotateX(Math.PI),
  };
  return shared[name];
}
