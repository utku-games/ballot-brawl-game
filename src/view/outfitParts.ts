/**
 * Turns an outfit into the colours of the base body (torso, sleeves, trousers) and the extra costume parts on top.
 * Every outfit has its own small builder; sizes come from the body dimensions so a coat fits a tall and a short build.
 * Long garments hang from the hip point so the legs keep animating underneath and kicks still poke out.
 */
import { Outfit } from '../roster/lookTypes';
import { torsoFrontZ, type BodyDims } from './buildShapes';
import { Anchor, BLACK, ColorSlot, DENIM, GOLD, part, Shape, SILVER, WHITE, type Paint, type PartSpec } from './partSpec';

export interface OutfitLayout {
  torso: Paint;
  sleeves: Paint;
  pants: Paint;
  parts: PartSpec[];
}

/** Thickness of flat cloth pieces such as lapels and shirt fronts. */
const CLOTH = 0.012;
/** Gap that keeps a surface piece just in front of the body so it never flickers into it. */
const LIFT = 0.006;
/** The top of every skirt sits this far above the hip point, inside the torso. */
const SKIRT_TUCK = 0.05;
/** Skirts stop this far above the floor. */
const SKIRT_HEM = 0.03;
/** Distance from the torso top down to where a shirt front starts. */
const THROAT = 0.04;
const FUR = 0xd8ccb0;
const LEATHER_PANTS = 0x22262e;

function front(d: Readonly<BodyDims>, y: number): number {
  return torsoFrontZ(d, y) + LIFT;
}

/** Shirt front between the lapels; an open collar is wider and shorter so it does not read as a tie. */
function shirt(d: Readonly<BodyDims>, color: Paint, open: boolean): PartSpec {
  const height = d.torsoHeight * (open ? 0.36 : 0.5);
  const y = d.torsoHeight - THROAT - height / 2;
  return part({ shape: Shape.Box, anchor: Anchor.Torso, position: [0, y, front(d, y) - LIFT / 2], size: [d.torsoWidth * (open ? 0.34 : 0.2), height, CLOTH], color });
}

function lapels(d: Readonly<BodyDims>, color: Paint): PartSpec[] {
  const y = d.torsoHeight * 0.62;
  return [-1, 1].map((side) => part({
    shape: Shape.Box, anchor: Anchor.Torso, position: [side * d.torsoWidth * 0.13, y, front(d, y)],
    size: [d.torsoWidth * 0.12, d.torsoHeight * 0.55, CLOTH], rotation: [0, 0, side * 0.3], color,
  }));
}

/** A skirt hanging from the hips: lengthFraction of the leg length, flaring to flare times the torso width. */
function skirt(d: Readonly<BodyDims>, lengthFraction: number, flare: number, color: Paint): PartSpec {
  const height = Math.min(d.legLength * lengthFraction, d.legLength - SKIRT_HEM) + SKIRT_TUCK;
  const hips = Math.max(d.torsoWidth, (d.hipWidth + d.legRadius * 2) * 2);
  return part({
    shape: Shape.Cone, anchor: Anchor.Body, position: [0, SKIRT_TUCK - height / 2, 0],
    size: [hips * flare, height, hips * 0.95], color,
  });
}

/** Coat tails behind the legs, and optional side panels for a coat that hangs open. */
function tails(d: Readonly<BodyDims>, lengthFraction: number, sides: boolean, color: Paint): PartSpec[] {
  const length = d.legLength * lengthFraction + SKIRT_TUCK;
  const y = SKIRT_TUCK - length / 2;
  const back = part({ shape: Shape.Box, anchor: Anchor.Torso, position: [0, y, -(d.legRadius + 0.035)], size: [d.torsoWidth * 0.85, length, 0.05], color });
  if (!sides) return [back];
  const side = (s: number): PartSpec => part({
    shape: Shape.Box, anchor: Anchor.Torso, position: [s * (d.torsoWidth / 2 - 0.03), y, 0], size: [0.05, length, d.torsoDepth * 0.9], color,
  });
  return [back, side(-1), side(1)];
}

function suit(d: Readonly<BodyDims>): OutfitLayout {
  return { torso: ColorSlot.Main, sleeves: ColorSlot.Main, pants: ColorSlot.MainDark, parts: [shirt(d, WHITE, false), ...lapels(d, ColorSlot.MainDark)] };
}

function trouserSuit(d: Readonly<BodyDims>): OutfitLayout {
  return { torso: ColorSlot.Main, sleeves: ColorSlot.Main, pants: ColorSlot.MainDark, parts: [shirt(d, ColorSlot.Accent, false), ...lapels(d, ColorSlot.MainDark)] };
}

function frockCoat(d: Readonly<BodyDims>): OutfitLayout {
  return { ...suit(d), parts: [...suit(d).parts, ...tails(d, 0.55, false, ColorSlot.Main)] };
}

function militaryCoat(d: Readonly<BodyDims>): OutfitLayout {
  const epaulettes = [-1, 1].map((s) => part({
    shape: Shape.Box, anchor: Anchor.Torso, position: [s * d.shoulderWidth * 0.95, d.torsoHeight - 0.03, 0], size: [0.17, 0.05, 0.15], color: ColorSlot.Accent,
  }));
  const y = d.torsoHeight * 0.5;
  const sash = part({
    shape: Shape.Box, anchor: Anchor.Torso, position: [0, y, front(d, y) + LIFT], size: [0.08, d.torsoHeight * 1.05, CLOTH], rotation: [0, 0, 0.6], color: ColorSlot.Accent,
  });
  return { torso: ColorSlot.Main, sleeves: ColorSlot.Main, pants: WHITE, parts: [...epaulettes, sash, ...tails(d, 0.5, true, ColorSlot.Main)] };
}

function toga(d: Readonly<BodyDims>): OutfitLayout {
  const y = d.torsoHeight * 0.6;
  const sash = part({
    shape: Shape.Box, anchor: Anchor.Torso, position: [-d.torsoWidth * 0.18, y, front(d, y)], size: [d.torsoWidth * 0.3, d.torsoHeight * 1.05, CLOTH * 2],
    rotation: [0, 0, -0.5], color: ColorSlot.Accent,
  });
  return { torso: ColorSlot.Main, sleeves: ColorSlot.Skin, pants: ColorSlot.Skin, parts: [sash, skirt(d, 0.55, 1.2, ColorSlot.Main)] };
}

function gown(d: Readonly<BodyDims>): OutfitLayout {
  return { torso: ColorSlot.Main, sleeves: ColorSlot.Main, pants: ColorSlot.Main, parts: [skirt(d, 1, 1.7, ColorSlot.Main)] };
}

function robe(d: Readonly<BodyDims>): OutfitLayout {
  const belt = part({ shape: Shape.Cylinder, anchor: Anchor.Torso, position: [0, 0.08, 0], size: [d.torsoWidth * 1.04, 0.06, d.torsoDepth * 1.1], color: ColorSlot.Accent });
  return { torso: ColorSlot.Main, sleeves: ColorSlot.Main, pants: ColorSlot.Main, parts: [belt, skirt(d, 1, 1.35, ColorSlot.Main)] };
}

function doublet(d: Readonly<BodyDims>): OutfitLayout {
  const puffs = [-1, 1].map((s) => part({
    shape: Shape.Sphere, anchor: Anchor.Torso, position: [s * d.shoulderWidth, d.torsoHeight - 0.08, 0], size: [0.22, 0.2, 0.22], color: ColorSlot.Main,
  }));
  const buttons = [0.35, 0.5, 0.65].map((f) => part({
    shape: Shape.Sphere, anchor: Anchor.Torso, position: [0, d.torsoHeight * f, front(d, d.torsoHeight * f)], size: [0.04, 0.04, 0.04], color: GOLD,
  }));
  return { torso: ColorSlot.Main, sleeves: ColorSlot.Main, pants: ColorSlot.MainDark, parts: [...puffs, ...buttons, skirt(d, 0.18, 1.15, ColorSlot.Main)] };
}

function labCoat(d: Readonly<BodyDims>): OutfitLayout {
  return { torso: WHITE, sleeves: WHITE, pants: ColorSlot.MainDark, parts: [shirt(d, ColorSlot.Main, false), ...tails(d, 0.5, true, WHITE)] };
}

function parka(d: Readonly<BodyDims>): OutfitLayout {
  const ruff = part({
    shape: Shape.Torus, anchor: Anchor.Torso, position: [0, d.torsoHeight - 0.02, 0], size: [d.torsoWidth * 0.75, 0.1, 0.1], rotation: [Math.PI / 2, 0, 0], color: FUR,
  });
  const y = d.torsoHeight * 0.5;
  const zip = part({ shape: Shape.Box, anchor: Anchor.Torso, position: [0, y, front(d, y)], size: [0.02, d.torsoHeight * 0.85, CLOTH], color: ColorSlot.MainDark });
  return { torso: ColorSlot.Main, sleeves: ColorSlot.Main, pants: DENIM, parts: [ruff, zip, skirt(d, 0.3, 1.15, ColorSlot.Main)] };
}

function turtleneck(d: Readonly<BodyDims>): OutfitLayout {
  const roll = part({ shape: Shape.Cylinder, anchor: Anchor.Torso, position: [0, d.torsoHeight - 0.02, 0], size: [0.3, 0.12, 0.3], color: ColorSlot.Main });
  return { torso: ColorSlot.Main, sleeves: ColorSlot.Main, pants: DENIM, parts: [roll] };
}

function hoodie(d: Readonly<BodyDims>): OutfitLayout {
  const hood = part({ shape: Shape.Sphere, anchor: Anchor.Torso, position: [0, d.torsoHeight, -d.torsoDepth * 0.35], size: [d.torsoWidth * 0.6, 0.22, d.torsoDepth * 0.6], color: ColorSlot.Main });
  const y = d.torsoHeight * 0.3;
  const pocket = part({ shape: Shape.Box, anchor: Anchor.Torso, position: [0, y, front(d, y)], size: [d.torsoWidth * 0.5, d.torsoHeight * 0.22, CLOTH], color: ColorSlot.MainDark });
  const strings = [-1, 1].map((s) => {
    const sy = d.torsoHeight * 0.75;
    return part({ shape: Shape.Box, anchor: Anchor.Torso, position: [s * 0.05, sy, front(d, sy)], size: [0.015, 0.16, CLOTH], color: WHITE });
  });
  return { torso: ColorSlot.Main, sleeves: ColorSlot.Main, pants: DENIM, parts: [hood, pocket, ...strings] };
}

function leatherJacket(d: Readonly<BodyDims>): OutfitLayout {
  const y = d.torsoHeight * 0.5;
  const zip = part({ shape: Shape.Box, anchor: Anchor.Torso, position: [d.torsoWidth * 0.08, y, front(d, y)], size: [0.015, d.torsoHeight * 0.8, CLOTH], color: SILVER });
  return { torso: ColorSlot.Main, sleeves: ColorSlot.Main, pants: LEATHER_PANTS, parts: [shirt(d, BLACK, false), ...lapels(d, ColorSlot.Main), zip] };
}

function casual(d: Readonly<BodyDims>): OutfitLayout {
  return { torso: ColorSlot.Main, sleeves: ColorSlot.Main, pants: DENIM, parts: [shirt(d, ColorSlot.Accent, true), ...lapels(d, ColorSlot.MainDark)] };
}

const BUILDERS: Readonly<Record<Outfit, (d: Readonly<BodyDims>) => OutfitLayout>> = {
  [Outfit.Suit]: suit,
  [Outfit.TrouserSuit]: trouserSuit,
  [Outfit.FrockCoat]: frockCoat,
  [Outfit.MilitaryCoat]: militaryCoat,
  [Outfit.Toga]: toga,
  [Outfit.Gown]: gown,
  [Outfit.Doublet]: doublet,
  [Outfit.Robe]: robe,
  [Outfit.LabCoat]: labCoat,
  [Outfit.Parka]: parka,
  [Outfit.Turtleneck]: turtleneck,
  [Outfit.Hoodie]: hoodie,
  [Outfit.LeatherJacket]: leatherJacket,
  [Outfit.Casual]: casual,
};

export function outfitLayout(outfit: Outfit, dims: Readonly<BodyDims>): OutfitLayout {
  return BUILDERS[outfit](dims);
}
