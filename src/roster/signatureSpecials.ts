/**
 * Every fighter's signature special: which of the seven special mechanics they use and its name, announced when they fire it.
 * Names are light parody built on each fighter's public persona, nickname or finisher, in the same spirit as the finisher names.
 * Pure data keyed by roster id; the roster test checks that every fighter has one.
 */
import { MoveKind } from '../fight/moveTypes';
import type { SpecialMove } from '../fight/specialLibrary';

export interface SignatureSpecial {
  move: SpecialMove;
  name: string;
}

const BITE = MoveKind.Bite;
const RUSH = MoveKind.Bullrush;
const LEAP = MoveKind.LeapSlam;
const SPIN = MoveKind.Tornado;
const COUNTER = MoveKind.Counter;
const WAVE = MoveKind.Shockwave;
const GRAB = MoveKind.Grab;

const SPECIALS: Readonly<Record<string, readonly [SpecialMove, string]>> = {
  'donald-trump': [WAVE, 'Huge Rally'],
  'joe-biden': [COUNTER, "Here's the Deal"],
  'barack-obama': [LEAP, 'Mic Drop'],
  'bernie-sanders': [WAVE, 'Grassroots Roar'],
  'boris-johnson': [RUSH, 'Rugby Tackle'],
  'keir-starmer': [COUNTER, 'Objection!'],
  'emmanuel-macron': [GRAB, 'Iron Handshake'],
  'angela-merkel': [COUNTER, 'Steady Hands'],
  'justin-trudeau': [SPIN, 'Maple Spin'],
  'giorgia-meloni': [RUSH, 'Roman Charge'],
  'javier-milei': [SPIN, 'Chainsaw Spin'],
  'benjamin-netanyahu': [GRAB, 'Coalition Clinch'],
  'ali-khamenei': [WAVE, 'Decree'],
  'xi-jinping': [COUNTER, 'Great Firewall'],
  'shehbaz-sharif': [RUSH, 'Fast Track'],
  'recep-tayyip-erdogan': [RUSH, 'Midfield Tackle'],
  'david-cameron': [WAVE, 'Big Society'],
  'winston-churchill': [WAVE, 'We Shall Fight'],
  'elon-musk': [LEAP, 'Rocket Landing'],
  'jeff-bezos': [RUSH, 'Same-Day Sprint'],
  'bill-gates': [COUNTER, 'Firewall'],
  'mark-zuckerberg': [GRAB, 'Friend Request'],
  'warren-buffett': [COUNTER, 'Buy the Dip'],
  'richard-branson': [LEAP, 'Skydive'],
  'larry-ellison': [SPIN, 'Regatta Spin'],
  'jensen-huang': [SPIN, 'Cooling Fan'],
  'oprah-winfrey': [WAVE, 'You Get a Shove!'],
  'steve-jobs': [COUNTER, 'Think Different'],
  'jack-ma': [RUSH, 'Flash Sale'],
  'john-d-rockefeller': [GRAB, 'Hostile Takeover'],
  'albert-einstein': [WAVE, 'Big Bang'],
  'isaac-newton': [LEAP, 'Gravity Well'],
  'leonardo-da-vinci': [LEAP, 'Glider Drop'],
  'william-shakespeare': [COUNTER, 'Plot Twist'],
  cleopatra: [BITE, 'Asp Strike'],
  'julius-caesar': [RUSH, 'Rubicon Charge'],
  'abraham-lincoln': [LEAP, 'Log Splitter'],
  'queen-victoria': [COUNTER, 'Royal Snub'],
  'marie-curie': [WAVE, 'Half-Life'],
  'nikola-tesla': [SPIN, 'Tesla Coil'],
  'wolfgang-amadeus-mozart': [SPIN, 'Allegro Spin'],
  'thomas-edison': [WAVE, 'Lights Out'],
  'napoleon-bonaparte': [RUSH, 'Cavalry Charge'],
  'taylor-swift': [SPIN, 'Encore Spin'],
  beyonce: [WAVE, 'Diva Wave'],
  'cristiano-ronaldo': [LEAP, 'Siuuu Landing'],
  'lionel-messi': [RUSH, 'Dribble Rush'],
  'dwayne-johnson': [GRAB, "Wrestler's Slam"],
  'snoop-dogg': [COUNTER, 'Laid Back'],
  'lady-gaga': [SPIN, 'Showstopper Spin'],
  'gordon-ramsay': [GRAB, 'Idiot Sandwich'],
  'keanu-reeves': [COUNTER, 'Bullet Dodge'],
  'kim-kardashian': [WAVE, 'Viral Moment'],
  'arnold-schwarzenegger': [GRAB, 'Olympia Press'],
  goat: [RUSH, 'Billy Ram'],
  pig: [BITE, 'Truffle Chomp'],
  camel: [BITE, 'Desert Nibble'],
  larry: [BITE, 'Pounce Bite'],
  bull: [RUSH, 'Red Cape Rush'],
  chicken: [BITE, 'Peck Attack'],
};

/** Fallback for a fighter added to the roster before their special is chosen; the roster test fails until it is. */
const FALLBACK: SignatureSpecial = { move: MoveKind.Bullrush, name: 'Signature Move' };

/** The signature special of a roster fighter. */
export function signatureSpecialOf(fighterId: string): SignatureSpecial {
  const entry = SPECIALS[fighterId];
  return entry ? { move: entry[0], name: entry[1] } : FALLBACK;
}

/** Ids with a chosen special, for the roster test. */
export function fightersWithSpecials(): readonly string[] {
  return Object.keys(SPECIALS);
}
