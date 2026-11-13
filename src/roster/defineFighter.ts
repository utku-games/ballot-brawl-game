/**
 * Compact builder for roster entries so the category files read like a table.
 * Stats are given as [power, speed, toughness], colours as [suit, accent, skin, hair] and the kit as
 * [build, outfit, neckwear, headwear, prop].
 * It only reshapes data; validation happens in roster.ts.
 */
import type { LookKit } from './lookTypes';
import type { Category, FighterDef } from './rosterTypes';

export type StatTriple = readonly [power: number, speed: number, toughness: number];
export type ColorQuad = readonly [suit: number, accent: number, skin: number, hair: number];

export interface FighterRow {
  id: string;
  name: string;
  nickname: string;
  finisher: string;
  stats: StatTriple;
  colors: ColorQuad;
  kit: LookKit;
  boss: boolean;
}

export function defineFighter(category: Category, row: Readonly<FighterRow>): FighterDef {
  const [power, speed, toughness] = row.stats;
  const [suitColor, accentColor, skinColor, hairColor] = row.colors;
  const [build, outfit, neckwear, headwear, prop] = row.kit;
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname,
    category,
    stats: { power, speed, toughness },
    finisher: row.finisher,
    look: { build, outfit, neckwear, headwear, prop, suitColor, accentColor, skinColor, hairColor },
    boss: row.boss,
  };
}
