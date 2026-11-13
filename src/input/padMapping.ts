/**
 * Standard-layout gamepad mapping: left stick or D-pad moves, face buttons punch and kick, bumpers defend and swap.
 * The conversion is pure: it takes a pad snapshot and the buttons held on the previous poll and returns a ControlFrame.
 * Fresh presses are found with the engine's risingButtons helper.
 */
import { applyDeadzone, isButtonDown, risingButtons, type PadSnapshot } from '@utku/engine';
import { EMPTY_FRAME, type ControlFrame } from './controlFrame';

/** Button indices of the W3C standard gamepad layout. */
export const PAD = {
  a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, lt: 6, rt: 7, start: 9, up: 12, down: 13, left: 14, right: 15,
} as const;

export const PAD_DEADZONE = 0.2;
const AXIS_X = 0;
const AXIS_Y = 1;

export function heldButtons(pad: PadSnapshot): Set<number> {
  const held = new Set<number>();
  pad.buttons.forEach((_, i) => {
    if (isButtonDown(pad, i)) held.add(i);
  });
  return held;
}

export function padFrame(pad: PadSnapshot, before: ReadonlySet<number>): ControlFrame {
  const held = heldButtons(pad);
  const fresh = risingButtons(held, before);
  const dpadX = (held.has(PAD.right) ? 1 : 0) - (held.has(PAD.left) ? 1 : 0);
  const dpadY = (held.has(PAD.up) ? 1 : 0) - (held.has(PAD.down) ? 1 : 0);
  const stickX = applyDeadzone(pad.axes[AXIS_X] ?? 0, PAD_DEADZONE);
  const stickY = -applyDeadzone(pad.axes[AXIS_Y] ?? 0, PAD_DEADZONE);
  const useDpad = dpadX !== 0 || dpadY !== 0;
  return {
    ...EMPTY_FRAME,
    moveX: useDpad ? dpadX : stickX,
    moveY: useDpad ? dpadY : stickY,
    punch: fresh.has(PAD.x),
    kick: fresh.has(PAD.a),
    special: fresh.has(PAD.y) || fresh.has(PAD.b),
    swap: fresh.has(PAD.lb),
    pause: fresh.has(PAD.start),
    defend: held.has(PAD.rb) || held.has(PAD.rt) || held.has(PAD.lt),
  };
}
