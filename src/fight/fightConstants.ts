/**
 * Tuning constants of the fight simulation, all in meters, seconds and 60 Hz ticks.
 * Keeping them in one place makes balance changes a data edit and keeps the step functions readable.
 * Move frame data lives in moves.ts; these are the rules shared by every move.
 */

/** Simulation steps per second. */
export const TICK_RATE = 60;
/** Seconds per simulation step. */
export const TICK_SECONDS = 1 / TICK_RATE;
/** Fighters per team at most (4 versus 4). */
export const MAX_TEAM_SIZE = 4;
/** Number of sides in a match. */
export const TEAM_COUNT = 2;
/** Round length in ticks (99 seconds). */
export const MATCH_TIME_TICKS = 99 * TICK_RATE;

/** Base health before the toughness stat. */
export const BASE_HEALTH = 170;
/** Health added per toughness point above the middle value (3). */
export const HEALTH_PER_TOUGHNESS = 15;
/** Damage multiplier added per power point above the middle value. */
export const DAMAGE_PER_POWER = 0.08;
/** Speed multiplier added per speed point above the middle value. */
export const SPEED_PER_STAT = 0.07;
/** The middle stat value that maps to the base numbers. */
export const STAT_MIDDLE = 3;
/** Walking speed at speed 3, m/s. */
export const BASE_WALK_SPEED = 3.4;
/** Walking speed multiplier while defending. */
export const DEFEND_SPEED_SCALE = 0.35;
/** Body radius of a normal-size fighter, meters. */
export const BODY_RADIUS = 0.45;

/** Boss multipliers on health, damage and body size. */
export const BOSS_HEALTH_SCALE = 1.8;
export const BOSS_DAMAGE_SCALE = 1.25;
export const BOSS_SIZE_SCALE = 1.3;

/** Guard capacity; blocked hits drain it and an empty guard breaks. */
export const GUARD_MAX = 100;
/** Guard regained per tick while not defending. */
export const GUARD_REGEN_PER_TICK = 0.35;
/** Ticks of helplessness after a guard break. */
export const GUARD_BREAK_TICKS = 50;

/** Power meter capacity; a full meter enables the finisher. */
export const METER_MAX = 100;
/** Meter gained per point of damage dealt, taken, and per point of guard lost when blocking. */
export const METER_GAIN_DEAL = 1.1;
export const METER_GAIN_TAKE = 0.7;
export const METER_GAIN_BLOCK = 0.3;
/** Length of a taunt in ticks, and the meter it earns when it ends without being hit. */
export const TAUNT_TICKS = 54;
export const TAUNT_METER = 30;

/** Hits in one combo after which the target is knocked down instead of stunned again. */
export const KNOCKDOWN_COMBO = 4;
/** Ticks spent on the floor after a knockdown, then invulnerable while getting up. */
export const KNOCKDOWN_TICKS = 45;
export const GETUP_INVULNERABLE_TICKS = 40;
/** Knockback speed multiplier for a knockdown. */
export const KNOCKDOWN_KNOCKBACK_SCALE = 1.6;

/** Knockback speed lost per tick (fraction kept). */
export const KNOCKBACK_DECAY = 0.86;
/** Knockback speed below which it stops, m/s. */
export const KNOCKBACK_STOP = 0.05;
/** Fraction of the overlap resolved per tick when two bodies collide. */
export const SEPARATION_STRENGTH = 0.5;

/** Spawn layout: distance of the front line from the centre and spacing between teammates, meters. */
export const SPAWN_FRONT_X = 3;
export const SPAWN_ROW_SPACING_X = 1.2;
export const SPAWN_SPACING_Z = 1.6;
