/**
 * The player's Controls setting (Auto, Touch, Keyboard or Gamepad) and which device it resolves to right now.
 * Auto follows the device last used (a touch anywhere, a key, a gamepad button), starting from touch on phones and keyboard elsewhere; the fixed settings ignore it.
 * Pure rules with the matching key legends (both players' keys in a local two-player match); the controls presenter shows or hides the on-screen buttons and the legend from them.
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

/** Player 2's keys, added to the keyboard legend when two players share the keyboard. */
export const PLAYER_TWO_KEYS = 'Arrows move · , punch · . kick · / defend · R-Shift special · ; taunt · \' swap';

/**
 * The legend for a device: Player 1's controls alone, or with two local players each player's line (keyboard) or a note
 * that the second pad drives Player 2 (gamepad). Touch shows the on-screen buttons instead, so it has none.
 */
export function controlLegend(device: InputDevice, twoLocalPlayers: boolean): string | null {
  const one = CONTROL_LEGENDS[device];
  if (one === null || !twoLocalPlayers) return one;
  if (device === InputDevice.Keyboard) return `P1  ${one}\nP2  ${PLAYER_TWO_KEYS}`;
  return `P1 pad 1 · P2 pad 2 or arrow keys\n${one}`;
}

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
