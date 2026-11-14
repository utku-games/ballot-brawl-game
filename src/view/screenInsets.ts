/**
 * Screen insets: the parts of the screen covered by the HUD and the touch controls, as fractions of its size.
 * The HUD always covers a band at the top; the touch buttons cover the bottom in portrait and the right side in landscape.
 * Pure: the caller measures the elements and passes plain rectangles, and each inset is capped so the fight stays visible.
 */

/** Fractions (0 to MAX_INSET) of the screen's height (top, bottom) or width (left, right) that overlays cover. */
export interface ScreenInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** A screen rectangle in CSS pixels. */
export interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const NO_INSETS: Readonly<ScreenInsets> = { top: 0, bottom: 0, left: 0, right: 0 };
/** No overlay may claim more than this fraction of either dimension. */
export const MAX_INSET = 0.4;

function cap(fraction: number): number {
  return Math.min(MAX_INSET, Math.max(0, fraction));
}

/**
 * Insets for a width x height screen whose HUD ends hudBottom pixels from the top and whose touch controls fill
 * controls (null when hidden).
 */
export function screenInsets(width: number, height: number, hudBottom: number, controls: Readonly<ScreenRect> | null): ScreenInsets {
  if (width <= 0 || height <= 0) return { ...NO_INSETS };
  const top = cap(hudBottom / height);
  if (!controls) return { ...NO_INSETS, top };
  if (height >= width) return { ...NO_INSETS, top, bottom: cap((height - controls.top) / height) };
  return { ...NO_INSETS, top, right: cap((width - controls.left) / width) };
}
