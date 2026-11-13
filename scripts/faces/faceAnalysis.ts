/**
 * Runs the macOS Vision helper (analyzeFaces.swift) over cached photos and parses its JSON lines.
 * Each result carries the face box, eye and mouth positions in source-image fractions, and whether a subject mask was written.
 * Analysis is optional: without macOS the stored crops and landmarks in faceSources.json are reused as they are.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import type { FaceBox, TexturePoint } from './faceRules.ts';

export interface PhotoAnalysis {
  box: FaceBox | null;
  eyeA: TexturePoint | null;
  eyeB: TexturePoint | null;
  mouth: TexturePoint | null;
  mouthWidth: number | null;
  jaw: TexturePoint[] | null;
  mask: boolean;
}

const HELPER = join(import.meta.dirname, 'analyzeFaces.swift');
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024;

export function maskPath(analysisDir: string, id: string): string {
  return join(analysisDir, `${id}.mask.png`);
}

/** Analyses every image path; returns results in the same order. */
export function analyzePhotos(analysisDir: string, paths: readonly string[]): PhotoAnalysis[] {
  const output = execFileSync('swift', [HELPER, analysisDir, ...paths], { encoding: 'utf8', maxBuffer: MAX_OUTPUT_BYTES });
  return output.trim().split('\n').filter((line) => line.startsWith('{')).map((line) => {
    const raw = JSON.parse(line) as Partial<PhotoAnalysis>;
    return {
      box: raw.box ?? null,
      eyeA: raw.eyeA ?? null,
      eyeB: raw.eyeB ?? null,
      mouth: raw.mouth ?? null,
      mouthWidth: raw.mouthWidth ?? null,
      jaw: raw.jaw ?? null,
      mask: raw.mask === true,
    };
  });
}
