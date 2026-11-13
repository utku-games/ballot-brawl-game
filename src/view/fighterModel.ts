/**
 * Assembles one bobblehead fighter from the shared parts: legs, suit torso with a tie, arms, a neck and the photo sticker head.
 * It returns the pivots the animator drives (hips, torso, shoulders, head), the head card, the dizzy stars and the
 * materials that flash on hits. Colours come from the roster look; hands and neck use the photo's measured skin tone.
 */
import * as THREE from 'three';
import type { FaceLandmarks } from '../roster/credits';
import type { FighterDef } from '../roster/rosterTypes';
import { HEAD_CARD_SIZE, HeadCard } from './headCard';
import {
  HIP_WIDTH, LEG_LENGTH, NECK_HEIGHT, SHOULDER_WIDTH, TORSO_HEIGHT, partGeometry,
} from './bobbleheadParts';

export interface FighterRig {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  card: HeadCard;
  stars: THREE.Group;
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

/** Height of the card centre above the neck pivot, as a fraction of the card size. */
const CARD_LIFT = 0.42;
const NECK_LIFT = 0.02;
/** The card sits this far in front of the neck so the neck never pokes through the face. */
const CARD_FORWARD = 0.16;
const STAR_COUNT = 3;
const STAR_RADIUS = 0.32;
const STAR_HEIGHT = 0.5;
const STAR_COLOR = 0xffd23a;

function buildStars(parent: THREE.Object3D): THREE.Group {
  const stars = new THREE.Group();
  stars.position.y = HEAD_CARD_SIZE * (CARD_LIFT + STAR_HEIGHT);
  const material = new THREE.MeshBasicMaterial({ color: STAR_COLOR });
  for (let i = 0; i < STAR_COUNT; i += 1) {
    const a = (i / STAR_COUNT) * Math.PI * 2;
    const star = new THREE.Mesh(partGeometry('star'), material);
    star.position.set(Math.cos(a) * STAR_RADIUS, 0, Math.sin(a) * STAR_RADIUS);
    stars.add(star);
  }
  stars.visible = false;
  parent.add(stars);
  return stars;
}

function buildHead(torso: THREE.Group, tone: number, face: THREE.Texture, landmarks: FaceLandmarks): { head: THREE.Group; card: HeadCard; stars: THREE.Group } {
  const head = pivot(torso, 0, TORSO_HEIGHT + NECK_HEIGHT);
  mesh(partGeometry('neck'), standard(tone, SKIN_ROUGHNESS), head).position.y = NECK_LIFT;
  const card = new HeadCard(face, landmarks);
  card.mesh.position.set(0, HEAD_CARD_SIZE * CARD_LIFT, CARD_FORWARD);
  head.add(card.mesh);
  return { head, card, stars: buildStars(head) };
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

export function buildFighterRig(def: FighterDef, tone: number, face: THREE.Texture, landmarks: FaceLandmarks, teamColor: number): FighterRig {
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
  const { head, card, stars } = buildHead(torso, tone, face, landmarks);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: teamColor, transparent: true, opacity: RING_OPACITY });
  const ring = new THREE.Mesh(partGeometry('ring'), ringMaterial);
  ring.position.y = RING_HEIGHT;
  root.add(ring);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: teamColor });
  const marker = new THREE.Mesh(partGeometry('marker'), markerMaterial);
  marker.position.y = LEG_LENGTH + TORSO_HEIGHT + HEAD_CARD_SIZE + MARKER_GAP;
  marker.visible = false;
  root.add(marker);
  return { root, body, torso, head, card, stars, armL, armR, legL, legR, ring, marker, flashMaterials: [suit, pants, skin], ringMaterial, markerMaterial };
}
