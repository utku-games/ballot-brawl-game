/**
 * Face pipeline entry point: checks every source photo's licence on Wikimedia Commons, downloads it once, and renders
 * one sticker-style WebP per fighter plus src/roster/credits.json with author, licence, tone and landmarks.
 * With --analyze (macOS only) it first runs the Vision helper to lift subjects, find faces and store crops and landmarks.
 * Non-free licences stop the run, so nothing unlicensed can reach the game.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { downloadOnce, imageInfo, type ImageInfo } from './commonsClient.ts';
import { analyzePhotos, maskPath } from './faceAnalysis.ts';
import { renderFace, type ImageLandmarks } from './faceRender.ts';
import { creditEntry, cropFromFaceBox, isAllowedLicense, type Crop, type CreditEntry } from './faceRules.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const SOURCES_PATH = join(ROOT, 'scripts', 'faces', 'faceSources.json');
const CACHE_DIR = join(ROOT, 'scripts', 'faces', 'cache');
const ANALYSIS_DIR = join(CACHE_DIR, 'analysis');
const OUTPUT_DIR = join(ROOT, 'public', 'faces');
const CREDITS_PATH = join(ROOT, 'src', 'roster', 'credits.json');
const SOURCE_READ = { failOn: 'none' } as const;

class FaceLicenseError extends Error {}

interface FaceSource {
  id: string;
  file: string;
  /** Hand-set crops are kept by --analyze; detected ones are replaced. */
  manual?: boolean;
  crop: Crop | null;
  landmarks: ImageLandmarks | null;
}

async function analyze(sources: FaceSource[], paths: Map<string, string>): Promise<void> {
  const list = sources.map((s) => paths.get(s.id) ?? '');
  const results = analyzePhotos(ANALYSIS_DIR, list);
  for (const [i, source] of sources.entries()) {
    const r = results[i];
    if (source.manual || !r?.box) {
      if (!source.crop) console.warn(`no face found for ${source.id}; set a manual crop in faceSources.json`);
      continue;
    }
    const { width = 0, height = 0 } = await sharp(list[i], SOURCE_READ).metadata();
    source.crop = cropFromFaceBox(r.box, width, height);
    source.landmarks = r.eyeA && r.eyeB && r.mouth && r.mouthWidth
      ? { eyeA: r.eyeA, eyeB: r.eyeB, mouth: r.mouth, mouthWidth: r.mouthWidth, jaw: r.jaw ?? [] }
      : null;
  }
  writeFileSync(SOURCES_PATH, `${JSON.stringify({ sources }, null, 2)}\n`);
}

async function main(): Promise<void> {
  const sources = (JSON.parse(readFileSync(SOURCES_PATH, 'utf8')) as { sources: FaceSource[] }).sources;
  mkdirSync(ANALYSIS_DIR, { recursive: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const infos = new Map<string, ImageInfo>();
  const paths = new Map<string, string>();
  for (const source of sources) {
    const info = await imageInfo(source.file);
    if (!isAllowedLicense(info.meta.license)) throw new FaceLicenseError(`${source.id}: licence "${info.meta.license}" is not free`);
    const path = join(CACHE_DIR, `${source.id}.img`);
    await downloadOnce(info.downloadUrl, path);
    infos.set(source.id, info);
    paths.set(source.id, path);
  }
  if (process.argv.includes('--analyze')) await analyze(sources, paths);
  const credits: CreditEntry[] = [];
  for (const source of sources) {
    if (!source.crop) throw new FaceLicenseError(`${source.id} has no crop`);
    const mask = maskPath(ANALYSIS_DIR, source.id);
    const out = join(OUTPUT_DIR, `${source.id}.webp`);
    const result = await renderFace(paths.get(source.id) ?? '', existsSync(mask) ? mask : null, source.crop, source.landmarks, out);
    const info = infos.get(source.id);
    if (info) credits.push(creditEntry(source.id, source.file, info.meta, result.tone, result.landmarks, result.silhouette));
  }
  writeFileSync(CREDITS_PATH, `${JSON.stringify({ credits }, null, 2)}\n`);
  console.log(`wrote ${credits.length} faces`);
}

await main();
