/**
 * Turns pure costume part specs into Three.js meshes on the fighter rig, and owns each fighter's materials.
 * Primitive geometry is shared by every fighter at unit size and scaled per part; materials are cached per fighter by
 * colour, never shared across fighters, so a hit flash only lights up the fighter that was hit.
 * A part naming a rig point that does not exist raises RigBuildError instead of silently disappearing.
 */
import * as THREE from 'three';
import { RigBuildError } from '../core/errors';
import { Build, Headwear, Neckwear, Outfit, Prop } from '../roster/lookTypes';
import type { FighterLook } from '../roster/rosterTypes';
import { Anchor, ColorSlot, Shape, type Paint, type PartSpec } from './partSpec';

const ROUGHNESS = 0.7;
/** Trousers are the main colour darkened by this factor. */
export const PANTS_DARKEN = 0.7;
const SEGMENTS = 14;
const RATIO_STEPS = 100;

export class MaterialSet {
  private readonly byColor = new Map<number, THREE.MeshStandardMaterial>();
  private readonly slots: Readonly<Record<Exclude<ColorSlot, ColorSlot.Fixed>, number>>;

  constructor(look: Readonly<FighterLook>, tone: number) {
    this.slots = {
      [ColorSlot.Main]: look.suitColor,
      [ColorSlot.MainDark]: new THREE.Color(look.suitColor).multiplyScalar(PANTS_DARKEN).getHex(),
      [ColorSlot.Accent]: look.accentColor,
      [ColorSlot.Skin]: tone,
      [ColorSlot.Hair]: look.hairColor,
    };
  }

  /** The material for a colour slot or fixed colour, created on first use. */
  get(paint: Paint): THREE.MeshStandardMaterial {
    const color = typeof paint === 'number' ? paint : paint === ColorSlot.Fixed ? 0 : this.slots[paint];
    let m = this.byColor.get(color);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color, roughness: ROUGHNESS });
      this.byColor.set(color, m);
    }
    return m;
  }

  forPart(p: Readonly<PartSpec>): THREE.MeshStandardMaterial {
    return this.get(p.color === ColorSlot.Fixed ? p.fixedColor : p.color);
  }

  all(): THREE.MeshStandardMaterial[] {
    return [...this.byColor.values()];
  }

  dispose(): void {
    for (const m of this.byColor.values()) m.dispose();
    this.byColor.clear();
  }
}

const unitGeometry = new Map<string, THREE.BufferGeometry>();

function ratio(a: number, b: number): number {
  return Math.round((a / b) * RATIO_STEPS) / RATIO_STEPS;
}

function makeUnit(shape: Shape, r: number): THREE.BufferGeometry {
  switch (shape) {
    case Shape.Box: return new THREE.BoxGeometry(1, 1, 1);
    case Shape.Capsule: return new THREE.CapsuleGeometry(0.25, 0.5, 4, SEGMENTS);
    case Shape.Cylinder: return new THREE.CylinderGeometry(0.5, 0.5, 1, SEGMENTS);
    case Shape.Cone: return new THREE.CylinderGeometry(0.5 * r, 0.5, 1, SEGMENTS);
    case Shape.Sphere: return new THREE.SphereGeometry(0.5, SEGMENTS, SEGMENTS / 2 + 2);
    case Shape.Torus: return new THREE.TorusGeometry(0.5 - r / 2, r / 2, 8, SEGMENTS * 2);
  }
}

/** Shared unit geometry; cones and tori also depend on their top-to-bottom or tube-to-ring ratio. */
function geometryFor(p: Readonly<PartSpec>): THREE.BufferGeometry {
  const r = p.shape === Shape.Cone ? ratio(p.size[2], p.size[0]) : p.shape === Shape.Torus ? ratio(p.size[1], p.size[0]) : 1;
  const key = `${p.shape}:${r}`;
  let g = unitGeometry.get(key);
  if (!g) {
    g = makeUnit(p.shape, r);
    unitGeometry.set(key, g);
  }
  return g;
}

function applyScale(mesh: THREE.Mesh, p: Readonly<PartSpec>): void {
  const [x, y, z] = p.size;
  if (p.shape === Shape.Torus) mesh.scale.set(x, z, x);
  else if (p.shape === Shape.Cone) mesh.scale.set(x, y, x);
  else if (p.shape === Shape.Capsule) mesh.scale.set(x * 2, y, z * 2);
  else mesh.scale.set(x, y, z);
}

export function attachParts(parts: readonly PartSpec[], anchors: ReadonlyMap<Anchor, THREE.Object3D>, materials: MaterialSet): void {
  for (const p of parts) {
    const parent = anchors.get(p.anchor);
    if (!parent) throw new RigBuildError(`Costume part needs rig point ${p.anchor}, which this rig does not have`);
    const mesh = new THREE.Mesh(geometryFor(p), materials.forPart(p));
    mesh.position.set(...p.position);
    mesh.rotation.set(...p.rotation);
    applyScale(mesh, p);
    mesh.castShadow = true;
    parent.add(mesh);
  }
}

/** A look with no colours of its own, for objects such as items and anvils that only use fixed colours. */
const FIXED_ONLY_LOOK: Readonly<FighterLook> = {
  build: Build.Average, outfit: Outfit.Suit, neckwear: Neckwear.None, headwear: Headwear.None, prop: Prop.None,
  suitColor: 0, accentColor: 0, skinColor: 0, hairColor: 0,
};

/** Materials for an object built only from fixed-colour parts. */
export function fixedColorMaterials(): MaterialSet {
  return new MaterialSet(FIXED_ONLY_LOOK, 0);
}
