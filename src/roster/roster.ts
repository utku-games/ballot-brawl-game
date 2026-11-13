/**
 * The full roster: the four story categories plus the Specials, lookups by id and category, and a validation pass.
 * Validation guarantees unique ids, at least ten regulars and exactly one boss per story category, no boss among the
 * Specials, a fair stat total, and a look and signature built only from their catalogues.
 * Broken data raises RosterDataError immediately instead of failing later inside a match.
 */
import { RosterDataError, UnknownEntityError } from '../core/errors';
import { CELEBRITIES } from './celebrities';
import { LEGENDS } from './legends';
import { Build, Headwear, Neckwear, Outfit, Prop } from './lookTypes';
import { POLITICIANS } from './politicians';
import { Category, type FighterDef } from './rosterTypes';
import { FinisherStyle, Gesture, Projectile } from './signatureTypes';
import { SPECIALS } from './specials';
import { TYCOONS } from './tycoons';

/** Fewest regular (non-boss) fighters a story category may have: the player's pick plus nine ladder opponents. */
export const MIN_REGULARS = 10;
/** Stat total (power + speed + toughness) of every regular fighter. */
export const REGULAR_STAT_TOTAL = 9;

/** The story categories, in menu order. */
export const CATEGORY_ORDER: readonly Category[] = [Category.Politicians, Category.Tycoons, Category.Legends, Category.Celebrities];
/** Every group shown in Brawl: the story categories, then the Specials. */
export const BRAWL_ORDER: readonly Category[] = [...CATEGORY_ORDER, Category.Specials];

export const CATEGORY_LABEL: Readonly<Record<Category, string>> = {
  [Category.Politicians]: 'Politicians',
  [Category.Tycoons]: 'Tycoons',
  [Category.Legends]: 'Legends',
  [Category.Celebrities]: 'Celebrities',
  [Category.Specials]: 'Specials',
};

function statTotal(f: Readonly<FighterDef>): number {
  return f.stats.power + f.stats.speed + f.stats.toughness;
}

const LOOK_CATALOGUE: Readonly<Record<'build' | 'outfit' | 'neckwear' | 'headwear' | 'prop', readonly string[]>> = {
  build: Object.values(Build),
  outfit: Object.values(Outfit),
  neckwear: Object.values(Neckwear),
  headwear: Object.values(Headwear),
  prop: Object.values(Prop),
};

function validateLook(f: Readonly<FighterDef>): void {
  for (const [field, values] of Object.entries(LOOK_CATALOGUE)) {
    const value = f.look[field as keyof typeof LOOK_CATALOGUE];
    if (!values.includes(value)) throw new RosterDataError(`${f.id} has unknown ${field} ${value}`);
  }
}

function validateSignature(f: Readonly<FighterDef>): void {
  const { style, gesture, projectile } = f.signature;
  if (!Object.values(FinisherStyle).includes(style)) throw new RosterDataError(`${f.id} has unknown finisher style ${style}`);
  if (!Object.values(Gesture).includes(gesture)) throw new RosterDataError(`${f.id} has unknown gesture ${gesture}`);
  if (!Object.values(Projectile).includes(projectile)) throw new RosterDataError(`${f.id} has unknown projectile ${projectile}`);
  const throws = style === FinisherStyle.Throw;
  if (throws !== (projectile !== Projectile.None)) {
    throw new RosterDataError(`${f.id} needs a projectile exactly when its finisher style is throw`);
  }
}

/** Throws RosterDataError when the list breaks a roster rule; exported for tests. */
export function validateRoster(fighters: readonly FighterDef[]): void {
  const ids = new Set<string>();
  for (const f of fighters) {
    if (ids.has(f.id)) throw new RosterDataError(`Duplicate fighter id ${f.id}`);
    ids.add(f.id);
    validateLook(f);
    validateSignature(f);
    if (!f.boss && statTotal(f) !== REGULAR_STAT_TOTAL) {
      throw new RosterDataError(`${f.id} has stat total ${statTotal(f)}, expected ${REGULAR_STAT_TOTAL}`);
    }
  }
  for (const category of CATEGORY_ORDER) {
    const members = fighters.filter((f) => f.category === category);
    const bosses = members.filter((f) => f.boss).length;
    if (bosses !== 1) throw new RosterDataError(`${category} has ${bosses} bosses, expected 1`);
    if (members.length - bosses < MIN_REGULARS) {
      throw new RosterDataError(`${category} has ${members.length - bosses} regulars, expected at least ${MIN_REGULARS}`);
    }
  }
  if (fighters.some((f) => f.category === Category.Specials && f.boss)) throw new RosterDataError('Specials cannot have a boss');
}

export const ROSTER: readonly FighterDef[] = [...POLITICIANS, ...TYCOONS, ...LEGENDS, ...CELEBRITIES, ...SPECIALS];
validateRoster(ROSTER);

const BY_ID = new Map(ROSTER.map((f) => [f.id, f]));

export function fighterById(id: string): FighterDef {
  const found = BY_ID.get(id);
  if (!found) throw new UnknownEntityError(`Unknown fighter ${id}`);
  return found;
}

export function fightersIn(category: Category): FighterDef[] {
  return ROSTER.filter((f) => f.category === category);
}

export function bossOf(category: Category): FighterDef {
  const boss = ROSTER.find((f) => f.category === category && f.boss);
  if (!boss) throw new RosterDataError(`${category} has no boss`);
  return boss;
}
