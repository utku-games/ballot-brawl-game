/**
 * Shapes for the Brawl extras: the three throwable items (briefcase, gavel, money bag) and the falling cartoon anvil.
 * Items are centred on their own origin so the same parts serve the floor, the fighter's hand and the flight.
 * Pure part specs, built into meshes by outfitMeshes like every costume piece.
 */
import { ItemKind } from '../fight/fightTypes';
import { Anchor, GOLD, part, Shape, SILVER, type PartSpec, type Vec3 } from './partSpec';

const LEATHER = 0x5a3a1e;
const WOOD = 0x8a5a2a;
const DARK_WOOD = 0x4a2e14;
const SACK = 0xc8b07a;
const ROPE = 0x6a4a2a;
const IRON = 0x2c2c32;
const FLAT: Vec3 = [0, 0, 0];
const SIDEWAYS: Vec3 = [0, 0, Math.PI / 2];

function at(shape: Shape, position: Vec3, size: Vec3, color: number, rotation: Vec3): PartSpec {
  return part({ shape, anchor: Anchor.Projectile, position, size, rotation, color });
}

const ITEMS: Readonly<Record<ItemKind, () => PartSpec[]>> = {
  [ItemKind.Briefcase]: () => [
    at(Shape.Box, [0, 0, 0], [0.44, 0.32, 0.12], LEATHER, FLAT),
    at(Shape.Torus, [0, 0.2, 0], [0.16, 0.03, 0.16], LEATHER, FLAT),
    at(Shape.Box, [0, 0.12, 0.065], [0.06, 0.04, 0.01], GOLD, FLAT),
  ],
  [ItemKind.Gavel]: () => [
    at(Shape.Cylinder, [0, 0.14, 0], [0.16, 0.3, 0.16], DARK_WOOD, SIDEWAYS),
    at(Shape.Cylinder, [0, -0.08, 0], [0.05, 0.36, 0.05], WOOD, FLAT),
  ],
  [ItemKind.MoneyBag]: () => [
    at(Shape.Sphere, [0, -0.02, 0], [0.38, 0.36, 0.38], SACK, FLAT),
    at(Shape.Cone, [0, 0.2, 0], [0.18, 0.12, 0.08], SACK, FLAT),
    at(Shape.Torus, [0, 0.16, 0], [0.14, 0.03, 0.14], ROPE, [Math.PI / 2, 0, 0]),
    at(Shape.Cylinder, [0, 0, 0.19], [0.14, 0.02, 0.14], GOLD, [Math.PI / 2, 0, 0]),
  ],
};

export function itemParts(kind: ItemKind): PartSpec[] {
  return ITEMS[kind]();
}

/** A cartoon anvil, about a metre long, resting on its base at the origin. */
export function anvilParts(): PartSpec[] {
  return [
    at(Shape.Box, [0, 0.12, 0], [0.5, 0.24, 0.4], IRON, FLAT),
    at(Shape.Box, [0, 0.32, 0], [0.3, 0.18, 0.28], IRON, FLAT),
    at(Shape.Box, [0, 0.5, 0], [0.8, 0.2, 0.4], IRON, FLAT),
    at(Shape.Cone, [0.55, 0.5, 0], [0.18, 0.3, 0.02], IRON, [0, 0, -Math.PI / 2]),
    at(Shape.Box, [0, 0.61, 0], [0.82, 0.02, 0.42], SILVER, FLAT),
  ];
}
