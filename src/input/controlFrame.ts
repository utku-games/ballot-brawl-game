/**
 * The device-independent control frame every input source produces once per tick, and its conversion to a FighterInput.
 * Keyboard, gamepad and touch all fill the same shape, so the match session never cares which device a player uses.
 * Screen up on a stick means away from the camera, which is -Z on the arena floor.
 */
import type { FighterInput } from '../fight/fightTypes';

export enum PlayerId {
  One = 'p1',
  Two = 'p2',
}

export interface ControlFrame {
  /** Stick: +x right, +y screen up; length 0..1. */
  moveX: number;
  moveY: number;
  /** Fresh presses. */
  punch: boolean;
  kick: boolean;
  special: boolean;
  taunt: boolean;
  swap: boolean;
  pause: boolean;
  /** Held. */
  defend: boolean;
}

export const EMPTY_FRAME: Readonly<ControlFrame> = {
  moveX: 0, moveY: 0, punch: false, kick: false, special: false, taunt: false, swap: false, pause: false, defend: false,
};

/** Merges two frames: presses and holds are OR-ed, the stronger stick wins. */
export function mergeFrames(a: Readonly<ControlFrame>, b: Readonly<ControlFrame>): ControlFrame {
  const stick = Math.hypot(b.moveX, b.moveY) > Math.hypot(a.moveX, a.moveY) ? b : a;
  return {
    moveX: stick.moveX,
    moveY: stick.moveY,
    punch: a.punch || b.punch,
    kick: a.kick || b.kick,
    special: a.special || b.special,
    taunt: a.taunt || b.taunt,
    swap: a.swap || b.swap,
    pause: a.pause || b.pause,
    defend: a.defend || b.defend,
  };
}

export function toFighterInput(frame: Readonly<ControlFrame>): FighterInput {
  const length = Math.hypot(frame.moveX, frame.moveY);
  const scale = length > 1 ? 1 / length : 1;
  return {
    moveX: frame.moveX * scale,
    moveZ: -frame.moveY * scale,
    punch: frame.punch,
    kick: frame.kick,
    special: frame.special,
    taunt: frame.taunt,
    defend: frame.defend,
  };
}
