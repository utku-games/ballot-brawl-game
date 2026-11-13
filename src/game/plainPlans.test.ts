/**
 * Tests that brawl and story match plans stay plain fights, and that an older save without rivalry data still loads.
 * A plain plan has no banner and no twist, so only rivalries change the intro text and the rules.
 * The save test stubs local storage with a pre-rivalry save payload.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRng } from '@utku/engine';
import { Twist } from '../rivalry/rivalryTypes';
import { Category } from '../roster/rosterTypes';
import { buildLadder } from '../story/ladder';
import { startRun } from '../story/storyRun';
import { ArenaKind } from '../view/arenaKinds';
import { defaultBrawl, toMatchPlan } from './brawlConfig';
import { loadSave } from './saveData';
import { storyMatchPlan } from './storyPlan';

afterEach(() => vi.unstubAllGlobals());

describe('plain plans', () => {
  it('leaves brawl and story plans without banner or twist', () => {
    const rng = createRng(3);
    const brawl = toMatchPlan(defaultBrawl(ArenaKind.Museum), rng);
    expect(brawl.banner).toBeNull();
    expect(brawl.twist).toBe(Twist.None);
    const ladder = buildLadder(Category.Tycoons, 'elon-musk', rng);
    const story = storyMatchPlan(startRun(Category.Tycoons, 'elon-musk', ladder), 0);
    expect(story.banner).toBeNull();
    expect(story.twist).toBe(Twist.None);
  });

  it('loads a save written before rivalries existed', () => {
    const store = new Map<string, string>();
    store.set('ballot-brawl-save-v1', JSON.stringify({ best: { tycoons: { fighterId: 'elon-musk', score: 5, rank: 'A' } }, muted: true }));
    const storage = {
      getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k),
    };
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', { localStorage: storage });
    const save = loadSave();
    expect(save.rivalriesWon).toEqual([]);
    expect(save.leaguesWon).toEqual([]);
    expect(save.muted).toBe(true);
    expect(Object.keys(save.best)).toHaveLength(1);
  });

  it('keeps saved league wins and drops values that are not story leagues', () => {
    const store = new Map<string, string>();
    store.set('ballot-brawl-save-v1', JSON.stringify({ best: {}, leaguesWon: ['legends', 'specials', 'nonsense', 42], muted: false }));
    const storage = {
      getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k),
    };
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', { localStorage: storage });
    expect(loadSave().leaguesWon).toEqual(['legends']);
  });
});
