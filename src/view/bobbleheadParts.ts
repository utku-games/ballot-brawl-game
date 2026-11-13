/**
 * Shared geometry for the bobblehead fighters: limbs, torso, tie, shoes, neck, team ring, marker and dizzy stars.
 * The photo head itself is a per-fighter card (headCard.ts) because its vertices animate expressions.
 * Geometries are built once and reused by every fighter; only materials differ per fighter.
 */
import * as THREE from 'three';

export const LEG_LENGTH = 0.72;
export const TORSO_HEIGHT = 0.62;
export const TORSO_WIDTH = 0.62;
export const TORSO_DEPTH = 0.34;
export const ARM_LENGTH = 0.58;
export const LIMB_RADIUS = 0.09;
export const HIP_WIDTH = 0.16;
export const SHOULDER_WIDTH = 0.38;
export const NECK_HEIGHT = 0.08;
const CAPSULE_SEGMENTS = 6;
const RADIAL_SEGMENTS = 10;

function build(): Record<string, THREE.BufferGeometry> {
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
    neck: new THREE.CylinderGeometry(0.09, 0.11, 0.22, 10),
    star: new THREE.OctahedronGeometry(0.07),
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

export function partGeometry(name: 'neck' | 'star' | 'hand' | 'shoe' | 'limb' | 'leg' | 'torso' | 'tie' | 'ring' | 'marker'): THREE.BufferGeometry {
  shared ??= build();
  return shared[name];
}
