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
export const HEAD_CROP_SCALE = 1.5;
export const HEAD_CROP_LIFT = 0.1;

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

export interface CreditEntry {
  id: string;
  file: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
  changes: string;
  /** Average skin tone of the cropped face, used to colour the rest of the head. */
  tone: string;
}

/** Description of the edits applied to every source photo. */
export const CHANGES_NOTE = 'Cropped to the head, resized and given a feathered oval mask.';

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

export function creditEntry(id: string, file: string, meta: Readonly<CommonsMeta>, tone: string): CreditEntry {
  return {
    id,
    file,
    sourceUrl: meta.pageUrl,
    author: stripHtml(meta.artist) || 'Unknown',
    license: meta.license.trim(),
    licenseUrl: meta.licenseUrl,
    changes: CHANGES_NOTE,
    tone,
  };
}
