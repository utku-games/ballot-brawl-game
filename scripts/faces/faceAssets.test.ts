/**
 * Checks the generated face assets on disk: one small WebP per credit entry and one crop per source.
 * It fails when the pipeline was not re-run after the roster or the sources changed.
 * Image size is capped so the whole roster stays light enough for phones.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', '..');
const MAX_FACE_BYTES = 40 * 1024;

interface Sources { sources: Array<{ id: string; crop: unknown }> }
interface Credits { credits: Array<{ id: string }> }

const sources = (JSON.parse(readFileSync(join(ROOT, 'scripts', 'faces', 'faceSources.json'), 'utf8')) as Sources).sources;
const credits = (JSON.parse(readFileSync(join(ROOT, 'src', 'roster', 'credits.json'), 'utf8')) as Credits).credits;

describe('face assets', () => {
  it('has a crop for every source and a credit for every source', () => {
    expect(sources.every((s) => s.crop !== null)).toBe(true);
    expect(credits.map((c) => c.id).sort()).toEqual(sources.map((s) => s.id).sort());
  });

  it('has a small WebP for every credit', () => {
    for (const c of credits) {
      const path = join(ROOT, 'public', 'faces', `${c.id}.webp`);
      expect(existsSync(path), path).toBe(true);
      expect(statSync(path).size).toBeLessThan(MAX_FACE_BYTES);
    }
  });
});
