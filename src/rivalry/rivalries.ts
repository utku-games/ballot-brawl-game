/**
 * The Rivalry Battles table: famous rivalries and Special Edition joke matchups, each a 1v1 with a title and a twist.
 * Validation runs at load and rejects unknown or repeated fighters, duplicate ids or titles, and forbidden pairings.
 * Netanyahu and Khamenei are never paired, at the user's request, so that pairing is rejected outright.
 */
import { RosterDataError } from '../core/errors';
import { fighterById } from '../roster/roster';
import { ArenaKind } from '../view/arenaKinds';
import { RivalrySection, Twist, type Rivalry } from './rivalryTypes';

const R = RivalrySection.Rivalries;
const S = RivalrySection.SpecialEdition;

/** Pairs that must never meet in a rivalry, in either order. */
export const FORBIDDEN_PAIRS: readonly (readonly [string, string])[] = [['benjamin-netanyahu', 'ali-khamenei']];

export const RIVALRIES: readonly Rivalry[] = [
  { id: 'currents', section: R, left: 'thomas-edison', right: 'nikola-tesla', title: 'The War of the Currents', tagline: 'Direct current or alternating current? Lights out for the loser.', arena: ArenaKind.Museum, twist: Twist.Blackout },
  { id: 'tariffs', section: R, left: 'donald-trump', right: 'xi-jinping', title: 'The Tariff Tussle', tagline: 'Two superpowers, one very expensive handshake.', arena: ArenaKind.Parliament, twist: Twist.None },
  { id: 'cage-match', section: R, left: 'elon-musk', right: 'mark-zuckerberg', title: 'The Cage Match', tagline: 'The fight they talked about for months, finally on.', arena: ArenaKind.TradingFloor, twist: Twist.HeavyHitters },
  { id: 'space-race', section: R, left: 'elon-musk', right: 'jeff-bezos', title: 'The Space Race', tagline: 'Two rocket fans, one launch pad.', arena: ArenaKind.TradingFloor, twist: Twist.Turbo },
  { id: 'garage', section: R, left: 'steve-jobs', right: 'bill-gates', title: 'The Garage Rivals', tagline: 'Who really built the personal computer?', arena: ArenaKind.TradingFloor, twist: Twist.None },
  { id: 'rematch', section: R, left: 'joe-biden', right: 'donald-trump', title: 'The Rematch', tagline: 'They have done this before.', arena: ArenaKind.Parliament, twist: Twist.None },
  { id: 'question-time', section: R, left: 'boris-johnson', right: 'keir-starmer', title: 'Question Time', tagline: 'Order! Order!', arena: ArenaKind.Parliament, twist: Twist.None },
  { id: 'goat-debate', section: R, left: 'cristiano-ronaldo', right: 'lionel-messi', title: 'The G.O.A.T. Debate', tagline: 'Settle the argument every football fan has.', arena: ArenaKind.Studio, twist: Twist.Turbo },
  { id: 'the-feud', section: R, left: 'taylor-swift', right: 'kim-kardashian', title: 'The Feud', tagline: 'Look what you made them do.', arena: ArenaKind.Studio, twist: Twist.None },
  { id: 'goat-summit', section: S, left: 'shehbaz-sharif', right: 'goat', title: 'The G.O.A.T. Summit', tagline: 'A prime minister meets the greatest of all time.', arena: ArenaKind.Parliament, twist: Twist.None },
  { id: 'pork-barrel', section: S, left: 'david-cameron', right: 'pig', title: 'The Pork Barrel', tagline: 'A former prime minister meets the opposition he never saw coming.', arena: ArenaKind.Parliament, twist: Twist.HeavyHitters },
  { id: 'chief-mouser', section: S, left: 'keir-starmer', right: 'larry', title: 'The Chief Mouser', tagline: 'Prime ministers come and go. The cat stays.', arena: ArenaKind.Parliament, twist: Twist.None },
  { id: 'bull-market', section: S, left: 'warren-buffett', right: 'bull', title: 'Bull Market', tagline: 'The oracle meets the market mascot in person.', arena: ArenaKind.TradingFloor, twist: Twist.Turbo },
  { id: 'free-range', section: S, left: 'gordon-ramsay', right: 'chicken', title: 'Free Range', tagline: 'One chef, one very fast chicken, no recipe.', arena: ArenaKind.Studio, twist: Twist.HeavyHitters },
  { id: 'desert-derby', section: S, left: 'recep-tayyip-erdogan', right: 'camel', title: 'The Desert Derby', tagline: 'One has humps, the other has a long walk home.', arena: ArenaKind.Museum, twist: Twist.Turbo },
];

function isForbidden(a: string, b: string): boolean {
  return FORBIDDEN_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** Throws RosterDataError when a rivalry breaks a rule; exported for tests. */
export function validateRivalries(list: readonly Rivalry[]): void {
  const ids = new Set<string>();
  const titles = new Set<string>();
  for (const r of list) {
    if (ids.has(r.id)) throw new RosterDataError(`Duplicate rivalry id ${r.id}`);
    if (titles.has(r.title)) throw new RosterDataError(`Duplicate rivalry title ${r.title}`);
    ids.add(r.id);
    titles.add(r.title);
    fighterById(r.left);
    fighterById(r.right);
    if (r.left === r.right) throw new RosterDataError(`${r.id} pairs ${r.left} with itself`);
    if (isForbidden(r.left, r.right)) throw new RosterDataError(`${r.id} pairs ${r.left} and ${r.right}, which is not allowed`);
  }
}

validateRivalries(RIVALRIES);

export function rivalriesIn(section: RivalrySection): Rivalry[] {
  return RIVALRIES.filter((r) => r.section === section);
}
