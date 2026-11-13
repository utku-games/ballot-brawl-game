/**
 * The Specials group: a goat, a pig, a camel, Larry the Downing Street cat, a bull and a chicken, for Brawl and the
 * Special Edition joke matchups.
 * Specials have no boss and no story ladder; they stand upright in the cartoon style with fur instead of clothes.
 * Their faces are freely licensed animal photos on Wikimedia Commons with hand-set crops, as animals have no face landmarks.
 */
import { defineFighter, type FighterRow } from './defineFighter';
import { Build, Headwear, Neckwear, Outfit, Prop } from './lookTypes';
import { Category, type FighterDef } from './rosterTypes';
import { FinisherStyle, Gesture, Projectile } from './signatureTypes';

const REG = false;

const ROWS: readonly FighterRow[] = [
  { id: 'goat', name: 'Goat', nickname: 'The G.O.A.T.', finisher: 'Headbutt Supreme', stats: [4, 3, 2], colors: [0xe8e2d4, 0x8a6a4a, 0xe8e2d4, 0xece6da], kit: [Build.Short, Outfit.Fur, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Rush, Gesture.Cheer, Projectile.None], boss: REG },
  { id: 'pig', name: 'Pig', nickname: 'Hamlet', finisher: 'Mud Slam', stats: [3, 2, 4], colors: [0xf0a8b0, 0xc87880, 0xf2b0b8, 0xf2b0b8], kit: [Build.Round, Outfit.Fur, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Quake, Gesture.Cheer, Projectile.None], boss: REG },
  { id: 'camel', name: 'Camel', nickname: 'Desert Express', finisher: 'Hump Day', stats: [3, 3, 3], colors: [0xc8a06a, 0x8a6a3a, 0xc8a06a, 0xc8a06a], kit: [Build.Lanky, Outfit.Fur, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Smash, Gesture.Bow, Projectile.None], boss: REG },
  { id: 'larry', name: 'Larry the Cat', nickname: 'Chief Mouser', finisher: 'Pounce', stats: [3, 5, 1], colors: [0xd8cfc0, 0x2a5db0, 0xd8cfc0, 0x9a8a72], kit: [Build.Short, Outfit.Fur, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Rush, Gesture.Wave, Projectile.None], boss: REG },
  { id: 'bull', name: 'Bull', nickname: 'The Charging Bull', finisher: 'Stampede', stats: [5, 2, 2], colors: [0x8a4a22, 0x5a2a12, 0x8a4a22, 0x8a4a22], kit: [Build.Stocky, Outfit.Fur, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Rush, Gesture.Flex, Projectile.None], boss: REG },
  { id: 'chicken', name: 'Chicken', nickname: 'Free Range', finisher: 'Egg Drop', stats: [2, 5, 2], colors: [0xf2efe6, 0xc8102e, 0xf2efe6, 0xf2efe6], kit: [Build.Short, Outfit.Fur, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Throw, Gesture.Cheer, Projectile.Egg], boss: REG },
];

export const SPECIALS: readonly FighterDef[] = ROWS.map((row) => defineFighter(Category.Specials, row));
