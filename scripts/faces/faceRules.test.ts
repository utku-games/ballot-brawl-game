/**
 * Tests for the face pipeline rules: licence filtering, head crops and credit entries.
 * Crops must stay inside the image even for faces near an edge.
 * Credits must carry plain-text authors and the licence exactly as Commons reports it.
 */
import { describe, expect, it } from 'vitest';
import { creditEntry, cropFromFaceBox, cropRect, isAllowedLicense, stripHtml, toHex } from './faceRules.ts';

describe('isAllowedLicense', () => {
  it('accepts public domain and free licences', () => {
    for (const name of ['Public domain', 'CC BY-SA 4.0', 'CC BY 2.0', 'CC0', 'OGL 3', 'CC BY 3.0 it', 'Attribution']) {
      expect(isAllowedLicense(name)).toBe(true);
    }
  });

  it('rejects non-free and unknown licences', () => {
    for (const name of ['CC BY-NC 2.0', 'CC BY-ND 4.0', 'CC BY 4.0 ND', 'PD-NC', 'Fair use', 'All rights reserved', '']) {
      expect(isAllowedLicense(name)).toBe(false);
    }
  });
});

describe('crops', () => {
  it('centres a head crop above the face box and keeps it square', () => {
    const crop = cropFromFaceBox({ x: 0.4, y: 0.3, w: 0.2, h: 0.15 }, 1000, 1200);
    expect(crop.cx).toBeCloseTo(0.5);
    expect(crop.cy).toBeLessThan(0.375);
    const rect = cropRect(crop, 1000, 1200);
    expect(rect.side).toBeGreaterThan(200);
  });

  it('keeps the rectangle inside the image', () => {
    const rect = cropRect({ cx: 0.98, cy: 0.01, size: 0.5 }, 800, 600);
    expect(rect.left + rect.side).toBeLessThanOrEqual(800);
    expect(rect.top).toBe(0);
    expect(cropRect({ cx: 0.5, cy: 0.5, size: 3 }, 800, 600).side).toBe(600);
  });
});

describe('credits', () => {
  it('strips HTML from the author and keeps the licence', () => {
    const entry = creditEntry('a', 'A.jpg', {
      license: 'CC BY 2.0 ', licenseUrl: 'https://example.org/l', artist: '<a href="x">Jane &amp; Co</a>', pageUrl: 'https://example.org/p',
    }, toHex(255, 128, 0));
    expect(entry.author).toBe('Jane & Co');
    expect(entry.license).toBe('CC BY 2.0');
    expect(entry.tone).toBe('#ff8000');
    expect(stripHtml('')).toBe('');
  });
});
