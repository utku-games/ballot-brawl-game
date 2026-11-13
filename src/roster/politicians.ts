/**
 * The Politicians category: eleven caricatured politicians from several countries and parties, plus a historical boss.
 * The mix spans left, centre and right so the satire is about politics in general, not one side.
 * Every regular fighter has the same stat total; the boss gets more and fights last in the story ladder.
 */
import { defineFighter, type FighterRow } from './defineFighter';
import { Category, type FighterDef } from './rosterTypes';

const REG = false;
const BOSS = true;

const ROWS: readonly FighterRow[] = [
  { id: 'donald-trump', name: 'Donald Trump', nickname: 'The Dealmaker', finisher: "You're Fired", stats: [4, 2, 3], colors: [0x1b2a4a, 0xd0202a, 0xf0b98a, 0xe8c66a], boss: REG },
  { id: 'joe-biden', name: 'Joe Biden', nickname: 'Aviator Joe', finisher: 'No Malarkey', stats: [3, 2, 4], colors: [0x1d2b4f, 0x3060c0, 0xf2c7a5, 0xeeeeee], boss: REG },
  { id: 'barack-obama', name: 'Barack Obama', nickname: 'The Hope Hook', finisher: 'Yes We Can', stats: [3, 4, 2], colors: [0x2b2b30, 0x2a5db0, 0x8d5a3b, 0x222222], boss: REG },
  { id: 'bernie-sanders', name: 'Bernie Sanders', nickname: 'The Mittens', finisher: 'Once Again Asking', stats: [2, 3, 4], colors: [0x5a4632, 0x8aa0c8, 0xf0c2a0, 0xf2f2f2], boss: REG },
  { id: 'boris-johnson', name: 'Boris Johnson', nickname: 'Mop Top', finisher: 'Get It Done', stats: [4, 3, 2], colors: [0x1d2340, 0x4a6fb0, 0xf3c4a8, 0xf3e3a0], boss: REG },
  { id: 'keir-starmer', name: 'Keir Starmer', nickname: 'The Barrister', finisher: 'Point of Order', stats: [3, 3, 3], colors: [0x22283a, 0xc0303a, 0xf0c4a6, 0x9a9a9a], boss: REG },
  { id: 'emmanuel-macron', name: 'Emmanuel Macron', nickname: 'Le Jupiter', finisher: 'En Marche', stats: [3, 4, 2], colors: [0x1c2440, 0x2250a0, 0xf2c6a8, 0x4a3a2a], boss: REG },
  { id: 'angela-merkel', name: 'Angela Merkel', nickname: 'Mutti', finisher: 'The Diamond', stats: [3, 2, 4], colors: [0xc03a3a, 0x222222, 0xf2caa8, 0xd0b080], boss: REG },
  { id: 'justin-trudeau', name: 'Justin Trudeau', nickname: 'Sunny Ways', finisher: 'Maple Leaf Slap', stats: [2, 4, 3], colors: [0x2a2e3a, 0xd02a2a, 0xf0c09e, 0x3a2a1e], boss: REG },
  { id: 'giorgia-meloni', name: 'Giorgia Meloni', nickname: 'The Roman', finisher: 'Io Sono Giorgia', stats: [3, 4, 2], colors: [0x262a3c, 0x2a7a3a, 0xf2c8a6, 0xe0c070], boss: REG },
  { id: 'javier-milei', name: 'Javier Milei', nickname: 'El Leon', finisher: 'Budget Chainsaw', stats: [4, 3, 2], colors: [0x1e1e1e, 0x7fb8e8, 0xf0c09e, 0x4a2e1e], boss: REG },
  { id: 'winston-churchill', name: 'Winston Churchill', nickname: 'The Bulldog', finisher: 'Never Surrender', stats: [4, 2, 5], colors: [0x2a2a2a, 0x5a1a8a, 0xf4c9b0, 0xd8d0c0], boss: BOSS },
];

export const POLITICIANS: readonly FighterDef[] = ROWS.map((row) => defineFighter(Category.Politicians, row));
