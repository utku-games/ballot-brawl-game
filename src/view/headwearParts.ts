/**
 * Turns a fighter's headwear into parts on the photo head card, placed from the head frame of that face.
 * Every hat's first part is its crown piece, seated just into the hair at the head top so it neither floats nor
 * covers the face; aviators instead sit on the eye line in front of the card.
 * Each hat also reports how much height it adds, so the player marker can float above it.
 */
import { Headwear } from '../roster/lookTypes';
import { Anchor, BLACK, ColorSlot, GOLD, part, Shape, type PartSpec } from './partSpec';
import type { HeadFrame } from './silhouette';

/** How far a hat sinks into the hair below the head top. */
export const HAT_SINK = 0.09;
/** Hats sit slightly behind the card plane so the face stays in front. */
const HAT_Z = -0.05;
const BRIM = 0.03;
const HOMBURG_GREY = 0x2a2a2e;
const LAUREL_GREEN = 0x4f7a2a;
const BERET_RED = 0x5a1a1e;
const JEWEL_RED = 0xb01a2a;
const LENS = 0x2a2f3a;
/** The wreath dips toward the brow. */
const LAUREL_TILT = 0.3;
/** The headcloth hood sits well behind the face. */
const HOOD_Z = -0.16;

const HEIGHT: Readonly<Record<Headwear, number>> = {
  [Headwear.None]: 0,
  [Headwear.TopHat]: 0.45,
  [Headwear.Bicorne]: 0.26,
  [Headwear.Crown]: 0.13,
  [Headwear.Laurel]: 0.03,
  [Headwear.EgyptianHeaddress]: 0.2,
  [Headwear.Homburg]: 0.23,
  [Headwear.RenaissanceCap]: 0.12,
  [Headwear.Aviators]: 0,
};

/** Extra height the headwear adds above the head top. */
export function headwearHeight(headwear: Headwear): number {
  return HEIGHT[headwear];
}

function base(f: Readonly<HeadFrame>): number {
  return f.top - HAT_SINK;
}

function brimmed(f: Readonly<HeadFrame>, crownHeight: number, crownScale: number, brimScale: number, color: number): PartSpec[] {
  const y = base(f);
  const w = f.width;
  return [
    part({ shape: Shape.Cylinder, anchor: Anchor.Card, position: [0, y + BRIM + crownHeight / 2, HAT_Z], size: [w * crownScale, crownHeight, w * crownScale * 0.85], color }),
    part({ shape: Shape.Cylinder, anchor: Anchor.Card, position: [0, y + BRIM / 2, HAT_Z], size: [w * brimScale, BRIM, w * brimScale * 0.8], color }),
    part({ shape: Shape.Cylinder, anchor: Anchor.Card, position: [0, y + BRIM + 0.03, HAT_Z], size: [w * crownScale * 1.02, 0.05, w * crownScale * 0.87], color: BLACK }),
  ];
}

function bicorne(f: Readonly<HeadFrame>): PartSpec[] {
  const y = base(f);
  return [
    part({ shape: Shape.Sphere, anchor: Anchor.Card, position: [0, y + 0.13, HAT_Z], size: [f.width * 1.35, 0.26, 0.16], color: BLACK }),
    part({ shape: Shape.Box, anchor: Anchor.Card, position: [0, y + 0.02, HAT_Z + 0.04], size: [f.width * 1.15, 0.03, 0.02], color: ColorSlot.Accent }),
    part({ shape: Shape.Sphere, anchor: Anchor.Card, position: [f.width * 0.3, y + 0.12, HAT_Z + 0.09], size: [0.07, 0.07, 0.03], color: ColorSlot.Accent }),
  ];
}

function crown(f: Readonly<HeadFrame>): PartSpec[] {
  const y = base(f);
  const band = part({ shape: Shape.Cylinder, anchor: Anchor.Card, position: [0, y + 0.06, HAT_Z], size: [f.width * 0.42, 0.12, f.width * 0.36], color: GOLD });
  const jewels = [-1, 0, 1].map((s) => part({
    shape: Shape.Sphere, anchor: Anchor.Card, position: [s * f.width * 0.12, y + 0.06, HAT_Z + f.width * 0.18], size: [0.04, 0.04, 0.02], color: JEWEL_RED,
  }));
  return [band, ...jewels];
}

function laurel(f: Readonly<HeadFrame>): PartSpec[] {
  return [part({
    shape: Shape.Torus, anchor: Anchor.Card, position: [0, f.top - HAT_SINK / 2, HAT_Z], size: [f.width * 0.62, 0.05, f.width * 0.62],
    rotation: [Math.PI / 2 - LAUREL_TILT, 0, 0], color: LAUREL_GREEN,
  })];
}

/** A striped headcloth: a gold band on the head top, a hood framing the face from behind, and lappets to the shoulders. */
function egyptian(f: Readonly<HeadFrame>): PartSpec[] {
  const y = base(f);
  const band = part({ shape: Shape.Cylinder, anchor: Anchor.Card, position: [0, y + 0.04, HAT_Z], size: [f.width * 0.7, 0.08, 0.2], color: GOLD });
  const hood = part({ shape: Shape.Sphere, anchor: Anchor.Card, position: [0, f.top - 0.3, HOOD_Z], size: [f.width * 1.3, 0.78, 0.2], color: GOLD });
  const lappets = [-1, 1].map((s) => part({
    shape: Shape.Box, anchor: Anchor.Card, position: [s * f.width * 0.45, f.top - 0.62, HOOD_Z + 0.04], size: [0.14, 0.5, 0.05], color: ColorSlot.Accent,
  }));
  const cobra = part({ shape: Shape.Sphere, anchor: Anchor.Card, position: [0, y + 0.06, 0.06], size: [0.05, 0.09, 0.04], color: GOLD });
  return [band, hood, ...lappets, cobra];
}

function beret(f: Readonly<HeadFrame>): PartSpec[] {
  return [part({ shape: Shape.Sphere, anchor: Anchor.Card, position: [0, base(f) + 0.07, HAT_Z], size: [f.width * 1.05, 0.14, f.width * 0.5], color: BERET_RED })];
}

function aviators(f: Readonly<HeadFrame>): PartSpec[] {
  const lenses = [f.eyeLeft, f.eyeRight].map((x) => part({ shape: Shape.Sphere, anchor: Anchor.Card, position: [x, f.eyeY, 0.03], size: [0.2, 0.14, 0.02], color: LENS }));
  const bridge = part({ shape: Shape.Box, anchor: Anchor.Card, position: [(f.eyeLeft + f.eyeRight) / 2, f.eyeY + 0.04, 0.035], size: [Math.max(0.02, f.eyeRight - f.eyeLeft - 0.18), 0.015, 0.01], color: GOLD });
  return [...lenses, bridge];
}

const BUILDERS: Readonly<Record<Headwear, (f: Readonly<HeadFrame>) => PartSpec[]>> = {
  [Headwear.None]: () => [],
  [Headwear.TopHat]: (f) => brimmed(f, HEIGHT[Headwear.TopHat] - BRIM, 0.72, 1.12, BLACK),
  [Headwear.Bicorne]: bicorne,
  [Headwear.Crown]: crown,
  [Headwear.Laurel]: laurel,
  [Headwear.EgyptianHeaddress]: egyptian,
  [Headwear.Homburg]: (f) => brimmed(f, HEIGHT[Headwear.Homburg] - BRIM, 0.78, 1.18, HOMBURG_GREY),
  [Headwear.RenaissanceCap]: beret,
  [Headwear.Aviators]: aviators,
};

export function headwearParts(headwear: Headwear, frame: Readonly<HeadFrame>): PartSpec[] {
  return BUILDERS[headwear](frame);
}
