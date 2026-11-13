/**
 * The Tycoons category: eleven caricatured business moguls and billionaires, plus a historical boss.
 * Each one gets a parody nickname and a finisher named after their best-known business gimmick.
 * Every regular fighter has the same stat total; the boss gets more and fights last in the story ladder.
 */
import { defineFighter, type FighterRow } from './defineFighter';
import { Build, Headwear, Neckwear, Outfit, Prop } from './lookTypes';
import { Category, type FighterDef } from './rosterTypes';

const REG = false;
const BOSS = true;

const ROWS: readonly FighterRow[] = [
  { id: 'elon-musk', name: 'Elon Musk', nickname: 'Rocket Man', finisher: 'Launch Sequence', stats: [4, 3, 2], colors: [0x111111, 0x8a8a8a, 0xf2c6a6, 0x3a2a20], kit: [Build.Tall, Outfit.Casual, Neckwear.None, Headwear.None, Prop.ToyRocket], boss: REG },
  { id: 'jeff-bezos', name: 'Jeff Bezos', nickname: 'Prime Mover', finisher: 'Next-Day Delivery', stats: [4, 2, 3], colors: [0x2a2f3a, 0xff9900, 0xf1c0a0, 0xe9b898], kit: [Build.Stocky, Outfit.Casual, Neckwear.None, Headwear.None, Prop.None], boss: REG },
  { id: 'bill-gates', name: 'Bill Gates', nickname: 'The Patch', finisher: 'Blue Screen', stats: [2, 3, 4], colors: [0x3a4a6a, 0x8ab0e0, 0xf3cbb0, 0x8a7a6a], kit: [Build.Average, Outfit.Casual, Neckwear.None, Headwear.None, Prop.None], boss: REG },
  { id: 'mark-zuckerberg', name: 'Mark Zuckerberg', nickname: 'The Algorithm', finisher: 'Poke of Doom', stats: [3, 4, 2], colors: [0x6a6e78, 0x1877f2, 0xf2c6a8, 0x7a5a3a], kit: [Build.Short, Outfit.Hoodie, Neckwear.None, Headwear.None, Prop.None], boss: REG },
  { id: 'warren-buffett', name: 'Warren Buffett', nickname: 'The Oracle', finisher: 'Value Investor', stats: [3, 1, 5], colors: [0x2a2a30, 0x9a2a2a, 0xf4cab0, 0xeeeeee], kit: [Build.Round, Outfit.Suit, Neckwear.BowTie, Headwear.None, Prop.Burger], boss: REG },
  { id: 'richard-branson', name: 'Richard Branson', nickname: 'The Balloonist', finisher: 'Maiden Voyage', stats: [3, 4, 2], colors: [0xe8e8e8, 0xc8102e, 0xf0bc98, 0xe8dcc0], kit: [Build.Average, Outfit.Casual, Neckwear.None, Headwear.None, Prop.None], boss: REG },
  { id: 'larry-ellison', name: 'Larry Ellison', nickname: 'The Yachtsman', finisher: 'Database Drop', stats: [3, 3, 3], colors: [0x1a1a1a, 0xf80000, 0xf0c0a0, 0xc8c8c8], kit: [Build.Average, Outfit.Suit, Neckwear.None, Headwear.None, Prop.None], boss: REG },
  { id: 'jensen-huang', name: 'Jensen Huang', nickname: 'Leather Jacket', finisher: 'GPU Overclock', stats: [4, 3, 2], colors: [0x151515, 0x76b900, 0xe9b98e, 0x2a2a2a], kit: [Build.Average, Outfit.LeatherJacket, Neckwear.None, Headwear.None, Prop.None], boss: REG },
  { id: 'oprah-winfrey', name: 'Oprah Winfrey', nickname: 'The Giveaway', finisher: 'Everybody Gets One', stats: [3, 3, 3], colors: [0x8a2a6a, 0xe8c060, 0x7a4a30, 0x2a1a10], kit: [Build.Average, Outfit.Casual, Neckwear.None, Headwear.None, Prop.Microphone], boss: REG },
  { id: 'steve-jobs', name: 'Steve Jobs', nickname: 'One More Thing', finisher: 'Keynote Kick', stats: [3, 4, 2], colors: [0x141414, 0x5a7a9a, 0xf0c09a, 0x4a4a4a], kit: [Build.Lanky, Outfit.Turtleneck, Neckwear.None, Headwear.None, Prop.None], boss: REG },
  { id: 'jack-ma', name: 'Jack Ma', nickname: 'The Marketplace', finisher: 'Singles Day Sale', stats: [2, 5, 2], colors: [0x2a2a3a, 0xff6a00, 0xf0c49a, 0x1a1a1a], kit: [Build.Short, Outfit.Suit, Neckwear.Tie, Headwear.None, Prop.None], boss: REG },
  { id: 'john-d-rockefeller', name: 'John D. Rockefeller', nickname: 'The Monopoly', finisher: 'Standard Oil Slam', stats: [4, 2, 5], colors: [0x1a1a1a, 0xd4af37, 0xf2cdb5, 0xd8d8d8], kit: [Build.Stocky, Outfit.FrockCoat, Neckwear.Cravat, Headwear.None, Prop.Dime], boss: BOSS },
];

export const TYCOONS: readonly FighterDef[] = ROWS.map((row) => defineFighter(Category.Tycoons, row));
