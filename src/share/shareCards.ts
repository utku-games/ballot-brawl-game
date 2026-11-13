/**
 * Share cards as pure data: what a shared result says and shows for a rivalry, a Brawl, a Party or a Story run.
 * A card has a headline, a subtitle, the fighters to picture with the winner marked, a message and an optional link target.
 * The image painter and the share adapter both read cards, so the wording is tested here without a browser.
 */
import type { Rivalry } from '../rivalry/rivalryTypes';
import { CATEGORY_LABEL, fighterById } from '../roster/roster';
import type { Category } from '../roster/rosterTypes';
import { ShareKind, type ShareTarget } from './shareLink';

/** The game's name, as it appears on cards and in messages. */
export const GAME_NAME = 'Ballot Brawl';

export interface ShareCard {
  headline: string;
  subtitle: string;
  /** Fighter ids to picture, left to right. */
  fighters: string[];
  /** The winning fighters' ids, ringed in gold; empty for a draw or a lost Story run. */
  winnerIds: string[];
  /** The message shared with the link. */
  text: string;
  /** What the shared link opens; null shares the plain game address. */
  target: ShareTarget | null;
}

function nameOf(id: string): string {
  return fighterById(id).name;
}

/** A rivalry fight: the player fought as playerId and won or lost. */
export function rivalryCard(r: Readonly<Rivalry>, playerId: string, won: boolean): ShareCard {
  const foeId = playerId === r.left ? r.right : r.left;
  const me = nameOf(playerId);
  const foe = nameOf(foeId);
  return {
    headline: r.title,
    subtitle: won ? `${me} beat ${foe}` : `${foe} beat ${me}`,
    fighters: [r.left, r.right],
    winnerIds: [won ? playerId : foeId],
    text: won
      ? `I settled ${r.title} as ${me} in ${GAME_NAME}. Think ${foe} can win it back?`
      : `${foe} beat me in ${r.title} in ${GAME_NAME}. Can you do better as ${me}?`,
    target: { kind: ShareKind.Rivalry, rivalryId: r.id },
  };
}

/** Brawl headlines for fights that are not one-on-one. */
export const PARTY_HEADLINE = 'Party Brawl';
export const TEAM_HEADLINE = 'Team Brawl';

function winnerNames(winnerIds: readonly string[]): string {
  return winnerIds.map(nameOf).join(' & ');
}

function winnersPhrase(winnerIds: readonly string[]): string {
  return winnerIds.length === 1 ? `${winnerNames(winnerIds)} wins!` : `${winnerNames(winnerIds)} win!`;
}

/**
 * A Brawl or Party fight between fighterIds; winnerIds is the winning side (empty for a draw) and party marks a
 * free-for-all. A one-on-one without bosses also shares a rematch link, since links never open bosses.
 */
export function brawlCard(fighterIds: readonly string[], winnerIds: readonly string[], party: boolean): ShareCard {
  const duel = fighterIds.length === 2 && !party;
  const linkable = duel && !fighterIds.some((id) => fighterById(id).boss);
  const names = fighterIds.map(nameOf).join(', ');
  const won = winnerIds.length > 0;
  const headline = duel ? `${nameOf(fighterIds[0])} vs ${nameOf(fighterIds[1])}` : party ? PARTY_HEADLINE : TEAM_HEADLINE;
  return {
    headline,
    subtitle: won ? winnersPhrase(winnerIds) : 'It ended in a draw.',
    fighters: [...fighterIds],
    winnerIds: [...winnerIds],
    text: won
      ? `${winnerNames(winnerIds)} won a ${GAME_NAME} match with ${names}. Your turn.`
      : `A ${GAME_NAME} match with ${names} ended in a draw. Your turn.`,
    target: linkable ? { kind: ShareKind.Duel, left: fighterIds[0], right: fighterIds[1] } : null,
  };
}

/** The end of a Story run in a league, with its rank. */
export function storyCard(category: Category, fighterId: string, won: boolean, rank: string): ShareCard {
  const me = nameOf(fighterId);
  const league = CATEGORY_LABEL[category];
  return {
    headline: won ? 'I saved the world!' : 'So close...',
    subtitle: `${me} - ${league} league - Rank ${rank}`,
    fighters: [fighterId],
    winnerIds: won ? [fighterId] : [],
    text: won
      ? `${me} beat the whole ${league} ladder in ${GAME_NAME} with rank ${rank}. Beat that.`
      : `${me} fell short in the ${league} league of ${GAME_NAME}. Can you finish it?`,
    target: null,
  };
}
