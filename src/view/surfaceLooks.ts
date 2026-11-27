/**
 * Which engine surface preset each fighter colour slot is drawn with: skin for hands and neck, glossy vinyl for everything else.
 * The vinyl look turns the primitive bodies into collectible toy figures, which suits the photo bobblehead heads.
 * Pure mapping with no Three.js imports, so the costume code and tests share one rule.
 */
import type { SurfacePreset } from '@utku/engine';
import { ColorSlot, type Paint } from './partSpec';

/** Toy-figure plastic for suits, accents, hair, shoes and props. */
export const FIGHTER_SURFACE: SurfacePreset = 'vinyl';
/** Hands and neck, which use the photo's measured skin tone. */
export const SKIN_SURFACE: SurfacePreset = 'skin';

/** The surface preset for a part painted with this slot or fixed colour. */
export function surfaceForPaint(paint: Paint): SurfacePreset {
  return paint === ColorSlot.Skin ? SKIN_SURFACE : FIGHTER_SURFACE;
}
