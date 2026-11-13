/**
 * Tests for share links: round trips for rivalry and duel links, and rejection of invalid links.
 * Invalid links cover unknown rivalries, unknown or repeated fighters, bosses and malformed duel values.
 * A rivalry parameter takes precedence when both parameters are present.
 */
import { describe, expect, it } from 'vitest';
import { parseShareTarget, shareUrl, ShareKind } from './shareLink';

const BASE = 'https://example.test/';

function queryOf(url: string): string {
  return new URL(url).search;
}

describe('share links', () => {
  it('round-trips a rivalry link', () => {
    const url = shareUrl(BASE, { kind: ShareKind.Rivalry, rivalryId: 'currents' });
    expect(url).toBe('https://example.test/?rivalry=currents');
    expect(parseShareTarget(queryOf(url))).toEqual({ kind: ShareKind.Rivalry, rivalryId: 'currents' });
  });

  it('round-trips a duel link', () => {
    const url = shareUrl(BASE, { kind: ShareKind.Duel, left: 'nikola-tesla', right: 'goat' });
    expect(url).toBe('https://example.test/?duel=nikola-tesla~goat');
    expect(parseShareTarget(queryOf(url))).toEqual({ kind: ShareKind.Duel, left: 'nikola-tesla', right: 'goat' });
  });

  it('returns null without a share parameter', () => {
    expect(parseShareTarget('')).toBeNull();
    expect(parseShareTarget('?foo=bar')).toBeNull();
  });

  it('rejects unknown rivalries', () => {
    expect(parseShareTarget('?rivalry=nope')).toBeNull();
  });

  it('rejects invalid duels', () => {
    expect(parseShareTarget('?duel=goat~goat')).toBeNull();
    expect(parseShareTarget('?duel=goat~nobody')).toBeNull();
    expect(parseShareTarget('?duel=goat')).toBeNull();
    expect(parseShareTarget('?duel=goat~pig~camel')).toBeNull();
    expect(parseShareTarget('?duel=goat~winston-churchill')).toBeNull();
  });

  it('round-trips a join link and rejects bad codes', () => {
    const url = shareUrl(BASE, { kind: ShareKind.Join, code: 'ABC23' });
    expect(url).toBe('https://example.test/?join=ABC23');
    expect(parseShareTarget(queryOf(url))).toEqual({ kind: ShareKind.Join, code: 'ABC23' });
    expect(parseShareTarget('?join=abc23')).toEqual({ kind: ShareKind.Join, code: 'ABC23' });
    expect(parseShareTarget('?join=AB0')).toBeNull();
  });

  it('prefers the rivalry parameter', () => {
    expect(parseShareTarget('?rivalry=currents&duel=goat~pig')).toEqual({ kind: ShareKind.Rivalry, rivalryId: 'currents' });
  });
});
