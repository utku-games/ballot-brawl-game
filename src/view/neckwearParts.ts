/**
 * Turns a fighter's neckwear (tie, long tie, bow tie, ruff, cravat or gold collar) into costume parts on the torso.
 * Pieces at the throat follow the rounded top of the torso so they sit on its surface instead of floating in front.
 * The first part of every list is the main piece, which tests use to compare a long tie with a regular one.
 */
import { Neckwear } from '../roster/lookTypes';
import { torsoFrontZ, type BodyDims } from './buildShapes';
import { Anchor, ColorSlot, GOLD, part, Shape, WHITE, type PartSpec } from './partSpec';

const LIFT = 0.012;
const TIE_WIDTH = 0.09;
const TIE_DEPTH = 0.02;
/** Throat height below the torso top. */
const THROAT_DROP = 0.06;

function front(d: Readonly<BodyDims>, y: number): number {
  return torsoFrontZ(d, y) + LIFT;
}

/** A tie blade hanging from the throat over lengthFraction of the torso height. */
function tie(d: Readonly<BodyDims>, lengthFraction: number, widthScale: number): PartSpec[] {
  const length = d.torsoHeight * lengthFraction;
  const top = d.torsoHeight - THROAT_DROP;
  const y = top - length / 2;
  const blade = part({ shape: Shape.Box, anchor: Anchor.Torso, position: [0, y, front(d, y)], size: [TIE_WIDTH * widthScale, length, TIE_DEPTH], color: ColorSlot.Accent });
  const knot = part({ shape: Shape.Sphere, anchor: Anchor.Torso, position: [0, top, front(d, top)], size: [0.07, 0.06, 0.05], color: ColorSlot.Accent });
  return [blade, knot];
}

function bowTie(d: Readonly<BodyDims>): PartSpec[] {
  const y = d.torsoHeight - THROAT_DROP;
  const z = front(d, y) + LIFT;
  const centre = part({ shape: Shape.Sphere, anchor: Anchor.Torso, position: [0, y, z], size: [0.04, 0.04, 0.04], color: ColorSlot.Accent });
  const wings = [-1, 1].map((s) => part({
    shape: Shape.Box, anchor: Anchor.Torso, position: [s * 0.05, y, z], size: [0.08, 0.06, 0.03], rotation: [0, 0, s * 0.3], color: ColorSlot.Accent,
  }));
  return [centre, ...wings];
}

function ruff(d: Readonly<BodyDims>): PartSpec[] {
  return [part({
    shape: Shape.Torus, anchor: Anchor.Torso, position: [0, d.torsoHeight - 0.01, 0], size: [d.torsoWidth * 0.75, 0.1, 0.1], rotation: [Math.PI / 2, 0, 0], color: WHITE,
  })];
}

function cravat(d: Readonly<BodyDims>): PartSpec[] {
  const y = d.torsoHeight - THROAT_DROP - 0.04;
  return [
    part({ shape: Shape.Sphere, anchor: Anchor.Torso, position: [0, y, front(d, y)], size: [0.13, 0.16, 0.06], color: WHITE }),
    part({ shape: Shape.Sphere, anchor: Anchor.Torso, position: [0, y + 0.06, front(d, y + 0.06)], size: [0.1, 0.06, 0.05], color: WHITE }),
  ];
}

function goldCollar(d: Readonly<BodyDims>): PartSpec[] {
  return [part({
    shape: Shape.Cylinder, anchor: Anchor.Torso, position: [0, d.torsoHeight - 0.03, 0], size: [d.torsoWidth * 0.95, 0.04, d.torsoDepth * 1.25], color: GOLD,
  })];
}

const BUILDERS: Readonly<Record<Neckwear, (d: Readonly<BodyDims>) => PartSpec[]>> = {
  [Neckwear.None]: () => [],
  [Neckwear.Tie]: (d) => tie(d, 0.6, 1),
  [Neckwear.LongTie]: (d) => tie(d, 0.88, 1.25),
  [Neckwear.BowTie]: bowTie,
  [Neckwear.Ruff]: ruff,
  [Neckwear.Cravat]: cravat,
  [Neckwear.GoldCollar]: goldCollar,
};

export function neckwearParts(neckwear: Neckwear, dims: Readonly<BodyDims>): PartSpec[] {
  return BUILDERS[neckwear](dims);
}
