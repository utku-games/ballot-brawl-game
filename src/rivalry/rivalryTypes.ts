/**
 * Types for Rivalry Battles: the two menu sections, the optional rule twists and the description of one rivalry.
 * A rivalry pairs two roster fighters with a title, a tagline, an arena and a twist that changes the fight a little.
 * Pure data with no rendering, so the rivalry table and its rules can be tested in isolation.
 */
import type { ArenaKind } from '../view/arenaKinds';

export enum RivalrySection {
  /** Famous real rivalries and feuds. */
  Rivalries = 'rivalries',
  /** Joke matchups. */
  SpecialEdition = 'special-edition',
}

export enum Twist {
  None = 'none',
  /** The arena lights flicker on and off. */
  Blackout = 'blackout',
  /** Both fighters move faster. */
  Turbo = 'turbo',
  /** Both fighters hit harder. */
  HeavyHitters = 'heavy-hitters',
}

export interface Rivalry {
  /** Stable kebab-case id, also the key for saved wins. */
  id: string;
  section: RivalrySection;
  /** Fighter on the left (team 0 side) and on the right. */
  left: string;
  right: string;
  title: string;
  tagline: string;
  arena: ArenaKind;
  twist: Twist;
}
