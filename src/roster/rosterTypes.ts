/**
 * Data types describing a roster fighter: identity, category, combat stats and the colours of their outfit.
 * Fighters are plain data so adding a new caricature means adding one entry and one face image, not code.
 * Stats are small integers that the fight layer turns into health, damage, speed and size.
 */
import type { Build, Headwear, Neckwear, Outfit, Prop } from './lookTypes';
import type { FighterSignature } from './signatureTypes';

/** Fighter groups: four story categories, each with regulars and one boss, plus Specials for Brawl only. */
export enum Category {
  Politicians = 'politicians',
  Tycoons = 'tycoons',
  Legends = 'legends',
  Celebrities = 'celebrities',
  /** Not a story category: animals and other extras for Brawl and Special Edition fights. */
  Specials = 'specials',
}

/** Lowest and highest value of a combat stat. */
export const STAT_MIN = 1;
export const STAT_MAX = 5;

export interface FighterStats {
  /** Damage dealt (1..5). */
  power: number;
  /** Walking speed (1..5). */
  speed: number;
  /** Health (1..5). */
  toughness: number;
}

export interface FighterLook {
  build: Build;
  outfit: Outfit;
  neckwear: Neckwear;
  headwear: Headwear;
  prop: Prop;
  /** Main colour: the outfit. */
  suitColor: number;
  /** Neckwear and trim. */
  accentColor: number;
  skinColor: number;
  hairColor: number;
}

export interface FighterDef {
  /** Stable kebab-case id, also the face image file name. */
  id: string;
  /** Display name of the real person being caricatured. */
  name: string;
  /** Short parody nickname shown under the name. */
  nickname: string;
  category: Category;
  stats: FighterStats;
  /** Name shown when the fighter performs their finisher. */
  finisher: string;
  look: FighterLook;
  /** Finisher style, gesture and thrown object. */
  signature: FighterSignature;
  /** The last opponent of the category's story ladder. */
  boss: boolean;
}
