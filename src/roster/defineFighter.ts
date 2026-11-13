/**
 * Compact builder for roster entries so the category files read like a table.
 * Stats are given as [power, speed, toughness] and colours as [suit, accent, skin, hair].
 * It only reshapes data; validation happens in roster.ts.
 */
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
  boss: boolean;
}

export function defineFighter(category: Category, row: Readonly<FighterRow>): FighterDef {
  const [power, speed, toughness] = row.stats;
  const [suitColor, accentColor, skinColor, hairColor] = row.colors;
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname,
    category,
    stats: { power, speed, toughness },
    finisher: row.finisher,
    look: { suitColor, accentColor, skinColor, hairColor },
    boss: row.boss,
  };
}
