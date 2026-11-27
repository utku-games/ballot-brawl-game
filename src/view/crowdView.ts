/**
 * Draws a seated crowd as two instanced meshes, glossy vinyl bodies and skin-toned heads, in the same toy style as the fighters.
 * Each seat's suit colour, skin tone and lean come from crowdLayout.ts; the whole crowd costs two draw calls however large it is.
 * The returned group owns its geometries and materials; disposeArena frees them with the rest of the arena.
 */
import * as THREE from 'three';
import { createSurfaceMaterial } from '@utku/engine';
import type { Seat } from './crowdLayout';
import { FIGHTER_SURFACE, SKIN_SURFACE } from './surfaceLooks';

const BODY_RADIUS = 0.17;
const BODY_LENGTH = 0.3;
const HEAD_RADIUS = 0.15;
/** Seated torso centre and head centre above the bench top, meters. */
const BODY_LIFT = BODY_RADIUS + BODY_LENGTH / 2;
const HEAD_LIFT = BODY_RADIUS * 2 + BODY_LENGTH + HEAD_RADIUS * 0.8;
const CAP_SEGMENTS = 4;
const RADIAL_SEGMENTS = 10;
const HEAD_SEGMENTS = 12;
const WHITE = 0xffffff;
/** Torsos are wider across the shoulders than deep, so a seated figure reads as a person rather than a peg. */
const TORSO_SCALE = new THREE.Vector3(1.45, 1, 0.85);
/** Seated people sit toward the back of the bench, meters. */
const SIT_BACK = 0.12;

function instanced(geometry: THREE.BufferGeometry, material: THREE.Material, count: number, name: string): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A seated crowd for the given seats; an empty group when there are none. */
export function buildCrowd(seats: readonly Seat[]): THREE.Group {
  const group = new THREE.Group();
  group.name = 'crowd';
  if (seats.length === 0) return group;
  const bodies = instanced(new THREE.CapsuleGeometry(BODY_RADIUS, BODY_LENGTH, CAP_SEGMENTS, RADIAL_SEGMENTS), createSurfaceMaterial(FIGHTER_SURFACE, { color: WHITE }), seats.length, 'crowd_bodies');
  const heads = instanced(new THREE.SphereGeometry(HEAD_RADIUS, HEAD_SEGMENTS, HEAD_SEGMENTS), createSurfaceMaterial(SKIN_SURFACE, { color: WHITE }), seats.length, 'crowd_heads');
  const matrix = new THREE.Matrix4();
  const lean = new THREE.Quaternion();
  const axis = new THREE.Vector3(0, 0, 1);
  const unit = new THREE.Vector3(1, 1, 1);
  const color = new THREE.Color();
  seats.forEach((seat, i) => {
    lean.setFromAxisAngle(axis, seat.lean);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(lean);
    const base = new THREE.Vector3(seat.x, seat.y, seat.z - SIT_BACK);
    bodies.setMatrixAt(i, matrix.compose(base.clone().addScaledVector(up, BODY_LIFT), lean, TORSO_SCALE));
    heads.setMatrixAt(i, matrix.compose(base.clone().addScaledVector(up, HEAD_LIFT), lean, unit));
    bodies.setColorAt(i, color.setHex(seat.suit));
    heads.setColorAt(i, color.setHex(seat.skin));
  });
  group.add(bodies, heads);
  return group;
}
