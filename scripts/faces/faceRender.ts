/**
 * Renders one fighter's face sticker: crops the head from the photo, cuts away the background with the Vision subject
 * mask, shapes it into a head oval that fades below the chin, and adds a white sticker outline.
 * It also measures the skin tone and converts the eye and mouth positions into texture coordinates for expressions.
 * Each head is rendered twice: once to measure its extent, then refit so every head fills its texture the same way.
 */
import sharp from 'sharp';
import {
  alphaBounds, chinY, cropRect, inHeadRegion, isErased, type ErasePolygon, paddedJaw, SILHOUETTE_CELLS, silhouetteRows, DEFAULT_LANDMARKS, headShape, refitRect, toHex, toTexture, type Crop, type FaceLandmarks,
  type PixelRect,
} from './faceRules.ts';

export const FACE_SIZE = 384;
const WEBP_QUALITY = 84;
const CHANNELS_RGB = 3;
const CHANNELS_RGBA = 4;
const BYTE_MAX = 255;
/** Alpha below this is forced to exactly zero so no faint ghost survives compression. */
const MIN_ALPHA = 0.08;
/** Outline thickness: blur radius of the alpha before thresholding, and the threshold (0..255). */
const OUTLINE_BLUR = 3.5;
const OUTLINE_THRESHOLD = 12;
/** Fraction of the texture averaged for the skin tone, and how far below the eye line it sits. */
const TONE_SAMPLE_FRACTION = 0.2;
/** Some Commons JPEGs carry harmless encoder quirks; decode them leniently. */
const SOURCE_READ = { failOn: 'none' } as const;

export interface ImageLandmarks {
  eyeA: { x: number; y: number };
  eyeB: { x: number; y: number };
  mouth: { x: number; y: number };
  mouthWidth: number;
  jaw?: Array<{ x: number; y: number }>;
}

export interface RenderResult {
  tone: string;
  landmarks: FaceLandmarks;
  silhouette: string[];
}

function textureLandmarks(img: ImageLandmarks | null, rect: Readonly<PixelRect>, w: number, h: number): FaceLandmarks {
  if (!img) return { ...DEFAULT_LANDMARKS };
  return {
    eyeA: toTexture(img.eyeA, rect, w, h),
    eyeB: toTexture(img.eyeB, rect, w, h),
    mouth: toTexture(img.mouth, rect, w, h),
    mouthWidth: (img.mouthWidth * w) / rect.side,
    jaw: (img.jaw ?? []).map((p) => toTexture(p, rect, w, h)),
  };
}

/**
 * Crops a square that may reach past the image edge; the outside is padded with black (masked away later).
 * Masks are first scaled to the photo's size so one rectangle fits both. Steps run as separate passes because sharp
 * applies a single pipeline's operations in its own fixed order.
 */
async function cropped(path: string, rect: Readonly<PixelRect>, channels: 1 | 3, width: number, height: number): Promise<Buffer> {
  const pad = {
    top: Math.max(0, -rect.top), left: Math.max(0, -rect.left),
    bottom: Math.max(0, rect.top + rect.side - height), right: Math.max(0, rect.left + rect.side - width),
  };
  const sized = await sharp(path, SOURCE_READ).removeAlpha().resize(width, height, { fit: 'fill' }).png().toBuffer();
  const padded = await sharp(sized).extend({ ...pad, background: '#000000' }).png().toBuffer();
  let img = sharp(padded).extract({ left: rect.left + pad.left, top: rect.top + pad.top, width: rect.side, height: rect.side })
    .resize(FACE_SIZE, FACE_SIZE);
  if (channels === 1) img = img.extractChannel(0);
  return img.raw().toBuffer();
}

async function skinTone(rgb: Buffer, lm: FaceLandmarks): Promise<string> {
  const side = Math.round(FACE_SIZE * TONE_SAMPLE_FRACTION);
  const cx = ((lm.eyeA.x + lm.eyeB.x) / 2) * FACE_SIZE;
  const cy = ((lm.eyeA.y + lm.eyeB.y) / 2 + lm.mouth.y) / 2 * FACE_SIZE;
  const left = Math.max(0, Math.min(FACE_SIZE - side, Math.round(cx - side / 2)));
  const top = Math.max(0, Math.min(FACE_SIZE - side, Math.round(cy - side / 2)));
  const stats = await sharp(rgb, { raw: { width: FACE_SIZE, height: FACE_SIZE, channels: CHANNELS_RGB } })
    .extract({ left, top, width: side, height: side }).stats();
  const [r, g, b] = stats.channels;
  return toHex(r.mean, g.mean, b.mean);
}

function shapedAlpha(mask: Buffer | null, lm: FaceLandmarks, erase: readonly ErasePolygon[]): Buffer {
  const alpha = Buffer.alloc(FACE_SIZE * FACE_SIZE);
  const chin = chinY(lm);
  const jaw = lm.jaw.length > 0 ? paddedJaw(lm.jaw) : [];
  for (let y = 0; y < FACE_SIZE; y += 1) {
    const v = (y + 0.5) / FACE_SIZE;
    for (let x = 0; x < FACE_SIZE; x += 1) {
      const i = y * FACE_SIZE + x;
      const u = (x + 0.5) / FACE_SIZE;
      const subject = mask ? mask[i] / BYTE_MAX : 1;
      const a = inHeadRegion(u, v, jaw, chin) && !isErased(u, v, erase) ? subject * headShape(u, v, 1) : 0;
      alpha[i] = a < MIN_ALPHA ? 0 : Math.round(a * BYTE_MAX);
    }
  }
  return alpha;
}

async function outline(alpha: Buffer): Promise<Buffer> {
  return sharp(alpha, { raw: { width: FACE_SIZE, height: FACE_SIZE, channels: 1 } })
    .blur(OUTLINE_BLUR).threshold(OUTLINE_THRESHOLD).extractChannel(0).raw().toBuffer();
}

/** Writes the sticker WebP for one face (minus any hand-set erase polygons) and returns its tone and texture landmarks. */
export async function renderFace(imagePath: string, maskFile: string | null, crop: Readonly<Crop>, img: ImageLandmarks | null, erase: readonly ErasePolygon[], outPath: string): Promise<RenderResult> {
  const { width = 0, height = 0 } = await sharp(imagePath, SOURCE_READ).metadata();
  const first = cropRect(crop, width, height);
  const firstAlpha = shapedAlpha(maskFile ? await cropped(maskFile, first, 1, width, height) : null, textureLandmarks(img, first, width, height), []);
  const bounds = alphaBounds(firstAlpha, FACE_SIZE);
  const rect = bounds ? refitRect(first, bounds, FACE_SIZE) : first;
  const landmarks = textureLandmarks(img, rect, width, height);
  const rgb = await cropped(imagePath, rect, 3, width, height);
  const mask = maskFile ? await cropped(maskFile, rect, 1, width, height) : null;
  const alpha = shapedAlpha(maskFile ? mask : null, landmarks, erase);
  const border = await outline(alpha);
  const out = Buffer.alloc(FACE_SIZE * FACE_SIZE * CHANNELS_RGBA);
  const finalAlpha = new Uint8Array(FACE_SIZE * FACE_SIZE);
  for (let i = 0; i < FACE_SIZE * FACE_SIZE; i += 1) {
    const a = alpha[i] / BYTE_MAX;
    for (let c = 0; c < CHANNELS_RGB; c += 1) out[i * 4 + c] = Math.round(rgb[i * 3 + c] * a + BYTE_MAX * (1 - a));
    finalAlpha[i] = Math.max(alpha[i], border[i]);
    out[i * 4 + 3] = finalAlpha[i];
  }
  await sharp(out, { raw: { width: FACE_SIZE, height: FACE_SIZE, channels: CHANNELS_RGBA } }).webp({ quality: WEBP_QUALITY, alphaQuality: 100 }).toFile(outPath);
  return { tone: await skinTone(rgb, landmarks), landmarks, silhouette: silhouetteRows(finalAlpha, FACE_SIZE, SILHOUETTE_CELLS) };
}
