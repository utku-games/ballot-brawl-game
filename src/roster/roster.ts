/**
 * The full roster: all three categories, lookups by id and category, and a validation pass run at load.
 * Validation guarantees unique ids, eleven regulars and exactly one boss per category, and a fair stat total.
 * Broken data raises RosterDataError immediately instead of failing later inside a match.
 */
import { RosterDataError, UnknownEntityError } from '../core/errors';
import { LEGENDS } from './legends';
import { POLITICIANS } from './politicians';
import { Category, type FighterDef } from './rosterTypes';
import { TYCOONS } from './tycoons';

/** Regular (non-boss) fighters each category must have: the player's pick plus ten ladder opponents. */
export const REGULARS_PER_CATEGORY = 11;
/** Stat total (power + speed + toughness) of every regular fighter. */
export const REGULAR_STAT_TOTAL = 9;

export const CATEGORY_ORDER: readonly Category[] = [Category.Politicians, Category.Tycoons, Category.Legends];

export const CATEGORY_LABEL: Readonly<Record<Category, string>> = {
  [Category.Politicians]: 'Politicians',
  [Category.Tycoons]: 'Tycoons',
  [Category.Legends]: 'Legends',
};

function statTotal(f: Readonly<FighterDef>): number {
  return f.stats.power + f.stats.speed + f.stats.toughness;
}

/** Throws RosterDataError when the list breaks a roster rule; exported for tests. */
export function validateRoster(fighters: readonly FighterDef[]): void {
  const ids = new Set<string>();
  for (const f of fighters) {
    if (ids.has(f.id)) throw new RosterDataError(`Duplicate fighter id ${f.id}`);
    ids.add(f.id);
    if (!f.boss && statTotal(f) !== REGULAR_STAT_TOTAL) {
      throw new RosterDataError(`${f.id} has stat total ${statTotal(f)}, expected ${REGULAR_STAT_TOTAL}`);
    }
  }
  for (const category of CATEGORY_ORDER) {
    const members = fighters.filter((f) => f.category === category);
    const bosses = members.filter((f) => f.boss).length;
    if (bosses !== 1) throw new RosterDataError(`${category} has ${bosses} bosses, expected 1`);
    if (members.length - bosses !== REGULARS_PER_CATEGORY) {
      throw new RosterDataError(`${category} has ${members.length - bosses} regulars, expected ${REGULARS_PER_CATEGORY}`);
    }
  }
}

export const ROSTER: readonly FighterDef[] = [...POLITICIANS, ...TYCOONS, ...LEGENDS];
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
