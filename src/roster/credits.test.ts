/**
 * Tests that every roster fighter has exactly one face credit with a free licence, an author and a source link.
 * The licence check reuses the face pipeline's allowlist so the data can never drift from the rules.
 * The matching image file is checked by scripts/faces/faceAssets.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { isAllowedLicense } from '../../scripts/faces/faceRules.ts';
import { creditFor, FACE_CREDITS, isPlausibleSkin, toneOf } from './credits';
import { ROSTER } from './roster';

describe('face credits', () => {
  it('covers every fighter exactly once', () => {
    expect(new Set(FACE_CREDITS.map((c) => c.id))).toEqual(new Set(ROSTER.map((f) => f.id)));
    expect(FACE_CREDITS).toHaveLength(ROSTER.length);
  });

  it('only uses free licences and names the source', () => {
    for (const c of FACE_CREDITS) {
      expect(isAllowedLicense(c.license), `${c.id}: ${c.license}`).toBe(true);
      expect(c.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(c.author.length).toBeGreaterThan(0);
    }
  });

  it('exposes a skin tone per fighter', () => {
    expect(creditFor('napoleon-bonaparte').tone).toMatch(/^#[0-9a-f]{6}$/);
    expect(toneOf('napoleon-bonaparte')).toBeGreaterThan(0);
  });

  it('rejects tones tinted by stage lighting', () => {
    expect(isPlausibleSkin(0xc89a80)).toBe(true);
    expect(isPlausibleSkin(0xe0ddd8)).toBe(true);
    expect(isPlausibleSkin(0x5a70c0)).toBe(false);
    expect(isPlausibleSkin(0x40c060)).toBe(false);
    for (const c of FACE_CREDITS) expect(isPlausibleSkin(toneOf(c.id)), c.id).toBe(true);
  });

  it('gives every face a 48-row silhouette with a solid centre', () => {
    for (const c of FACE_CREDITS) {
      expect(c.silhouette, c.id).toHaveLength(48);
      for (const row of c.silhouette) expect(row, c.id).toMatch(/^[0-9a-f]{12}$/);
      expect(c.silhouette[24]?.slice(5, 7), c.id).toBe('ff');
    }
  });
});
