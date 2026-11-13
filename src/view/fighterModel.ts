/**
 * Assembles one bobblehead fighter: a body sized by the fighter's build, their outfit, neckwear, hat and hand prop,
 * and the photo sticker head.
 * It returns the pivots the animator drives (hips, torso, shoulders, head), the head card, the dizzy stars and the
 * fighter's own materials, which all flash on hits.
 * Costume shapes come from the pure part lists; hands and neck use the photo's measured skin tone.
 */
import * as THREE from 'three';
import type { FaceCredit } from '../roster/credits';
import type { FighterDef } from '../roster/rosterTypes';
import { bodyGeometry, partGeometry, type BodyPart } from './bobbleheadParts';
import { bodyDims, headPivotHeight, NECK_HEIGHT, torsoPivotHeight, type BodyDims } from './buildShapes';
import { HEAD_CARD_SIZE, HEAD_GRID, HeadCard } from './headCard';
import { headwearHeight, headwearParts } from './headwearParts';
import { neckwearParts } from './neckwearParts';
import { outfitLayout } from './outfitParts';
import { attachParts, MaterialSet } from './outfitMeshes';
import { Anchor, ColorSlot, type Paint } from './partSpec';
import { skirtFold } from './poseLogic';
import { handY, propParts } from './propParts';
import { headFrame } from './silhouette';

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
  /** Hip-height group holding skirts, folded flat when the fighter lies down. */
  skirt: THREE.Group;
  /** Hem radius of the widest skirt, 0 without one. */
  skirtRadius: number;
  materials: MaterialSet;
  flashMaterials: THREE.MeshStandardMaterial[];
  ringMaterial: THREE.MeshBasicMaterial;
  markerMaterial: THREE.MeshBasicMaterial;
}

const SHOE_COLOR = 0x1a1410;
const RING_OPACITY = 0.85;
const RING_HEIGHT = 0.01;
const MARKER_GAP = 0.35;
const SHOULDER_DROP = 0.1;
const HIP_GAP = 0.02;
const SHOE_LIFT = 0.05;
const SHOE_FORWARD = 0.05;
/** Height of the card centre above the neck pivot, as a fraction of the card size. */
const CARD_LIFT = 0.42;
const NECK_LIFT = 0.02;
/** The card sits this far in front of the neck so the neck never pokes through the face. */
const CARD_FORWARD = 0.16;
const STAR_COUNT = 3;
const STAR_RADIUS = 0.32;
const STAR_HEIGHT = 0.5;
const STAR_COLOR = 0xffd23a;

interface Kit {
  def: FighterDef;
  dims: BodyDims;
  materials: MaterialSet;
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

function bodyPart(kit: Readonly<Kit>, name: BodyPart, paint: Paint, parent: THREE.Object3D): THREE.Mesh {
  return mesh(bodyGeometry(kit.def.look.build, kit.dims, name), kit.materials.get(paint), parent);
}

function buildStars(parent: THREE.Object3D, lift: number): THREE.Group {
  const stars = new THREE.Group();
  stars.position.y = HEAD_CARD_SIZE * (CARD_LIFT + STAR_HEIGHT) + lift;
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

function buildHead(kit: Readonly<Kit>, torso: THREE.Group, face: THREE.Texture, credit: FaceCredit): { head: THREE.Group; card: HeadCard; stars: THREE.Group } {
  const head = pivot(torso, 0, kit.dims.torsoHeight + NECK_HEIGHT);
  bodyPart(kit, 'neck', ColorSlot.Skin, head).position.y = NECK_LIFT;
  const card = new HeadCard(face, credit.landmarks, credit.silhouette);
  card.mesh.position.set(0, HEAD_CARD_SIZE * CARD_LIFT, CARD_FORWARD);
  head.add(card.mesh);
  const frame = headFrame(credit.silhouette, credit.landmarks, HEAD_GRID, HEAD_CARD_SIZE);
  attachParts(headwearParts(kit.def.look.headwear, frame), new Map([[Anchor.Card, card.mesh]]), kit.materials);
  return { head, card, stars: buildStars(head, headwearHeight(kit.def.look.headwear)) };
}

function buildLeg(kit: Readonly<Kit>, body: THREE.Group, side: number, pants: Paint): THREE.Group {
  const hip = pivot(body, side * (kit.dims.hipWidth / 2 + HIP_GAP), kit.dims.legLength);
  bodyPart(kit, 'leg', pants, hip);
  bodyPart(kit, 'shoe', SHOE_COLOR, hip).position.set(0, -kit.dims.legLength + SHOE_LIFT, SHOE_FORWARD);
  return hip;
}

function buildArm(kit: Readonly<Kit>, torso: THREE.Group, side: number, sleeves: Paint, hand: boolean): { shoulder: THREE.Group; grip: THREE.Group } {
  const shoulder = pivot(torso, side * kit.dims.shoulderWidth, kit.dims.torsoHeight - SHOULDER_DROP);
  bodyPart(kit, 'limb', sleeves, shoulder);
  const grip = pivot(shoulder, 0, handY(kit.dims));
  if (hand) bodyPart(kit, 'hand', ColorSlot.Skin, grip);
  return { shoulder, grip };
}

function buildRingAndMarker(root: THREE.Group, teamColor: number, height: number): Pick<FighterRig, 'ring' | 'marker' | 'ringMaterial' | 'markerMaterial'> {
  const ringMaterial = new THREE.MeshBasicMaterial({ color: teamColor, transparent: true, opacity: RING_OPACITY });
  const ring = new THREE.Mesh(partGeometry('ring'), ringMaterial);
  ring.position.y = RING_HEIGHT;
  root.add(ring);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: teamColor });
  const marker = new THREE.Mesh(partGeometry('marker'), markerMaterial);
  marker.position.y = height + MARKER_GAP;
  marker.visible = false;
  root.add(marker);
  return { ring, marker, ringMaterial, markerMaterial };
}

export function buildFighterRig(def: FighterDef, tone: number, face: THREE.Texture, credit: FaceCredit, teamColor: number): FighterRig {
  const dims = bodyDims(def.look.build);
  const kit: Kit = { def, dims, materials: new MaterialSet(def.look, tone) };
  const layout = outfitLayout(def.look.outfit, dims);
  const prop = propParts(def.look.prop, dims);
  const root = new THREE.Group();
  const body = pivot(root, 0, 0);
  const legL = buildLeg(kit, body, -1, layout.pants);
  const legR = buildLeg(kit, body, 1, layout.pants);
  const torso = pivot(body, 0, torsoPivotHeight(dims));
  bodyPart(kit, 'torso', layout.torso, torso);
  const left = buildArm(kit, torso, -1, layout.sleeves, !prop.hidesHand);
  const right = buildArm(kit, torso, 1, layout.sleeves, !prop.hidesHand);
  const skirt = pivot(body, 0, dims.legLength);
  const anchors = new Map<Anchor, THREE.Object3D>([
    [Anchor.Body, skirt], [Anchor.Torso, torso], [Anchor.ArmL, left.shoulder], [Anchor.ArmR, right.shoulder],
    [Anchor.LegL, legL], [Anchor.LegR, legR], [Anchor.HandR, right.grip],
  ]);
  const parts = [...layout.parts, ...neckwearParts(def.look.neckwear, dims), ...prop.parts];
  attachParts(parts, anchors, kit.materials);
  const skirtRadius = Math.max(0, ...parts.filter((p) => p.anchor === Anchor.Body).map((p) => p.size[0] / 2));
  const { head, card, stars } = buildHead(kit, torso, face, credit);
  const markerHeight = headPivotHeight(dims) + HEAD_CARD_SIZE + headwearHeight(def.look.headwear);
  return {
    root, body, torso, head, card, stars, armL: left.shoulder, armR: right.shoulder, legL, legR,
    ...buildRingAndMarker(root, teamColor, markerHeight), skirt, skirtRadius, materials: kit.materials, flashMaterials: kit.materials.all(),
  };
}

/** Tips the body over (fall 0 standing, 1 flat on its back) and folds any skirt so it rests on the floor. */
export function setFall(rig: FighterRig, fall: number): void {
  rig.body.rotation.x = (-fall * Math.PI) / 2;
  const fold = skirtFold(fall, rig.skirtRadius);
  rig.skirt.scale.z = fold.scale;
  rig.skirt.position.z = fold.lift;
}
