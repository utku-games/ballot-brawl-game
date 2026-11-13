/**
 * Shared geometry for the bobblehead fighters: limbs, torso, the big head, the photo face cap and the hair shell.
 * The face cap is the front half of a sphere with planar UVs, so the flat photo projects straight onto the face.
 * Geometries are built once and reused by every fighter; only materials differ per fighter.
 */
import * as THREE from 'three';

export const HEAD_RADIUS = 0.42;
export const LEG_LENGTH = 0.72;
export const TORSO_HEIGHT = 0.62;
export const TORSO_WIDTH = 0.62;
export const TORSO_DEPTH = 0.34;
export const ARM_LENGTH = 0.58;
export const LIMB_RADIUS = 0.09;
export const HIP_WIDTH = 0.16;
export const SHOULDER_WIDTH = 0.38;
export const NECK_HEIGHT = 0.08;
/** Fraction of the head diameter the photo spans; below 1 so the face fills the front instead of the whole hemisphere. */
const FACE_SPAN = 1;
const FACE_LIFT = 1.006;
const HAIR_LIFT = 1.025;
const SPHERE_SEGMENTS = 28;
const SPHERE_RINGS = 20;
const CAPSULE_SEGMENTS = 6;
const RADIAL_SEGMENTS = 10;

function planarFaceUvs(geometry: THREE.BufferGeometry, radius: number): void {
  const pos = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  const span = radius * 2 * FACE_SPAN;
  for (let i = 0; i < pos.count; i += 1) {
    uv.setXY(i, 0.5 + pos.getX(i) / span, 0.5 + pos.getY(i) / span);
  }
  uv.needsUpdate = true;
}

function build(): Record<string, THREE.BufferGeometry> {
  const face = new THREE.SphereGeometry(HEAD_RADIUS * FACE_LIFT, SPHERE_SEGMENTS, SPHERE_RINGS, 0, Math.PI);
  planarFaceUvs(face, HEAD_RADIUS);
  const limb = new THREE.CapsuleGeometry(LIMB_RADIUS, ARM_LENGTH - LIMB_RADIUS * 2, CAPSULE_SEGMENTS, RADIAL_SEGMENTS);
  limb.translate(0, -ARM_LENGTH / 2, 0);
  const leg = new THREE.CapsuleGeometry(LIMB_RADIUS * 1.2, LEG_LENGTH - LIMB_RADIUS * 2.4, CAPSULE_SEGMENTS, RADIAL_SEGMENTS);
  leg.translate(0, -LEG_LENGTH / 2, 0);
  const torso = new THREE.CapsuleGeometry(TORSO_DEPTH / 2, TORSO_HEIGHT - TORSO_DEPTH, CAPSULE_SEGMENTS, RADIAL_SEGMENTS);
  torso.scale(TORSO_WIDTH / TORSO_DEPTH, 1, 1);
  torso.translate(0, TORSO_HEIGHT / 2, 0);
  const tie = new THREE.BoxGeometry(0.09, TORSO_HEIGHT * 0.6, 0.02);
  tie.translate(0, TORSO_HEIGHT * 0.55, TORSO_DEPTH / 2 + 0.005);
  return {
    head: new THREE.SphereGeometry(HEAD_RADIUS, SPHERE_SEGMENTS, SPHERE_RINGS),
    face,
    hair: new THREE.SphereGeometry(HEAD_RADIUS * HAIR_LIFT, SPHERE_SEGMENTS, SPHERE_RINGS, Math.PI, Math.PI),
    hand: new THREE.SphereGeometry(LIMB_RADIUS * 1.5, 10, 8),
    shoe: new THREE.BoxGeometry(0.16, 0.1, 0.28),
    limb,
    leg,
    torso,
    tie,
    ring: new THREE.RingGeometry(0.42, 0.55, 32).rotateX(-Math.PI / 2),
    marker: new THREE.ConeGeometry(0.14, 0.26, 4).rotateX(Math.PI),
  };
}

let shared: Record<string, THREE.BufferGeometry> | null = null;

export function partGeometry(name: 'head' | 'face' | 'hair' | 'hand' | 'shoe' | 'limb' | 'leg' | 'torso' | 'tie' | 'ring' | 'marker'): THREE.BufferGeometry {
  shared ??= build();
  return shared[name];
}
