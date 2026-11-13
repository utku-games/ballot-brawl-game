/**
 * Turns a Throw finisher's projectile kind into costume-style parts: a mitten, a rocket, a parcel, a burger, a gift,
 * a coin, an apple, a lightning bolt or a music note.
 * Parts are centred on the projectile and point +z along its flight, so the view only has to place and turn one group.
 * Projectiles are drawn larger than life, like the heads, so they read at match distance.
 */
import { Projectile } from '../roster/signatureTypes';
import { Anchor, GOLD, part, Shape, SILVER, WHITE, type PartSpec, type Vec3 } from './partSpec';

const MITTEN = 0x8a6a4a;
const ROCKET_RED = 0xd0202a;
const FLAME = 0xffa020;
const CARDBOARD = 0xc89a60;
const TAPE = 0xe8d8a8;
const BUN = 0xd8a050;
const PATTY = 0x5a3018;
const LETTUCE = 0x5aa02a;
const GIFT_RED = 0xc0182a;
const APPLE_RED = 0xc8202a;
const STEM = 0x3a2a10;
const BOLT_YELLOW = 0xffe040;
const INK = 0x141414;
/** Turns a part lying along +y to lie along +z, the flight direction. */
const ALONG_FLIGHT: Vec3 = [Math.PI / 2, 0, 0];

const UPRIGHT: Vec3 = [0, 0, 0];

function at(shape: Shape, position: Vec3, size: Vec3, color: number, rotation: Vec3): PartSpec {
  return part({ shape, anchor: Anchor.Projectile, position, size, rotation, color });
}

const BUILDERS: Readonly<Record<Projectile, () => PartSpec[]>> = {
  [Projectile.None]: () => [],
  [Projectile.Mitten]: () => [at(Shape.Sphere, [0, 0, 0], [0.34, 0.4, 0.24], MITTEN, UPRIGHT), at(Shape.Sphere, [0.17, 0.06, 0], [0.13, 0.18, 0.12], MITTEN, UPRIGHT)],
  [Projectile.Rocket]: () => [
    at(Shape.Cylinder, [0, 0, 0], [0.16, 0.5, 0.16], WHITE, ALONG_FLIGHT),
    at(Shape.Cone, [0, 0, 0.33], [0.16, 0.16, 0.01], ROCKET_RED, ALONG_FLIGHT),
    at(Shape.Sphere, [0, 0, -0.32], [0.14, 0.14, 0.22], FLAME, UPRIGHT),
  ],
  [Projectile.Parcel]: () => [at(Shape.Box, [0, 0, 0], [0.42, 0.3, 0.32], CARDBOARD, UPRIGHT), at(Shape.Box, [0, 0.152, 0], [0.43, 0.01, 0.08], TAPE, UPRIGHT)],
  [Projectile.Burger]: () => [
    at(Shape.Sphere, [0, 0.07, 0], [0.34, 0.14, 0.34], BUN, UPRIGHT),
    at(Shape.Cylinder, [0, 0, 0], [0.34, 0.06, 0.34], PATTY, UPRIGHT),
    at(Shape.Cylinder, [0, 0.035, 0], [0.36, 0.02, 0.36], LETTUCE, UPRIGHT),
    at(Shape.Cylinder, [0, -0.06, 0], [0.32, 0.08, 0.32], BUN, UPRIGHT),
  ],
  [Projectile.Gift]: () => [
    at(Shape.Box, [0, 0, 0], [0.34, 0.34, 0.34], GIFT_RED, UPRIGHT),
    at(Shape.Box, [0, 0, 0], [0.36, 0.36, 0.08], GOLD, UPRIGHT),
    at(Shape.Box, [0, 0, 0], [0.08, 0.36, 0.36], GOLD, UPRIGHT),
    at(Shape.Sphere, [0, 0.2, 0], [0.12, 0.08, 0.12], GOLD, UPRIGHT),
  ],
  [Projectile.Coin]: () => [at(Shape.Cylinder, [0, 0, 0], [0.38, 0.05, 0.38], SILVER, ALONG_FLIGHT)],
  [Projectile.Apple]: () => [at(Shape.Sphere, [0, 0, 0], [0.32, 0.3, 0.32], APPLE_RED, UPRIGHT), at(Shape.Cylinder, [0, 0.18, 0], [0.03, 0.1, 0.03], STEM, UPRIGHT)],
  [Projectile.Bolt]: () => [
    at(Shape.Box, [0.06, 0.16, 0], [0.08, 0.2, 0.08], BOLT_YELLOW, [0, 0, 0.5]),
    at(Shape.Box, [-0.02, 0, 0], [0.08, 0.22, 0.08], BOLT_YELLOW, [0, 0, -0.6]),
    at(Shape.Box, [0.04, -0.17, 0], [0.08, 0.22, 0.08], BOLT_YELLOW, [0, 0, 0.5]),
  ],
  [Projectile.Note]: () => [
    at(Shape.Sphere, [0, -0.12, 0], [0.2, 0.15, 0.15], INK, UPRIGHT),
    at(Shape.Box, [0.08, 0.06, 0], [0.03, 0.36, 0.03], INK, UPRIGHT),
    at(Shape.Box, [0.14, 0.2, 0], [0.12, 0.04, 0.03], INK, [0, 0, -0.4]),
  ],
};

export function projectileParts(projectile: Projectile): PartSpec[] {
  return BUILDERS[projectile]();
}
