/**
 * Tests for unlocks and trophies: bosses stay locked until their league's story is won, everyone else is always open.
 * A league win unlocks its boss only once, and the trophy counts follow the saved progress.
 * Saved league wins load from storage and ignore anything that is not a story league.
 */
import { describe, expect, it } from 'vitest';
import { RIVALRIES } from '../rivalry/rivalries';
import { bossOf, CATEGORY_ORDER, fighterById, fightersIn } from '../roster/roster';
import { Category } from '../roster/rosterTypes';
import { recordLeagueWin, type SaveData } from './saveData';
import { lockReason, newlyUnlocked, trophies } from './unlocks';

const NONE = { leaguesWon: [], rivalriesWon: [] };

function save(): SaveData {
  return { best: {}, rivalriesWon: [], leaguesWon: [], muted: false };
}

describe('unlocks', () => {
  it('locks every boss until its league is won, and nobody else', () => {
    for (const c of CATEGORY_ORDER) expect(lockReason(bossOf(c), NONE), c).toContain('story');
    for (const f of [...fightersIn(Category.Specials), fighterById('nikola-tesla')]) expect(lockReason(f, NONE)).toBeNull();
    expect(lockReason(bossOf(Category.Legends), { ...NONE, leaguesWon: [Category.Legends] })).toBeNull();
    expect(lockReason(bossOf(Category.Tycoons), { ...NONE, leaguesWon: [Category.Legends] })).not.toBeNull();
  });

  it('unlocks a boss only the first time its league is won', () => {
    const s = save();
    expect(newlyUnlocked(Category.Celebrities, s)?.id).toBe('arnold-schwarzenegger');
    expect(recordLeagueWin(s, Category.Celebrities)).toBe(true);
    expect(newlyUnlocked(Category.Celebrities, s)).toBeNull();
    expect(recordLeagueWin(s, Category.Celebrities)).toBe(false);
  });

  it('counts trophies from the progress', () => {
    const t = trophies({ leaguesWon: [Category.Politicians], rivalriesWon: [RIVALRIES[0].id, 'unknown'] });
    expect(t).toEqual({ leaguesWon: 1, leagues: CATEGORY_ORDER.length, rivalriesSettled: 1, rivalries: RIVALRIES.length, bossesUnlocked: 1 });
  });
});
