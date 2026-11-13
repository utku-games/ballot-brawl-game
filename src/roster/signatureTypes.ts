/**
 * The signature catalogue: each fighter's finisher style, personal gesture and, for throwers, the object they throw.
 * The finisher style changes how the meter finisher plays in the simulation; gestures and projectiles are visual only.
 * Values are plain data so the roster stays a table, validated at load like the costume kit.
 */

/** How a fighter's meter finisher plays. */
export enum FinisherStyle {
  /** Heavy close hit in a wide arc. */
  Smash = 'smash',
  /** Dashes forward, hitting everyone in the path. */
  Rush = 'rush',
  /** Throws a projectile that hits the first enemy it touches. */
  Throw = 'throw',
  /** Ground slam that hits every enemy nearby, in all directions. */
  Quake = 'quake',
}

/** The personal move used for the entrance, the taunt and the win celebration. */
export enum Gesture {
  Cheer = 'cheer',
  Flex = 'flex',
  Wave = 'wave',
  Bow = 'bow',
  Point = 'point',
  Conduct = 'conduct',
  Salute = 'salute',
  Thinker = 'thinker',
  VSign = 'v-sign',
  Diamond = 'diamond',
}

/** What a Throw finisher sends flying. */
export enum Projectile {
  None = 'none',
  Mitten = 'mitten',
  Rocket = 'rocket',
  Parcel = 'parcel',
  Burger = 'burger',
  Gift = 'gift',
  Coin = 'coin',
  Apple = 'apple',
  Bolt = 'bolt',
  Note = 'note',
  Football = 'football',
  LightBulb = 'light-bulb',
  FryingPan = 'frying-pan',
}

/** A fighter's signature in roster-table order: finisher style, gesture, projectile. */
export type Signature = readonly [style: FinisherStyle, gesture: Gesture, projectile: Projectile];

export interface FighterSignature {
  style: FinisherStyle;
  gesture: Gesture;
  projectile: Projectile;
}
