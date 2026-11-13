/**
 * Face pipeline I/O shell: downloads each source photo from Wikimedia Commons, rejects non-free licences, crops the head,
 * feathers it into an oval and writes one WebP per fighter plus the credits file.
 * Downloads are cached and requests are paced so Wikimedia rate limits are respected.
 * Run `node scripts/faces/fetchFaces.ts --detect` first on macOS to fill missing crops with the Vision face detector.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  creditEntry, cropFromFaceBox, cropRect, isAllowedLicense, toHex, type CommonsMeta, type Crop, type CreditEntry,
  type FaceBox,
} from './faceRules.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const SOURCES_PATH = join(ROOT, 'scripts', 'faces', 'faceSources.json');
const CACHE_DIR = join(ROOT, 'scripts', 'faces', 'cache');
const OUTPUT_DIR = join(ROOT, 'public', 'faces');
const CREDITS_PATH = join(ROOT, 'src', 'roster', 'credits.json');
const DETECTOR = join(ROOT, 'scripts', 'faces', 'detectFaces.swift');
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'face-fetch-script/0.1';
const DOWNLOAD_WIDTH = 1200;
const FACE_SIZE = 320;
const WEBP_QUALITY = 82;
const REQUEST_GAP_MS = 1500;
const RETRY_BACKOFF_MS = 10000;
const MAX_ATTEMPTS = 6;
const HTTP_TOO_MANY_REQUESTS = 429;
/** Fraction of the face texture (centred) averaged for the skin tone. */
const TONE_SAMPLE_FRACTION = 0.3;
/** Vertical offset of the tone sample below the centre (cheeks rather than eyes), fraction of the side. */
const TONE_SAMPLE_DROP = 0.08;
/** Some Commons JPEGs carry harmless encoder quirks; decode them leniently. */
const SOURCE_READ = { failOn: 'none' } as const;
const OVAL_MASK = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${FACE_SIZE}" height="${FACE_SIZE}">` +
    '<defs><radialGradient id="g" cx="50%" cy="50%" r="50%">' +
    '<stop offset="86%" stop-color="#fff" stop-opacity="1"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/>' +
    '</radialGradient></defs><ellipse cx="50%" cy="50%" rx="49%" ry="50%" fill="url(#g)"/></svg>',
);

class FacePipelineError extends Error {}

interface FaceSource {
  id: string;
  file: string;
  crop: Crop | null;
}

interface ImageInfo {
  meta: CommonsMeta;
  downloadUrl: string;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url: string): Promise<Response> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    await sleep(REQUEST_GAP_MS);
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (response.ok) return response;
    if (response.status !== HTTP_TOO_MANY_REQUESTS) throw new FacePipelineError(`${response.status} for ${url}`);
    await sleep(RETRY_BACKOFF_MS * attempt);
  }
  throw new FacePipelineError(`Rate limited: ${url}`);
}

async function imageInfo(file: string): Promise<ImageInfo> {
  const params = new URLSearchParams({
    action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url|extmetadata',
    iiurlwidth: String(DOWNLOAD_WIDTH), format: 'json',
  });
  const body = (await (await request(`${COMMONS_API}?${params}`)).json()) as {
    query: { pages: Record<string, { imageinfo?: Array<{ thumburl?: string; url: string; descriptionurl: string; extmetadata: Record<string, { value: string }> }> }> };
  };
  const info = Object.values(body.query.pages)[0]?.imageinfo?.[0];
  if (!info) throw new FacePipelineError(`No Commons file named ${file}`);
  const m = info.extmetadata;
  return {
    downloadUrl: info.thumburl ?? info.url,
    meta: {
      license: m.LicenseShortName?.value ?? '',
      licenseUrl: m.LicenseUrl?.value ?? '',
      artist: m.Artist?.value ?? '',
      pageUrl: info.descriptionurl,
    },
  };
}

async function cachedImage(source: FaceSource, info: ImageInfo): Promise<string> {
  const path = join(CACHE_DIR, `${source.id}.img`);
  if (!existsSync(path)) writeFileSync(path, Buffer.from(await (await request(info.downloadUrl)).arrayBuffer()));
  return path;
}

async function skinTone(face: Buffer): Promise<string> {
  const side = Math.round(FACE_SIZE * TONE_SAMPLE_FRACTION);
  const left = Math.round((FACE_SIZE - side) / 2);
  const top = Math.round((FACE_SIZE - side) / 2 + FACE_SIZE * TONE_SAMPLE_DROP);
  const stats = await sharp(face).extract({ left, top, width: side, height: side }).stats();
  const [r, g, b] = stats.channels;
  return toHex(r.mean, g.mean, b.mean);
}

async function renderFace(source: FaceSource, imagePath: string): Promise<string> {
  if (!source.crop) throw new FacePipelineError(`${source.id} has no crop; run with --detect first`);
  const { width = 0, height = 0 } = await sharp(imagePath, SOURCE_READ).metadata();
  const rect = cropRect(source.crop, width, height);
  const face = await sharp(imagePath, SOURCE_READ)
    .extract({ left: rect.left, top: rect.top, width: rect.side, height: rect.side })
    .resize(FACE_SIZE, FACE_SIZE)
    .removeAlpha()
    .toBuffer();
  const tone = await skinTone(face);
  await sharp(face).ensureAlpha().composite([{ input: OVAL_MASK, blend: 'dest-in' }])
    .webp({ quality: WEBP_QUALITY }).toFile(join(OUTPUT_DIR, `${source.id}.webp`));
  return tone;
}

async function detectCrops(sources: FaceSource[], paths: Map<string, string>): Promise<void> {
  const missing = sources.filter((s) => !s.crop);
  if (missing.length === 0) return;
  const output = execFileSync('swift', [DETECTOR, ...missing.map((s) => paths.get(s.id) ?? '')], { encoding: 'utf8' });
  const boxes = output.trim().split('\n').map((line) => JSON.parse(line) as { box: FaceBox | null });
  for (const [i, source] of missing.entries()) {
    const box = boxes[i]?.box;
    if (!box) {
      console.warn(`no face found for ${source.id}; set its crop in faceSources.json by hand`);
      continue;
    }
    const { width = 0, height = 0 } = await sharp(paths.get(source.id) ?? '').metadata();
    source.crop = cropFromFaceBox(box, width, height);
  }
  writeFileSync(SOURCES_PATH, `${JSON.stringify({ sources }, null, 2)}\n`);
}

async function main(): Promise<void> {
  const detect = process.argv.includes('--detect');
  const sources = (JSON.parse(readFileSync(SOURCES_PATH, 'utf8')) as { sources: FaceSource[] }).sources;
  mkdirSync(CACHE_DIR, { recursive: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const infos = new Map<string, ImageInfo>();
  const paths = new Map<string, string>();
  for (const source of sources) {
    const info = await imageInfo(source.file);
    if (!isAllowedLicense(info.meta.license)) throw new FacePipelineError(`${source.id}: licence "${info.meta.license}" is not free`);
    infos.set(source.id, info);
    paths.set(source.id, await cachedImage(source, info));
    console.log(`fetched ${source.id} (${info.meta.license})`);
  }
  if (detect) await detectCrops(sources, paths);
  const credits: CreditEntry[] = [];
  for (const source of sources) {
    const tone = await renderFace(source, paths.get(source.id) ?? '');
    const info = infos.get(source.id);
    if (info) credits.push(creditEntry(source.id, source.file, info.meta, tone));
  }
  writeFileSync(CREDITS_PATH, `${JSON.stringify({ credits }, null, 2)}\n`);
  console.log(`wrote ${credits.length} faces`);
}

await main();
