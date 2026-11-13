/**
 * The Legends category: eleven historical figures from science, art, literature and royalty, plus Napoleon as boss.
 * Their portraits are centuries old and in the public domain, so this is the safest category to extend.
 * Every regular fighter has the same stat total; the boss gets more and fights last in the story ladder.
 */
import { defineFighter, type FighterRow } from './defineFighter';
import { Build, Headwear, Neckwear, Outfit, Prop } from './lookTypes';
import { Category, type FighterDef } from './rosterTypes';

const REG = false;
const BOSS = true;

const ROWS: readonly FighterRow[] = [
  { id: 'albert-einstein', name: 'Albert Einstein', nickname: 'The Relative', finisher: 'E = MC Smash', stats: [4, 2, 3], colors: [0x6a5a4a, 0xc8b090, 0xf2caa8, 0xf0f0f0], kit: [Build.Average, Outfit.LabCoat, Neckwear.None, Headwear.None, Prop.Chalk], boss: REG },
  { id: 'isaac-newton', name: 'Isaac Newton', nickname: 'The Apple', finisher: 'Gravity Drop', stats: [3, 3, 3], colors: [0x3a2a3a, 0xc0c0c0, 0xf2d0b8, 0xd8d0c8], kit: [Build.Average, Outfit.FrockCoat, Neckwear.Cravat, Headwear.None, Prop.Apple], boss: REG },
  { id: 'leonardo-da-vinci', name: 'Leonardo da Vinci', nickname: 'The Polymath', finisher: 'Flying Machine', stats: [3, 3, 3], colors: [0x6a3a2a, 0xc89a4a, 0xf0c8a8, 0xd8d8d0], kit: [Build.Average, Outfit.Robe, Neckwear.None, Headwear.RenaissanceCap, Prop.Paintbrush], boss: REG },
  { id: 'william-shakespeare', name: 'William Shakespeare', nickname: 'The Bard', finisher: 'To Be or Not to Be', stats: [2, 4, 3], colors: [0x2a2a2a, 0xf0f0f0, 0xf2ccaa, 0x6a4a2a], kit: [Build.Average, Outfit.Doublet, Neckwear.Ruff, Headwear.None, Prop.Quill], boss: REG },
  { id: 'cleopatra', name: 'Cleopatra', nickname: 'Queen of the Nile', finisher: 'Nile Flood', stats: [3, 4, 2], colors: [0xf2efe6, 0x1a6aa0, 0xe8ddd0, 0x1a1a1a], kit: [Build.Average, Outfit.Gown, Neckwear.GoldCollar, Headwear.EgyptianHeaddress, Prop.Snake], boss: REG },
  { id: 'julius-caesar', name: 'Julius Caesar', nickname: 'The Dictator', finisher: 'Veni Vidi Vici', stats: [4, 3, 2], colors: [0xe8e0d0, 0xa01a2a, 0xe0d8cc, 0xcfc5b5], kit: [Build.Average, Outfit.Toga, Neckwear.None, Headwear.Laurel, Prop.Sword], boss: REG },
  { id: 'abraham-lincoln', name: 'Abraham Lincoln', nickname: 'Honest Abe', finisher: 'Four Score Fury', stats: [3, 2, 4], colors: [0x1a1a1a, 0x2a2a2a, 0xe8c4a4, 0x2a1e18], kit: [Build.Lanky, Outfit.FrockCoat, Neckwear.BowTie, Headwear.TopHat, Prop.None], boss: REG },
  { id: 'queen-victoria', name: 'Queen Victoria', nickname: 'The Empress', finisher: 'We Are Not Amused', stats: [3, 2, 4], colors: [0x1a1a1a, 0xe8e8e8, 0xf2d4c0, 0x6a5a4a], kit: [Build.Round, Outfit.Gown, Neckwear.None, Headwear.Crown, Prop.Sceptre], boss: REG },
  { id: 'marie-curie', name: 'Marie Curie', nickname: 'The Glow', finisher: 'Radiant Strike', stats: [4, 3, 2], colors: [0x1a1a1a, 0x7aff9a, 0xf2ccb0, 0x8a7a6a], kit: [Build.Average, Outfit.Gown, Neckwear.None, Headwear.None, Prop.Vial], boss: REG },
  { id: 'nikola-tesla', name: 'Nikola Tesla', nickname: 'The Current', finisher: 'Alternating Current', stats: [4, 4, 1], colors: [0x2a2a32, 0x6ac8ff, 0xf0c8a8, 0x1a1a1a], kit: [Build.Lanky, Outfit.FrockCoat, Neckwear.Tie, Headwear.None, Prop.CoilWand], boss: REG },
  { id: 'wolfgang-amadeus-mozart', name: 'Wolfgang Amadeus Mozart', nickname: 'The Prodigy', finisher: 'Requiem Rondo', stats: [2, 5, 2], colors: [0xc03a3a, 0xe8d090, 0xf4d2bc, 0xe8e0d8], kit: [Build.Short, Outfit.FrockCoat, Neckwear.Cravat, Headwear.None, Prop.Baton], boss: REG },
  { id: 'napoleon-bonaparte', name: 'Napoleon Bonaparte', nickname: 'Le Petit Caporal', finisher: 'Waterloo Reversal', stats: [5, 3, 3], colors: [0x1a2a5a, 0xd4af37, 0xf2d0b8, 0x3a2a1a], kit: [Build.Short, Outfit.MilitaryCoat, Neckwear.None, Headwear.Bicorne, Prop.Sword], boss: BOSS },
];

export const LEGENDS: readonly FighterDef[] = ROWS.map((row) => defineFighter(Category.Legends, row));
