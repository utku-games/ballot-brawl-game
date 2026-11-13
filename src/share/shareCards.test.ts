/**
 * Tests for share cards: rivalry wins and losses, Brawl duels, Party brawls, draws and Story runs.
 * They check the names in the headline, subtitle and message, the marked winner and the link target.
 * Fighter and rivalry data come from the real tables, so renamed fighters show up here.
 */
import { describe, expect, it } from 'vitest';
import { RIVALRIES } from '../rivalry/rivalries';
import { Category } from '../roster/rosterTypes';
import { brawlCard, rivalryCard, storyCard } from './shareCards';
import { ShareKind } from './shareLink';

/** The War of the Currents is the first rivalry in the table. */
const CURRENTS = RIVALRIES[0];

describe('share cards', () => {
  it('describes a rivalry win', () => {
    expect(CURRENTS.id).toBe('currents');
    const card = rivalryCard(CURRENTS, 'nikola-tesla', true);
    expect(card.headline).toBe('The War of the Currents');
    expect(card.subtitle).toBe('Nikola Tesla beat Thomas Edison');
    expect(card.winnerIds).toEqual(['nikola-tesla']);
    expect(card.text).toContain('as Nikola Tesla');
    expect(card.target).toEqual({ kind: ShareKind.Rivalry, rivalryId: 'currents' });
  });

  it('describes a rivalry loss', () => {
    const card = rivalryCard(CURRENTS, 'thomas-edison', false);
    expect(card.subtitle).toBe('Nikola Tesla beat Thomas Edison');
    expect(card.winnerIds).toEqual(['nikola-tesla']);
    expect(card.text).toContain('as Thomas Edison');
  });

  it('gives a duel a rematch link', () => {
    const card = brawlCard(['goat', 'pig'], ['pig'], false);
    expect(card.headline).toBe('Goat vs Pig');
    expect(card.subtitle).toBe('Pig wins!');
    expect(card.text).toBe('Pig won a Ballot Brawl match with Goat, Pig. Your turn.');
    expect(card.target).toEqual({ kind: ShareKind.Duel, left: 'goat', right: 'pig' });
  });

  it('describes a party brawl and a draw', () => {
    const party = brawlCard(['goat', 'pig', 'camel'], [], true);
    expect(party.headline).toBe('Party Brawl');
    expect(party.subtitle).toBe('It ended in a draw.');
    expect(party.text).toContain('Goat, Pig, Camel');
    expect(party.target).toBeNull();
  });

  it('describes a team brawl won by two fighters', () => {
    const card = brawlCard(['goat', 'pig', 'camel', 'bull'], ['goat', 'pig'], false);
    expect(card.headline).toBe('Team Brawl');
    expect(card.subtitle).toBe('Goat & Pig win!');
    expect(card.target).toBeNull();
  });

  it('gives a duel with a boss no link', () => {
    expect(brawlCard(['goat', 'winston-churchill'], ['goat'], false).target).toBeNull();
  });

  it('gives a two-fighter party no rematch link', () => {
    expect(brawlCard(['goat', 'pig'], ['goat'], true).target).toBeNull();
  });

  it('describes a story run', () => {
    const won = storyCard(Category.Legends, 'nikola-tesla', true, 'A');
    expect(won.subtitle).toBe('Nikola Tesla - Legends league - Rank A');
    expect(won.winnerIds).toEqual(['nikola-tesla']);
    const lost = storyCard(Category.Legends, 'nikola-tesla', false, 'C');
    expect(lost.winnerIds).toEqual([]);
    expect(lost.text).toContain('fell short');
  });
});
