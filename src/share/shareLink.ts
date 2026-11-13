/**
 * Share links as pure data: a link opens one rivalry's side picker, a one-on-one Brawl, or an online room to join.
 * shareUrl writes the target into a query string on the game's address, and parseShareTarget reads it back.
 * Parsing accepts only known rivalries, two different non-boss fighters and valid room codes; anything else opens the title.
 */
import { RIVALRIES } from '../rivalry/rivalries';
import { normalizeRoomCode } from '../net/roomCode';
import { ROSTER } from '../roster/roster';

export enum ShareKind {
  Rivalry = 'rivalry',
  Duel = 'duel',
  Join = 'join',
}

/** What a shared link opens: a rivalry by id, or a duel of two fighter ids (left is Player 1). */
export type ShareTarget =
  | { kind: ShareKind.Rivalry; rivalryId: string }
  | { kind: ShareKind.Duel; left: string; right: string }
  | { kind: ShareKind.Join; code: string };

/** Query parameter names and the separator between the two duel fighters. */
export const RIVALRY_PARAM = 'rivalry';
export const DUEL_PARAM = 'duel';
export const DUEL_SEPARATOR = '~';
export const JOIN_PARAM = 'join';

function isRivalry(id: string): boolean {
  return RIVALRIES.some((r) => r.id === id);
}

function isDuelFighter(id: string): boolean {
  return ROSTER.some((f) => f.id === id && !f.boss);
}

/** The address that opens target, built on base (the game's origin and path, without a query). */
export function shareUrl(base: string, target: Readonly<ShareTarget>): string {
  const [name, value] = target.kind === ShareKind.Rivalry
    ? [RIVALRY_PARAM, target.rivalryId]
    : target.kind === ShareKind.Join
      ? [JOIN_PARAM, target.code]
      : [DUEL_PARAM, `${target.left}${DUEL_SEPARATOR}${target.right}`];
  return `${base}?${name}=${encodeURIComponent(value)}`;
}

/** Reads a share target from a query string such as location.search; null when there is none or it is invalid. */
export function parseShareTarget(search: string): ShareTarget | null {
  const params = new URLSearchParams(search);
  const rivalryId = params.get(RIVALRY_PARAM);
  if (rivalryId !== null) return isRivalry(rivalryId) ? { kind: ShareKind.Rivalry, rivalryId } : null;
  const join = params.get(JOIN_PARAM);
  if (join !== null) {
    const code = normalizeRoomCode(join);
    return code ? { kind: ShareKind.Join, code } : null;
  }
  const duel = params.get(DUEL_PARAM);
  if (duel === null) return null;
  const parts = duel.split(DUEL_SEPARATOR);
  if (parts.length !== 2) return null;
  const [left, right] = parts;
  if (left === right || !isDuelFighter(left) || !isDuelFighter(right)) return null;
  return { kind: ShareKind.Duel, left, right };
}
