/**
 * Turns roster stats (1..5) into the combat numbers the simulation uses: health, damage, speed and size.
 * Stat 3 maps to the base numbers; each point above or below shifts them by a small fixed step so no fighter is broken.
 * Bosses get extra health, damage and a bigger body on top of their stats.
 */
import { RosterDataError } from '../core/errors';
import { STAT_MAX, STAT_MIN, type FighterStats } from '../roster/rosterTypes';
import type { FinisherStyle } from '../roster/signatureTypes';
import {
  BASE_HEALTH, BOSS_DAMAGE_SCALE, BOSS_HEALTH_SCALE, BOSS_SIZE_SCALE, DAMAGE_PER_POWER,
  HEALTH_PER_TOUGHNESS, SPEED_PER_STAT, STAT_MIDDLE,
} from './fightConstants';
import type { CombatProfile } from './fightTypes';

/** Extra multipliers a mode applies on top of the stats (story stages scale CPU damage). */
export interface ProfileModifiers {
  boss: boolean;
  damageScale: number;
}

export const NO_MODIFIERS: Readonly<ProfileModifiers> = { boss: false, damageScale: 1 };

function checkStat(name: string, value: number): void {
  if (!Number.isInteger(value) || value < STAT_MIN || value > STAT_MAX) {
    throw new RosterDataError(`Stat ${name}=${value} is outside ${STAT_MIN}..${STAT_MAX}`);
  }
}

export function combatProfile(stats: Readonly<FighterStats>, mods: Readonly<ProfileModifiers>, finisher: FinisherStyle): CombatProfile {
  checkStat('power', stats.power);
  checkStat('speed', stats.speed);
  checkStat('toughness', stats.toughness);
  const bossHealth = mods.boss ? BOSS_HEALTH_SCALE : 1;
  const bossDamage = mods.boss ? BOSS_DAMAGE_SCALE : 1;
  return {
    maxHealth: Math.round((BASE_HEALTH + (stats.toughness - STAT_MIDDLE) * HEALTH_PER_TOUGHNESS) * bossHealth),
    damageScale: (1 + (stats.power - STAT_MIDDLE) * DAMAGE_PER_POWER) * bossDamage * mods.damageScale,
    speedScale: 1 + (stats.speed - STAT_MIDDLE) * SPEED_PER_STAT,
    sizeScale: mods.boss ? BOSS_SIZE_SCALE : 1,
    finisher,
  };
}
