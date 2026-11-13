/**
 * Assembles one bobblehead fighter from the shared parts: legs, suit torso with a tie, arms, and the big photo head.
 * It returns the pivots the animator drives (hips, torso, shoulders, neck) plus the materials that flash on hits.
 * Colours come from the roster look; the head uses the photo's own skin tone so the face blends into it.
 */
import * as THREE from 'three';
import type { FighterDef } from '../roster/rosterTypes';
import {
  HEAD_RADIUS, HIP_WIDTH, LEG_LENGTH, NECK_HEIGHT, SHOULDER_WIDTH, TORSO_HEIGHT, partGeometry,
} from './bobbleheadParts';

export interface FighterRig {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  ring: THREE.Mesh;
  marker: THREE.Mesh;
  flashMaterials: THREE.MeshStandardMaterial[];
  ringMaterial: THREE.MeshBasicMaterial;
  markerMaterial: THREE.MeshBasicMaterial;
}

const SHOE_COLOR = 0x1a1410;
const PANTS_DARKEN = 0.7;
const SUIT_ROUGHNESS = 0.7;
const SKIN_ROUGHNESS = 0.6;
const RING_OPACITY = 0.85;
const RING_HEIGHT = 0.01;
const MARKER_GAP = 0.35;
const SHOULDER_DROP = 0.1;

function standard(color: number, roughness: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  parent.add(m);
  return m;
}

function pivot(parent: THREE.Object3D, x: number, y: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, 0);
  parent.add(g);
  return g;
}

function buildHead(torso: THREE.Group, def: FighterDef, tone: number, face: THREE.Texture): THREE.Group {
  const head = pivot(torso, 0, TORSO_HEIGHT + NECK_HEIGHT);
  const ball = new THREE.Group();
  ball.position.y = HEAD_RADIUS * 0.9;
  head.add(ball);
  mesh(partGeometry('head'), standard(tone, SKIN_ROUGHNESS), ball);
  mesh(partGeometry('hair'), standard(def.look.hairColor, SUIT_ROUGHNESS), ball);
  const faceMaterial = new THREE.MeshStandardMaterial({ map: face, transparent: true, roughness: SKIN_ROUGHNESS, depthWrite: false });
  mesh(partGeometry('face'), faceMaterial, ball).castShadow = false;
  return head;
}

function buildLeg(body: THREE.Group, x: number, pants: THREE.Material, shoe: THREE.Material): THREE.Group {
  const hip = pivot(body, x, LEG_LENGTH);
  mesh(partGeometry('leg'), pants, hip);
  const foot = mesh(partGeometry('shoe'), shoe, hip);
  foot.position.set(0, -LEG_LENGTH + 0.05, 0.05);
  return hip;
}

function buildArm(torso: THREE.Group, x: number, suit: THREE.Material, skin: THREE.Material): THREE.Group {
  const shoulder = pivot(torso, x, TORSO_HEIGHT - SHOULDER_DROP);
  mesh(partGeometry('limb'), suit, shoulder);
  mesh(partGeometry('hand'), skin, shoulder).position.y = -0.6;
  return shoulder;
}

export function buildFighterRig(def: FighterDef, tone: number, face: THREE.Texture, teamColor: number): FighterRig {
  const root = new THREE.Group();
  const body = pivot(root, 0, 0);
  const suit = standard(def.look.suitColor, SUIT_ROUGHNESS);
  const pants = standard(new THREE.Color(def.look.suitColor).multiplyScalar(PANTS_DARKEN).getHex(), SUIT_ROUGHNESS);
  const skin = standard(tone, SKIN_ROUGHNESS);
  const shoe = standard(SHOE_COLOR, SUIT_ROUGHNESS);
  const legL = buildLeg(body, -HIP_WIDTH / 2 - 0.02, pants, shoe);
  const legR = buildLeg(body, HIP_WIDTH / 2 + 0.02, pants, shoe);
  const torso = pivot(body, 0, LEG_LENGTH - 0.05);
  mesh(partGeometry('torso'), suit, torso);
  mesh(partGeometry('tie'), standard(def.look.accentColor, SUIT_ROUGHNESS), torso);
  const armL = buildArm(torso, -SHOULDER_WIDTH, suit, skin);
  const armR = buildArm(torso, SHOULDER_WIDTH, suit, skin);
  const head = buildHead(torso, def, tone, face);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: teamColor, transparent: true, opacity: RING_OPACITY });
  const ring = new THREE.Mesh(partGeometry('ring'), ringMaterial);
  ring.position.y = RING_HEIGHT;
  root.add(ring);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: teamColor });
  const marker = new THREE.Mesh(partGeometry('marker'), markerMaterial);
  marker.position.y = LEG_LENGTH + TORSO_HEIGHT + HEAD_RADIUS * 2 + MARKER_GAP;
  marker.visible = false;
  root.add(marker);
  return { root, body, torso, head, armL, armR, legL, legR, ring, marker, flashMaterials: [suit, pants, skin], ringMaterial, markerMaterial };
}
