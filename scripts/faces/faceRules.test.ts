/**
 * Tests for the face pipeline rules: licence filtering, head crops and credit entries.
 * Crops must stay inside the image even for faces near an edge.
 * Credits must carry plain-text authors and the licence exactly as Commons reports it.
 */
import { describe, expect, it } from 'vitest';
import {
  alphaBounds, chinY, creditEntry, inHeadRegion, JAW_SIDE_PAD, paddedJaw, silhouetteRows, cropFromFaceBox, cropRect, DEFAULT_LANDMARKS, HEAD_FILL, headShape, isAllowedLicense,
  NECK_FADE, refitRect, stripHtml, toHex, toTexture,
} from './faceRules.ts';

describe('isAllowedLicense', () => {
  it('accepts public domain and free licences', () => {
    for (const name of ['Public domain', 'CC BY-SA 4.0', 'CC BY 2.0', 'CC0', 'OGL 3', 'OGL v1.0', 'CC BY 3.0 it', 'Attribution']) {
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
    }, toHex(255, 128, 0), DEFAULT_LANDMARKS, ['f0']);
    expect(entry.author).toBe('Jane & Co');
    expect(entry.license).toBe('CC BY 2.0');
    expect(entry.tone).toBe('#ff8000');
    expect(stripHtml('')).toBe('');
  });
});

describe('sticker shaping', () => {
  it('keeps the head centre, fades below the chin and outside the oval', () => {
    const chin = 0.8;
    expect(headShape(0.5, 0.45, chin)).toBe(1);
    expect(headShape(0.5, chin + NECK_FADE + 0.01, chin)).toBe(0);
    expect(headShape(0.01, 0.01, chin)).toBe(0);
  });

  it('finds solid bounds and refits the crop around them', () => {
    const size = 10;
    const alpha = new Uint8Array(size * size);
    for (let y = 2; y < 6; y += 1) for (let x = 3; x < 7; x += 1) alpha[y * size + x] = 255;
    const bounds = alphaBounds(alpha, size);
    expect(bounds).toEqual({ minX: 3, minY: 2, maxX: 6, maxY: 5 });
    const rect = refitRect({ left: 0, top: 0, side: 100 }, bounds!, size);
    expect(rect.side).toBe(Math.round(40 / HEAD_FILL));
    expect(alphaBounds(new Uint8Array(size * size), size)).toBeNull();
  });

  it('maps image points into texture space and places the chin below the mouth', () => {
    const p = toTexture({ x: 0.5, y: 0.5 }, { left: 40, top: 40, side: 20 }, 100, 100);
    expect(p).toEqual({ x: 0.5, y: 0.5 });
    expect(chinY(DEFAULT_LANDMARKS)).toBeGreaterThan(DEFAULT_LANDMARKS.mouth.y);
  });
});

describe('inHeadRegion', () => {
  const jaw = [
    { x: 0.2, y: 0.4 }, { x: 0.25, y: 0.62 }, { x: 0.35, y: 0.76 }, { x: 0.5, y: 0.82 },
    { x: 0.65, y: 0.76 }, { x: 0.75, y: 0.62 }, { x: 0.8, y: 0.4 },
  ];

  it('keeps the face and everything above the jawline', () => {
    expect(inHeadRegion(0.5, 0.6, jaw, 0.9)).toBe(true);
    expect(inHeadRegion(0.05, 0.2, jaw, 0.9)).toBe(true);
  });

  it('removes the neck below the chin and shoulders beside the jaw', () => {
    expect(inHeadRegion(0.5, 0.9, jaw, 0.9)).toBe(false);
    expect(inHeadRegion(0.1, 0.6, jaw, 0.9)).toBe(false);
    expect(inHeadRegion(0.9, 0.7, jaw, 0.9)).toBe(false);
  });

  it('leaves no seam between the hair region and the face outline', () => {
    for (let u = 0.25; u <= 0.75; u += 0.01) expect(inHeadRegion(u, 0.41, jaw, 0.9)).toBe(true);
  });

  it('pads the jawline outward and falls back to the chin without one', () => {
    const padded = paddedJaw(jaw);
    expect(padded[3].y).toBeCloseTo(0.82 + JAW_SIDE_PAD, 2);
    expect(inHeadRegion(0.5, 0.7, [], 0.77)).toBe(true);
    expect(inHeadRegion(0.5, 0.8, [], 0.77)).toBe(false);
  });
});

describe('silhouetteRows', () => {
  it('marks cells that contain solid pixels, row by row in hex', () => {
    const size = 8;
    const alpha = new Uint8Array(size * size);
    alpha[0] = 255;
    alpha[7 * size + 7] = 255;
    const rows = silhouetteRows(alpha, size, 8);
    expect(rows).toHaveLength(8);
    expect(rows[0]).toBe('80');
    expect(rows[7]).toBe('01');
    expect(rows[3]).toBe('00');
  });
});
