/**
 * Keyboard layouts for the two local players and the pure conversion from held and pressed key codes to a ControlFrame.
 * Player 1 uses WASD with J, K, L, I, H and U; Player 2 uses the arrows with comma, period, slash, right shift,
 * semicolon and quote.
 * Codes follow KeyboardEvent.code, so the layout works on any keyboard language.
 */
import { EMPTY_FRAME, PlayerId, type ControlFrame } from './controlFrame';

export interface KeyLayout {
  up: string;
  down: string;
  left: string;
  right: string;
  punch: string;
  kick: string;
  defend: string;
  special: string;
  taunt: string;
  swap: string;
}

export const KEY_LAYOUTS: Readonly<Record<PlayerId, KeyLayout>> = {
  [PlayerId.One]: {
    up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
    punch: 'KeyJ', kick: 'KeyK', defend: 'KeyL', special: 'KeyI', taunt: 'KeyH', swap: 'KeyU',
  },
  [PlayerId.Two]: {
    up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
    punch: 'Comma', kick: 'Period', defend: 'Slash', special: 'ShiftRight', taunt: 'Semicolon', swap: 'Quote',
  },
};

/** Keys that pause the game for either player. */
export const PAUSE_KEYS: readonly string[] = ['Escape', 'KeyP'];

/** Every key the game uses, so the browser's default action (scrolling) can be suppressed. */
export const CAPTURED_KEYS: ReadonlySet<string> = new Set([
  ...Object.values(KEY_LAYOUTS).flatMap((layout) => Object.values(layout)),
  ...PAUSE_KEYS,
  'Space',
  'Enter',
]);

function axis(held: ReadonlySet<string>, negative: string, positive: string): number {
  return (held.has(positive) ? 1 : 0) - (held.has(negative) ? 1 : 0);
}

export function keyboardFrame(
  layout: Readonly<KeyLayout>,
  held: ReadonlySet<string>,
  presses: ReadonlySet<string>,
): ControlFrame {
  return {
    ...EMPTY_FRAME,
    moveX: axis(held, layout.left, layout.right),
    moveY: axis(held, layout.down, layout.up),
    punch: presses.has(layout.punch),
    kick: presses.has(layout.kick),
    special: presses.has(layout.special),
    taunt: presses.has(layout.taunt),
    swap: presses.has(layout.swap),
    pause: PAUSE_KEYS.some((key) => presses.has(key)),
    defend: held.has(layout.defend),
  };
}
