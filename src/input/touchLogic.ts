/**
 * Pure rules for the floating touch joystick: the thumb's offset from where it landed becomes a stick vector.
 * The stick appears wherever the left thumb touches down, so players never hunt for a fixed pad on a small screen.
 * A small deadzone stops a resting thumb from creeping, and the remaining travel is rescaled to 0..1.
 */

/** Fraction of the screen width, from the left, where a touch starts the joystick instead of a button. */
export const STICK_ZONE_FRACTION = 0.5;
/** Thumb travel in CSS pixels for full deflection. */
export const STICK_RADIUS_PX = 56;
/** Deflection (0..1) ignored around the anchor. */
export const STICK_DEADZONE = 0.12;

export interface ScreenPoint {
  x: number;
  y: number;
}

export function inStickZone(x: number, screenWidth: number): boolean {
  return x < screenWidth * STICK_ZONE_FRACTION;
}

/** Knob offset from the anchor, clamped to the stick radius, for drawing. */
export function knobOffset(anchor: Readonly<ScreenPoint>, thumb: Readonly<ScreenPoint>): ScreenPoint {
  const dx = thumb.x - anchor.x;
  const dy = thumb.y - anchor.y;
  const length = Math.hypot(dx, dy);
  if (length <= STICK_RADIUS_PX) return { x: dx, y: dy };
  return { x: (dx / length) * STICK_RADIUS_PX, y: (dy / length) * STICK_RADIUS_PX };
}

/** Stick vector: x right, y screen up, length 0..1 after the deadzone. */
export function stickVector(anchor: Readonly<ScreenPoint>, thumb: Readonly<ScreenPoint>): ScreenPoint {
  const offset = knobOffset(anchor, thumb);
  const length = Math.hypot(offset.x, offset.y) / STICK_RADIUS_PX;
  if (length <= STICK_DEADZONE) return { x: 0, y: 0 };
  const scaled = (length - STICK_DEADZONE) / (1 - STICK_DEADZONE);
  const unit = STICK_RADIUS_PX * length;
  return { x: (offset.x / unit) * scaled, y: (-offset.y / unit) * scaled };
}
