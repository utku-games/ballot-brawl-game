/**
 * Tests the Controls setting: cycling and parsing the saved value, resolving Auto to the device last used, and spotting active input.
 * Fixed settings ignore which device was used; Auto starts from touch on phones and keyboard elsewhere.
 * Pure rules; no DOM.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_FRAME } from './controlFrame';
import {
  CONTROL_LEGENDS, ControlScheme, DEFAULT_SCHEME, frameIsActive, InputDevice, nextScheme, parseScheme, resolveDevice, SCHEME_ORDER, schemeLabel,
} from './controlScheme';

describe('control scheme setting', () => {
  it('cycles through every scheme and back', () => {
    let s = DEFAULT_SCHEME;
    const seen: ControlScheme[] = [];
    for (let i = 0; i < SCHEME_ORDER.length; i += 1) {
      seen.push(s);
      s = nextScheme(s);
    }
    expect(seen).toEqual(SCHEME_ORDER);
    expect(s).toBe(DEFAULT_SCHEME);
    expect(schemeLabel(ControlScheme.Gamepad)).toBe('Controls: Gamepad');
  });

  it('reads saved values and falls back to Auto', () => {
    expect(parseScheme('keyboard')).toBe(ControlScheme.Keyboard);
    expect(parseScheme(undefined)).toBe(ControlScheme.Auto);
    expect(parseScheme('joystick')).toBe(ControlScheme.Auto);
  });
});

describe('resolveDevice', () => {
  it('starts Auto from touch on phones and keyboard elsewhere, then follows the last device used', () => {
    expect(resolveDevice(ControlScheme.Auto, true, null)).toBe(InputDevice.Touch);
    expect(resolveDevice(ControlScheme.Auto, false, null)).toBe(InputDevice.Keyboard);
    expect(resolveDevice(ControlScheme.Auto, false, InputDevice.Gamepad)).toBe(InputDevice.Gamepad);
    expect(resolveDevice(ControlScheme.Auto, true, InputDevice.Keyboard)).toBe(InputDevice.Keyboard);
  });

  it('keeps a fixed setting whatever was used', () => {
    expect(resolveDevice(ControlScheme.Touch, false, InputDevice.Keyboard)).toBe(InputDevice.Touch);
    expect(resolveDevice(ControlScheme.Keyboard, true, InputDevice.Touch)).toBe(InputDevice.Keyboard);
    expect(resolveDevice(ControlScheme.Gamepad, true, null)).toBe(InputDevice.Gamepad);
  });

  it('shows a legend for keys and pads but not for touch', () => {
    expect(CONTROL_LEGENDS[InputDevice.Touch]).toBeNull();
    expect(CONTROL_LEGENDS[InputDevice.Keyboard]).toContain('J punch');
    expect(CONTROL_LEGENDS[InputDevice.Gamepad]).toContain('Y special');
  });
});

describe('frameIsActive', () => {
  it('counts presses, defend and a pushed stick, not a resting stick', () => {
    expect(frameIsActive(EMPTY_FRAME)).toBe(false);
    expect(frameIsActive({ ...EMPTY_FRAME, moveX: 0.1 })).toBe(false);
    expect(frameIsActive({ ...EMPTY_FRAME, moveY: 0.8 })).toBe(true);
    expect(frameIsActive({ ...EMPTY_FRAME, defend: true })).toBe(true);
    expect(frameIsActive({ ...EMPTY_FRAME, special: true })).toBe(true);
  });
});
