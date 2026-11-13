/**
 * Pure rules of the face pipeline: which licences are acceptable, how a detected face box becomes a square head crop,
 * and how Commons metadata becomes a credits entry.
 * Keeping these pure lets the download script stay a thin I/O shell and lets the rules be unit tested.
 * Crops are stored as fractions of the image so they survive a change of download resolution.
 */

/** Licence short names (as reported by the Wikimedia Commons API) that allow modification and redistribution. */
export const ALLOWED_LICENSES: readonly RegExp[] = [
  /^public domain$/i,
  /^pd\b/i,
  /^cc0/i,
  /^cc by(-sa)? \d/i,
  /^ogl \d/i,
  /^attribution$/i,
];

/** Head crop around a face box: side as a multiple of the box, and how far the centre moves up (fraction of side). */
export const HEAD_CROP_SCALE = 2.1;
export const HEAD_CROP_LIFT = 0.12;

export interface FaceBox {
  /** Normalised 0..1, origin at the top-left corner of the image. */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Square crop in normalised units: centre as fractions of width and height, side as a fraction of the width. */
export interface Crop {
  cx: number;
  cy: number;
  size: number;
}

export interface PixelRect {
  left: number;
  top: number;
  side: number;
}

export interface CommonsMeta {
  license: string;
  licenseUrl: string;
  artist: string;
  pageUrl: string;
}

export interface TexturePoint {
  x: number;
  y: number;
}

/** Eye and mouth positions in face-texture coordinates (0..1, origin top left), used to animate expressions. */
export interface FaceLandmarks {
  eyeA: TexturePoint;
  eyeB: TexturePoint;
  mouth: TexturePoint;
  mouthWidth: number;
  /** Face outline from temple to temple along the jaw; empty when detection failed. */
  jaw: TexturePoint[];
}

/** Landmarks used when detection fails (paintings drawn in profile, sketches). */
export const DEFAULT_LANDMARKS: Readonly<FaceLandmarks> = {
  eyeA: { x: 0.4, y: 0.45 }, eyeB: { x: 0.6, y: 0.45 }, mouth: { x: 0.5, y: 0.66 }, mouthWidth: 0.16, jaw: [],
};

/** How far below the mouth the chin sits, as a multiple of the eye-to-mouth distance. */
export const CHIN_DROP = 1.0;
/** Fade length (texture units) below the chin and at the oval's edge. */
export const NECK_FADE = 0.025;
/** How far below the detected jawline the cut starts, so the chin itself is never clipped. */
export const JAW_MARGIN = 0.012;
/** Where the side cut levels off between the mouth (0) and the bottom of the chin (1). */
export const SIDE_LEVEL = 0.3;
/** Jawline points needed before the jaw cut replaces the estimated chin. */
const MIN_JAW_POINTS = 3;
export const OVAL_FEATHER = 0.06;
/** Head oval: centre and radii in texture units. */
export const OVAL_CENTER_Y = 0.47;
export const OVAL_RADIUS_X = 0.47;
export const OVAL_RADIUS_Y = 0.52;

export interface CreditEntry {
  id: string;
  file: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
  changes: string;
  /** Average skin tone of the cropped face, used to colour the hands and neck. */
  tone: string;
  landmarks: FaceLandmarks;
}

/** Description of the edits applied to every source photo. */
export const CHANGES_NOTE = 'Background removed, cropped to the head, resized and given a white outline.';

/** Licence terms that forbid commercial use or modification; any match is rejected. */
const FORBIDDEN_TERMS = /\b(nc|nd)\b/i;

export function isAllowedLicense(shortName: string): boolean {
  const name = shortName.trim();
  if (FORBIDDEN_TERMS.test(name)) return false;
  return ALLOWED_LICENSES.some((rule) => rule.test(name));
}

export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Head crop for a detected face box in an image of the given pixel size. */
export function cropFromFaceBox(box: Readonly<FaceBox>, width: number, height: number): Crop {
  const sidePx = Math.max(box.w * width, box.h * height) * HEAD_CROP_SCALE;
  const cxPx = (box.x + box.w / 2) * width;
  const cyPx = (box.y + box.h / 2) * height - sidePx * HEAD_CROP_LIFT;
  return { cx: cxPx / width, cy: cyPx / height, size: sidePx / width };
}

/** Integer pixel rectangle for a crop, shrunk and shifted so it always lies inside the image. */
export function cropRect(crop: Readonly<Crop>, width: number, height: number): PixelRect {
  const side = Math.max(1, Math.min(Math.round(crop.size * width), width, height));
  const left = Math.min(width - side, Math.max(0, Math.round(crop.cx * width - side / 2)));
  const top = Math.min(height - side, Math.max(0, Math.round(crop.cy * height - side / 2)));
  return { left, top, side };
}

export function toHex(r: number, g: number, b: number): string {
  const part = (v: number): string => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Converts a point in source-image fractions to face-texture coordinates for a crop rectangle. */
export function toTexture(p: Readonly<TexturePoint>, rect: Readonly<PixelRect>, width: number, height: number): TexturePoint {
  return { x: (p.x * width - rect.left) / rect.side, y: (p.y * height - rect.top) / rect.side };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Cut line at column u: under the chin it follows the jawline's lower envelope, and toward the sides it levels off
 * a little below the mouth, so the neck and collar go while the line stays continuous with no notches.
 * Without a detected jawline the estimated chin is used as a straight cut.
 */
export function jawCut(u: number, jaw: readonly TexturePoint[], fallbackChin: number, mouthY: number): number {
  if (jaw.length < MIN_JAW_POINTS) return fallbackChin;
  const bottom = Math.max(...jaw.map((p) => p.y));
  const sideLevel = mouthY + (bottom - mouthY) * SIDE_LEVEL;
  let envelope = -Infinity;
  for (let i = 1; i < jaw.length; i += 1) {
    const a = jaw[i - 1];
    const b = jaw[i];
    if (u < Math.min(a.x, b.x) || u > Math.max(a.x, b.x)) continue;
    const t = b.x === a.x ? 1 : (u - a.x) / (b.x - a.x);
    envelope = Math.max(envelope, a.y + (b.y - a.y) * t);
  }
  return Math.max(envelope, sideLevel) + JAW_MARGIN;
}

/** Shape multiplier for the cut-out at texture point (u, v): a soft head oval that also fades out below the cut line. */
export function headShape(u: number, v: number, chinY: number): number {
  const dx = (u - 0.5) / OVAL_RADIUS_X;
  const dy = (v - OVAL_CENTER_Y) / OVAL_RADIUS_Y;
  const r = Math.hypot(dx, dy);
  const oval = 1 - smoothstep(1 - OVAL_FEATHER, 1, r);
  const neck = 1 - smoothstep(chinY, chinY + NECK_FADE, v);
  return oval * neck;
}

/** Fraction of the texture the cut-out head should span after refitting. */
export const HEAD_FILL = 0.94;
/** Alpha (0..255) above which a pixel counts as part of the head when measuring its extent. */
export const SOLID_ALPHA = 128;

export interface AlphaBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Bounds (in pixels) of the solid part of a square alpha buffer, or null when nothing is solid. */
export function alphaBounds(alpha: Uint8Array, size: number): AlphaBounds | null {
  let minX = size;
  let minY = size;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (alpha[y * size + x] < SOLID_ALPHA) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

/** A tighter pixel rectangle so the head inside `rect` fills HEAD_FILL of the texture, centred. */
export function refitRect(rect: Readonly<PixelRect>, bounds: Readonly<AlphaBounds>, size: number): PixelRect {
  const scale = rect.side / size;
  const w = (bounds.maxX - bounds.minX + 1) * scale;
  const h = (bounds.maxY - bounds.minY + 1) * scale;
  const side = Math.max(w, h) / HEAD_FILL;
  const cx = rect.left + ((bounds.minX + bounds.maxX + 1) / 2) * scale;
  const cy = rect.top + ((bounds.minY + bounds.maxY + 1) / 2) * scale;
  return { left: Math.round(cx - side / 2), top: Math.round(cy - side / 2), side: Math.round(side) };
}

export function chinY(landmarks: Readonly<FaceLandmarks>): number {
  const eyeY = (landmarks.eyeA.y + landmarks.eyeB.y) / 2;
  return landmarks.mouth.y + (landmarks.mouth.y - eyeY) * CHIN_DROP;
}

export function creditEntry(id: string, file: string, meta: Readonly<CommonsMeta>, tone: string, landmarks: Readonly<FaceLandmarks>): CreditEntry {
  return {
    id,
    file,
    sourceUrl: meta.pageUrl,
    author: stripHtml(meta.artist) || 'Unknown',
    license: meta.license.trim(),
    licenseUrl: meta.licenseUrl,
    changes: CHANGES_NOTE,
    tone,
    landmarks: { ...landmarks },
  };
}
