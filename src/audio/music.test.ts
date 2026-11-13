/**
 * Tests for the soundtrack data and the music intensity rule.
 * Every song must be well formed for the sequencer: one lead bar per chord, sixteen steps per bar and per drum line.
 * Intensity must be calm in the intro, driving in the fight and peaking near the end or near defeat.
 */
import { describe, expect, it } from 'vitest';
import { MusicIntensity } from '@utku/engine';
import { duel } from '../fight/testFight';
import { MatchPhase } from '../fight/fightTypes';
import { ARENA_ORDER } from '../view/arenaKinds';
import { musicIntensity, PEAK_HEALTH, PEAK_SECONDS } from './musicMood';
import { ALL_TRACKS, ARENA_TRACKS, STEPS_PER_BAR } from './songs';

const TICK_RATE = 60;
const MIN_BPM = 60;
const MAX_BPM = 200;

describe('songs', () => {
  it('gives every arena its own well-formed track', () => {
    for (const a of ARENA_ORDER) expect(ARENA_TRACKS[a], a).toBeDefined();
    expect(new Set(ALL_TRACKS.map((t) => t.song.id)).size).toBe(ALL_TRACKS.length);
    for (const { song, bpm } of ALL_TRACKS) {
      expect(bpm, song.id).toBeGreaterThanOrEqual(MIN_BPM);
      expect(bpm, song.id).toBeLessThanOrEqual(MAX_BPM);
      expect(song.lead.length, song.id).toBe(song.chords.length);
      for (const bar of song.lead) expect(bar.length, song.id).toBe(STEPS_PER_BAR);
      expect(song.bass.length, song.id).toBe(STEPS_PER_BAR);
      for (const line of Object.values(song.drums)) expect(line, song.id).toMatch(/^[x-]{16}$/);
    }
  });
});

describe('musicIntensity', () => {
  it('is calm before the fight and after it', () => {
    expect(musicIntensity(duel(3), false)).toBe(MusicIntensity.Calm);
    expect(musicIntensity({ ...duel(3), phase: MatchPhase.Over }, true)).toBe(MusicIntensity.Calm);
  });

  it('drives during a normal fight', () => {
    expect(musicIntensity(duel(3), true)).toBe(MusicIntensity.Drive);
  });

  it('peaks near the end of the clock or when a side is nearly beaten', () => {
    expect(musicIntensity({ ...duel(3), ticksLeft: PEAK_SECONDS * TICK_RATE }, true)).toBe(MusicIntensity.Peak);
    const low = duel(3);
    low.fighters[1].health = Math.floor(low.fighters[1].profile.maxHealth * PEAK_HEALTH) - 1;
    expect(musicIntensity(low, true)).toBe(MusicIntensity.Peak);
  });
});
