/**
 * The Celebrities category: pop stars, athletes, actors, a chef, a director and an influencer, with Arnold as boss.
 * Their faces come from freely licensed event photos on Wikimedia Commons, credited in-game like every other face.
 * Every regular fighter has the same stat total; the boss gets more and fights last in the story ladder.
 */
import { defineFighter, type FighterRow } from './defineFighter';
import { Build, Headwear, Neckwear, Outfit, Prop } from './lookTypes';
import { Category, type FighterDef } from './rosterTypes';
import { FinisherStyle, Gesture, Projectile } from './signatureTypes';

const REG = false;
const BOSS = true;

const ROWS: readonly FighterRow[] = [
  { id: 'taylor-swift', name: 'Taylor Swift', nickname: 'The Eras', finisher: 'Shake It Off', stats: [3, 4, 2], colors: [0xc8102e, 0xd4af37, 0xf6d2bc, 0xe8c87a], kit: [Build.Tall, Outfit.Gown, Neckwear.None, Headwear.None, Prop.Microphone], signature: [FinisherStyle.Rush, Gesture.Cheer, Projectile.None], boss: REG },
  { id: 'beyonce', name: 'Beyoncé', nickname: 'Queen Bey', finisher: 'Halo', stats: [4, 3, 2], colors: [0xd4af37, 0xf0e0a0, 0xa06a48, 0xc89a4a], kit: [Build.Average, Outfit.Gown, Neckwear.None, Headwear.None, Prop.Microphone], signature: [FinisherStyle.Quake, Gesture.Flex, Projectile.None], boss: REG },
  { id: 'cristiano-ronaldo', name: 'Cristiano Ronaldo', nickname: 'CR7', finisher: 'Bicycle Kick', stats: [4, 4, 1], colors: [0xd01a2a, 0x1a8a3a, 0xd8a882, 0x2a1a10], kit: [Build.Tall, Outfit.Jersey, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Rush, Gesture.Flex, Projectile.None], boss: REG },
  { id: 'lionel-messi', name: 'Lionel Messi', nickname: 'La Pulga', finisher: 'Golden Left', stats: [3, 5, 1], colors: [0x6ab0e8, 0xf4f4f4, 0xe8b894, 0x5a3a20], kit: [Build.Short, Outfit.Jersey, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Throw, Gesture.Point, Projectile.Football], boss: REG },
  { id: 'dwayne-johnson', name: 'Dwayne Johnson', nickname: 'The Rock', finisher: "People's Elbow", stats: [5, 1, 3], colors: [0x1a1a1a, 0x3a3a3a, 0xb07a58, 0x2a1a10], kit: [Build.Stocky, Outfit.Casual, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Smash, Gesture.Flex, Projectile.None], boss: REG },
  { id: 'snoop-dogg', name: 'Snoop Dogg', nickname: 'The Doggfather', finisher: 'Drop It', stats: [3, 3, 3], colors: [0x2a5a2a, 0xe8e8e8, 0x6a4a30, 0x1a1a1a], kit: [Build.Lanky, Outfit.Hoodie, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Quake, Gesture.Point, Projectile.None], boss: REG },
  { id: 'lady-gaga', name: 'Lady Gaga', nickname: 'Mother Monster', finisher: 'Bad Romance', stats: [3, 4, 2], colors: [0x1a1a1a, 0xc8c8c8, 0xf6d6c4, 0xf0e0a0], kit: [Build.Average, Outfit.Gown, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Throw, Gesture.Bow, Projectile.Note], boss: REG },
  { id: 'gordon-ramsay', name: 'Gordon Ramsay', nickname: 'The Chef', finisher: 'Kitchen Nightmare', stats: [4, 3, 2], colors: [0xe8e8e8, 0x1a1a1a, 0xf0c0a0, 0xd8b070], kit: [Build.Average, Outfit.LabCoat, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Throw, Gesture.Point, Projectile.FryingPan], boss: REG },
  { id: 'keanu-reeves', name: 'Keanu Reeves', nickname: 'The One', finisher: 'Matrix Rush', stats: [3, 4, 2], colors: [0x111111, 0x1a1a1a, 0xe8c09a, 0x1a1a1a], kit: [Build.Lanky, Outfit.FrockCoat, Neckwear.None, Headwear.Aviators, Prop.None], signature: [FinisherStyle.Rush, Gesture.Bow, Projectile.None], boss: REG },
  { id: 'james-cameron', name: 'James Cameron', nickname: 'The Director', finisher: 'Deep Dive', stats: [3, 3, 3], colors: [0x3a4a5a, 0x8ab0e0, 0xf0c4a4, 0xd0d0d0], kit: [Build.Tall, Outfit.Casual, Neckwear.None, Headwear.None, Prop.None], signature: [FinisherStyle.Rush, Gesture.Point, Projectile.None], boss: REG },
  { id: 'kim-kardashian', name: 'Kim Kardashian', nickname: 'The Influencer', finisher: 'Break the Internet', stats: [2, 4, 3], colors: [0xe8d8c8, 0xc8a080, 0xe8c0a0, 0x1a1a1a], kit: [Build.Average, Outfit.Gown, Neckwear.None, Headwear.None, Prop.Phone], signature: [FinisherStyle.Quake, Gesture.Wave, Projectile.None], boss: REG },
  { id: 'arnold-schwarzenegger', name: 'Arnold Schwarzenegger', nickname: 'The Governator', finisher: 'Judgment Day', stats: [5, 3, 3], colors: [0x1a1a1a, 0x3a3a3a, 0xe0b090, 0x8a6a4a], kit: [Build.Stocky, Outfit.LeatherJacket, Neckwear.None, Headwear.Aviators, Prop.None], signature: [FinisherStyle.Smash, Gesture.Flex, Projectile.None], boss: BOSS },
];

export const CELEBRITIES: readonly FighterDef[] = ROWS.map((row) => defineFighter(Category.Celebrities, row));
