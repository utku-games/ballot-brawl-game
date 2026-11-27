/**
 * The player's Controls setting (Auto, Touch, Keyboard or Gamepad) and which device it resolves to right now.
 * Auto follows the device last used (a touch anywhere, a key, a gamepad button), starting from touch on phones and keyboard elsewhere; the fixed settings ignore it.
 * Pure rules with the matching key legends; the controls presenter shows or hides the on-screen buttons and the legend from them.
 */
import type { ControlFrame } from './controlFrame';

export enum ControlScheme {
  Auto = 'auto',
  Touch = 'touch',
  Keyboard = 'keyboard',
  Gamepad = 'gamepad',
}

export enum InputDevice {
  Touch = 'touch',
  Keyboard = 'keyboard',
  Gamepad = 'gamepad',
}

/** The order the title screen's Controls button cycles through. */
export const SCHEME_ORDER: readonly ControlScheme[] = [ControlScheme.Auto, ControlScheme.Touch, ControlScheme.Keyboard, ControlScheme.Gamepad];
export const DEFAULT_SCHEME = ControlScheme.Auto;

const SCHEME_NAMES: Readonly<Record<ControlScheme, string>> = {
  [ControlScheme.Auto]: 'Auto',
  [ControlScheme.Touch]: 'Touch',
  [ControlScheme.Keyboard]: 'Keyboard',
  [ControlScheme.Gamepad]: 'Gamepad',
};

/** Player 1's controls, shown during matches when the keyboard or a gamepad is in use; touch players see the buttons instead. */
export const CONTROL_LEGENDS: Readonly<Record<InputDevice, string | null>> = {
  [InputDevice.Touch]: null,
  [InputDevice.Keyboard]: 'WASD move · J punch · K kick · L defend · I special · H taunt · U swap',
  [InputDevice.Gamepad]: 'Stick move · X punch · A kick · RB defend · Y special · B taunt · LB swap',
};

/** A stick pushed less than this does not count as using the device. */
const STICK_ACTIVE = 0.3;

export function schemeLabel(scheme: ControlScheme): string {
  return `Controls: ${SCHEME_NAMES[scheme]}`;
}

export function nextScheme(scheme: ControlScheme): ControlScheme {
  const at = SCHEME_ORDER.indexOf(scheme);
  return SCHEME_ORDER[(at + 1) % SCHEME_ORDER.length] as ControlScheme;
}

/** A saved value as a scheme; anything unknown (older saves, edits) is the default. */
export function parseScheme(value: unknown): ControlScheme {
  return SCHEME_ORDER.includes(value as ControlScheme) ? (value as ControlScheme) : DEFAULT_SCHEME;
}

/** The device the game is set up for: a fixed setting's device, or for Auto the last one used (touch on phones before any input). */
export function resolveDevice(scheme: ControlScheme, coarsePointer: boolean, lastUsed: InputDevice | null): InputDevice {
  if (scheme === ControlScheme.Touch) return InputDevice.Touch;
  if (scheme === ControlScheme.Keyboard) return InputDevice.Keyboard;
  if (scheme === ControlScheme.Gamepad) return InputDevice.Gamepad;
  return lastUsed ?? (coarsePointer ? InputDevice.Touch : InputDevice.Keyboard);
}

/** True when a device's frame shows the player using it: any press, a held defend, or a pushed stick. */
export function frameIsActive(frame: Readonly<ControlFrame>): boolean {
  return frame.punch || frame.kick || frame.special || frame.taunt || frame.swap || frame.pause || frame.defend
    || Math.hypot(frame.moveX, frame.moveY) >= STICK_ACTIVE;
}
