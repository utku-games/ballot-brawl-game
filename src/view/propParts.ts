/**
 * Turns a fighter's signature prop into parts held in the right hand, or for mittens, worn over both hands.
 * Long props point down and forward along the arm so they swing out with punches and never reach the floor.
 * The hand position is shared with the rig through handY, so props and hands always line up.
 */
import { Prop } from '../roster/lookTypes';
import type { BodyDims } from './buildShapes';
import { Anchor, GOLD, part, Shape, SILVER, WHITE, type PartSpec } from './partSpec';

export interface PropLayout {
  parts: PartSpec[];
  /** True when the prop replaces both hands (mittens). */
  hidesHand: boolean;
}

/** The hand sits this far past the end of the arm capsule. */
const HAND_DROP = 0.02;
/** Long props lean this far forward from straight down, in radians. */
const FORWARD_TILT = Math.PI / 3;
/** In front of the palm. */
const GRIP_Z = 0.1;
const COS_TILT = Math.cos(FORWARD_TILT);
const SIN_TILT = Math.sin(FORWARD_TILT);

const BROWN = 0x5a3a20;
const EMBER = 0xff6a20;
const APPLE_RED = 0xc8202a;
const STEM = 0x3a2a10;
const GLOW_GREEN = 0x7aff9a;
const CORK = 0xb08a5a;
const WOOD = 0x8a5a30;
const PAINT = 0x2a6ad0;
const SPARK_BLUE = 0x6ac8ff;
const COPPER = 0xb87333;
const SNAKE_GREEN = 0x3a7a2a;
const SAW_ORANGE = 0xf07a10;
const BUN = 0xd8a050;
const PATTY = 0x5a3018;
const LETTUCE = 0x5aa02a;
const ROCKET_RED = 0xd0202a;
const MITTEN = 0x8a6a4a;
const MIC_BLACK = 0x1a1a1a;

/** Height of the hand centre below the shoulder pivot. */
export function handY(dims: Readonly<BodyDims>): number {
  return -dims.armLength - HAND_DROP;
}

/** A point `distance` along a long prop that leans down and forward from the hand. */
function along(distance: number): [number, number, number] {
  return [0, -distance * COS_TILT, distance * SIN_TILT];
}

function rod(length: number, width: number, color: number, offset: number): PartSpec {
  return part({ shape: Shape.Cylinder, anchor: Anchor.HandR, position: along(offset + length / 2), size: [width, length, width], rotation: [FORWARD_TILT, 0, 0], color });
}

function tip(distance: number, size: number, color: number): PartSpec {
  return part({ shape: Shape.Sphere, anchor: Anchor.HandR, position: along(distance), size: [size, size, size], color });
}

function held(shape: Shape, size: readonly [number, number, number], color: number, y = 0): PartSpec {
  return part({ shape, anchor: Anchor.HandR, position: [0, y, GRIP_Z], size, color });
}

function upright(length: number, width: number, color: number): PartSpec {
  return part({ shape: Shape.Cylinder, anchor: Anchor.HandR, position: [0, length / 2 - 0.04, GRIP_Z], size: [width, length, width], color });
}

function sword(): PartSpec[] {
  const blade = part({ shape: Shape.Box, anchor: Anchor.HandR, position: along(0.24), size: [0.05, 0.36, 0.015], rotation: [FORWARD_TILT, 0, 0], color: SILVER });
  const guard = part({ shape: Shape.Box, anchor: Anchor.HandR, position: along(0.06), size: [0.16, 0.03, 0.03], rotation: [FORWARD_TILT, 0, 0], color: GOLD });
  return [blade, guard];
}

function chainsaw(): PartSpec[] {
  const engine = held(Shape.Box, [0.13, 0.14, 0.2], SAW_ORANGE);
  const bar = part({ shape: Shape.Box, anchor: Anchor.HandR, position: along(0.24), size: [0.03, 0.32, 0.06], rotation: [FORWARD_TILT, 0, 0], color: SILVER });
  return [engine, bar];
}

function burger(): PartSpec[] {
  return [
    held(Shape.Sphere, [0.16, 0.06, 0.16], BUN, 0.04),
    held(Shape.Cylinder, [0.16, 0.03, 0.16], PATTY),
    held(Shape.Cylinder, [0.17, 0.012, 0.17], LETTUCE, 0.018),
    held(Shape.Cylinder, [0.15, 0.04, 0.15], BUN, -0.03),
  ];
}

function mittens(d: Readonly<BodyDims>): PartSpec[] {
  const size = d.limbRadius * 3.6;
  return [Anchor.ArmR, Anchor.ArmL].flatMap((anchor) => [
    part({ shape: Shape.Sphere, anchor, position: [0, handY(d), 0], size: [size, size * 1.1, size * 0.9], color: MITTEN }),
    part({ shape: Shape.Sphere, anchor, position: [0, handY(d) + size * 0.2, size * 0.4], size: [size * 0.4, size * 0.5, size * 0.4], color: MITTEN }),
  ]);
}

const BUILDERS: Readonly<Record<Prop, (d: Readonly<BodyDims>) => PartSpec[]>> = {
  [Prop.None]: () => [],
  [Prop.Cigar]: () => [
    part({ shape: Shape.Cylinder, anchor: Anchor.HandR, position: [0, 0, GRIP_Z + 0.04], size: [0.035, 0.17, 0.035], rotation: [Math.PI / 2, 0, 0], color: BROWN }),
    held(Shape.Sphere, [0.04, 0.04, 0.04], EMBER, 0),
  ],
  [Prop.Sceptre]: () => [upright(0.5, 0.03, GOLD), held(Shape.Sphere, [0.08, 0.08, 0.08], GOLD, 0.46)],
  [Prop.Quill]: () => [held(Shape.Sphere, [0.04, 0.28, 0.08], WHITE, 0.12)],
  [Prop.Apple]: () => [held(Shape.Sphere, [0.14, 0.13, 0.14], APPLE_RED), held(Shape.Cylinder, [0.012, 0.05, 0.012], STEM, 0.08)],
  [Prop.Chalk]: () => [held(Shape.Box, [0.03, 0.09, 0.03], WHITE)],
  [Prop.Baton]: () => [rod(0.32, 0.02, WHITE, 0.02)],
  [Prop.Vial]: () => [upright(0.16, 0.06, GLOW_GREEN), held(Shape.Cylinder, [0.045, 0.03, 0.045], CORK, 0.135)],
  [Prop.Paintbrush]: () => [rod(0.24, 0.025, WOOD, 0.02), tip(0.29, 0.045, PAINT)],
  [Prop.CoilWand]: () => [
    rod(0.36, 0.04, COPPER, 0.02),
    part({ shape: Shape.Torus, anchor: Anchor.HandR, position: along(0.2), size: [0.09, 0.02, 0.09], rotation: [FORWARD_TILT + Math.PI / 2, 0, 0], color: COPPER }),
    tip(0.4, 0.08, SPARK_BLUE),
  ],
  [Prop.Sword]: sword,
  [Prop.Snake]: () => [
    part({ shape: Shape.Torus, anchor: Anchor.HandR, position: [0, 0.14, 0], size: [0.2, 0.05, 0.2], rotation: [Math.PI / 2, 0, 0], color: SNAKE_GREEN }),
    held(Shape.Sphere, [0.07, 0.05, 0.09], SNAKE_GREEN, 0.04),
  ],
  [Prop.Chainsaw]: chainsaw,
  [Prop.Mittens]: mittens,
  [Prop.Burger]: burger,
  [Prop.ToyRocket]: () => [upright(0.3, 0.08, WHITE), held(Shape.Cone, [0.08, 0.1, 0.01], ROCKET_RED, 0.31)],
  [Prop.Dime]: () => [part({ shape: Shape.Cylinder, anchor: Anchor.HandR, position: [0, 0.02, GRIP_Z], size: [0.1, 0.012, 0.1], rotation: [Math.PI / 2, 0, 0], color: SILVER })],
  [Prop.Microphone]: () => [upright(0.2, 0.04, MIC_BLACK), held(Shape.Sphere, [0.08, 0.08, 0.08], SILVER, 0.19)],
};

/** Held props are drawn this much larger than life so they read at match distance, like the oversized heads. */
export const PROP_SCALE = 1.5;

function enlarge(p: Readonly<PartSpec>): PartSpec {
  if (p.anchor !== Anchor.HandR) return p;
  const [x, y, z] = p.position;
  const [w, h, d] = p.size;
  return { ...p, position: [x * PROP_SCALE, y * PROP_SCALE, z * PROP_SCALE], size: [w * PROP_SCALE, h * PROP_SCALE, d * PROP_SCALE] };
}

export function propParts(prop: Prop, dims: Readonly<BodyDims>): PropLayout {
  return { parts: BUILDERS[prop](dims).map(enlarge), hidesHand: prop === Prop.Mittens };
}
