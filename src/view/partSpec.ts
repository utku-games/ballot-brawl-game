/**
 * The pure description of one costume piece: a primitive shape, the rig bone it hangs from, its placement and colour.
 * Outfit, neckwear, headwear and prop modules return lists of these; only outfitMeshes.ts turns them into Three.js meshes.
 * Keeping the description free of Three.js lets every costume rule be unit-tested without a renderer.
 */

export enum Shape {
  Box = 'box',
  /** Rounded rod: x and z are diameters, y is the full length. */
  Capsule = 'capsule',
  /** Straight round column: x and z are diameters, y is the height. */
  Cylinder = 'cylinder',
  /** Tapered column: x is the bottom diameter, y the height, z the top diameter. */
  Cone = 'cone',
  /** Ellipsoid: full extent per axis. */
  Sphere = 'sphere',
  /** Ring in the x-y plane: x is the outer diameter across, y the tube diameter, z the outer diameter along y. */
  Torus = 'torus',
}

/** Rig points a part can hang from; positions are relative to that point. */
export enum Anchor {
  /** Hip height on the body group: skirts hang here so they do not swing with the legs. */
  Body = 'body',
  /** Torso pivot at the bottom of the torso, +z forward. */
  Torso = 'torso',
  ArmL = 'armL',
  ArmR = 'armR',
  LegL = 'legL',
  LegR = 'legR',
  /** The photo head card centre; parts here turn, wobble and squash with the face. */
  Card = 'card',
  /** Centre of the right hand. */
  HandR = 'handR',
}

export enum ColorSlot {
  Main = 'main',
  MainDark = 'main-dark',
  Accent = 'accent',
  Skin = 'skin',
  Hair = 'hair',
  /** Uses the part's fixedColor, for gold, white shirts, leaf green and similar. */
  Fixed = 'fixed',
}

export type Vec3 = readonly [number, number, number];

export interface PartSpec {
  shape: Shape;
  anchor: Anchor;
  position: Vec3;
  size: Vec3;
  /** Euler angles in radians, XYZ order. */
  rotation: Vec3;
  color: ColorSlot;
  fixedColor: number;
}

/** Default rotation: none. */
export const NO_ROTATION: Vec3 = [0, 0, 0];
/** Placeholder fixedColor for parts that use a roster colour slot. */
export const NO_FIXED_COLOR = 0x000000;

/** A colour slot, or a fixed hex colour. */
export type Paint = ColorSlot | number;

export interface PartInput {
  shape: Shape;
  anchor: Anchor;
  position: Vec3;
  size: Vec3;
  rotation?: Vec3;
  color: Paint;
}

/** Builds a part; a numeric colour means a fixed colour, and rotation defaults to NO_ROTATION. */
export function part(input: Readonly<PartInput>): PartSpec {
  const fixed = typeof input.color === 'number';
  return {
    shape: input.shape,
    anchor: input.anchor,
    position: input.position,
    size: input.size,
    rotation: input.rotation ?? NO_ROTATION,
    color: fixed ? ColorSlot.Fixed : (input.color as ColorSlot),
    fixedColor: fixed ? (input.color as number) : NO_FIXED_COLOR,
  };
}

/** Shared fixed colours. */
export const WHITE = 0xf2f0ea;
export const GOLD = 0xd4af37;
export const DENIM = 0x34425e;
export const BLACK = 0x161616;
export const SILVER = 0xc0c4c8;
