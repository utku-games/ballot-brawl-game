/**
 * Tests for the pure input mappings: keyboard layouts, gamepad snapshots, the touch stick and frame merging.
 * Every device must produce the same ControlFrame shape with presses reported once and holds while held.
 * The conversion to a FighterInput must flip screen up to the arena's -Z and cap diagonal speed.
 */
import { describe, expect, it } from 'vitest';
import type { PadSnapshot } from '@utku/engine';
import { EMPTY_FRAME, mergeFrames, PlayerId, toFighterInput } from './controlFrame';
import { CAPTURED_KEYS, KEY_LAYOUTS, keyboardFrame } from './keyboardMapping';
import { PAD, padFrame } from './padMapping';
import { inStickZone, STICK_RADIUS_PX, stickVector } from './touchLogic';

const P1 = KEY_LAYOUTS[PlayerId.One];
const NONE = new Set<string>();

function pad(pressed: number[], axes: number[] = [0, 0]): PadSnapshot {
  return { axes, buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: pressed.includes(i), value: pressed.includes(i) ? 1 : 0 })) };
}

describe('keyboard', () => {
  it('maps held movement and defend, and fresh attack presses', () => {
    const f = keyboardFrame(P1, new Set([P1.up, P1.right, P1.defend]), new Set([P1.punch]));
    expect(f).toMatchObject({ moveX: 1, moveY: 1, defend: true, punch: true, kick: false });
  });

  it('gives the two players separate keys and captures them all', () => {
    const one = Object.values(KEY_LAYOUTS[PlayerId.One]);
    const two = Object.values(KEY_LAYOUTS[PlayerId.Two]);
    expect(one.some((k) => two.includes(k))).toBe(false);
    for (const k of [...one, ...two]) expect(CAPTURED_KEYS.has(k)).toBe(true);
    expect(keyboardFrame(P1, NONE, new Set(['Escape'])).pause).toBe(true);
  });
});

describe('gamepad', () => {
  it('reports a press only on the rising edge', () => {
    expect(padFrame(pad([PAD.x]), new Set()).punch).toBe(true);
    expect(padFrame(pad([PAD.x]), new Set([PAD.x])).punch).toBe(false);
  });

  it('prefers the D-pad over the stick and ignores the deadzone', () => {
    expect(padFrame(pad([PAD.left], [0.9, 0]), new Set()).moveX).toBe(-1);
    expect(padFrame(pad([], [0.1, 0.1]), new Set()).moveX).toBe(0);
    expect(padFrame(pad([], [0, -1]), new Set()).moveY).toBeGreaterThan(0);
    expect(padFrame(pad([PAD.rb]), new Set()).defend).toBe(true);
  });
});

describe('touch stick', () => {
  it('splits the screen and scales thumb travel', () => {
    expect(inStickZone(100, 800)).toBe(true);
    expect(inStickZone(700, 800)).toBe(false);
    expect(stickVector({ x: 0, y: 0 }, { x: 2, y: 0 })).toEqual({ x: 0, y: 0 });
    const full = stickVector({ x: 0, y: 0 }, { x: 0, y: -STICK_RADIUS_PX * 3 });
    expect(full.y).toBeCloseTo(1);
  });
});

describe('frames', () => {
  it('merges devices and converts screen up to -Z with capped diagonals', () => {
    const merged = mergeFrames({ ...EMPTY_FRAME, punch: true }, { ...EMPTY_FRAME, moveX: 1, defend: true });
    expect(merged).toMatchObject({ punch: true, defend: true, moveX: 1 });
    const input = toFighterInput({ ...EMPTY_FRAME, moveX: 1, moveY: 1 });
    expect(input.moveZ).toBeLessThan(0);
    expect(Math.hypot(input.moveX, input.moveZ)).toBeCloseTo(1);
  });
});

describe('taunt', () => {
  it('maps the taunt on every device and passes it to the fighter', () => {
    expect(keyboardFrame(P1, NONE, new Set([P1.taunt])).taunt).toBe(true);
    expect(keyboardFrame(KEY_LAYOUTS[PlayerId.Two], NONE, new Set(['Semicolon'])).taunt).toBe(true);
    expect(padFrame(pad([PAD.b]), new Set()).taunt).toBe(true);
    expect(padFrame(pad([PAD.b]), new Set()).special).toBe(false);
    expect(mergeFrames(EMPTY_FRAME, { ...EMPTY_FRAME, taunt: true }).taunt).toBe(true);
    expect(toFighterInput({ ...EMPTY_FRAME, taunt: true }).taunt).toBe(true);
  });
});
