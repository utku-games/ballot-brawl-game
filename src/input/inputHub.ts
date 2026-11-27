/**
 * Collects every input device once per frame and hands out one ControlFrame per local player.
 * Player 1 combines the WASD keys, the first gamepad and the touch controls; Player 2 the arrow keys and the second gamepad.
 * Presses are consumed when polled, so each tap is seen by exactly one simulation tick; the device that last produced input is remembered for the Controls setting.
 */
import { createKeyTracker, NAVIGATOR_PAD_PROVIDER, type KeyTracker, type PadProvider } from '@utku/engine';
import { mergeFrames, PlayerId, type ControlFrame } from './controlFrame';
import { CAPTURED_KEYS, KEY_LAYOUTS, keyboardFrame } from './keyboardMapping';
import { frameIsActive, InputDevice } from './controlScheme';
import { heldButtons, padFrame } from './padMapping';

/** Something that can contribute a frame for Player 1, such as the touch controls. */
export interface FrameSource {
  takeFrame(): ControlFrame;
}

const PAD_FOR_PLAYER: Readonly<Record<PlayerId, number>> = { [PlayerId.One]: 0, [PlayerId.Two]: 1 };

export class InputHub {
  private readonly keys: KeyTracker;
  private readonly padsBefore: Array<Set<number>> = [new Set(), new Set()];
  private touch: FrameSource | null = null;
  private device: InputDevice | null = null;

  constructor(target: Window, private readonly pads: PadProvider = NAVIGATOR_PAD_PROVIDER) {
    this.keys = createKeyTracker(target, CAPTURED_KEYS);
  }

  setTouch(source: FrameSource | null): void {
    this.touch = source;
  }

  /** The device that last produced input, or null before any. */
  get lastDevice(): InputDevice | null {
    return this.device;
  }

  /** Records a device used outside the polled frames, such as a touch on hidden on-screen buttons. */
  noteDevice(device: InputDevice): void {
    this.device = device;
  }

  /** One frame per player; call once per rendered frame. */
  poll(): Record<PlayerId, ControlFrame> {
    const presses = this.keys.takePresses();
    const pads = this.pads();
    const frames = {} as Record<PlayerId, ControlFrame>;
    for (const player of [PlayerId.One, PlayerId.Two]) {
      let frame = keyboardFrame(KEY_LAYOUTS[player], this.keys.held, presses);
      if (frameIsActive(frame)) this.device = InputDevice.Keyboard;
      const index = PAD_FOR_PLAYER[player];
      const pad = pads[index];
      if (pad) {
        const fromPad = padFrame(pad, this.padsBefore[index]);
        if (frameIsActive(fromPad)) this.device = InputDevice.Gamepad;
        frame = mergeFrames(frame, fromPad);
        this.padsBefore[index] = heldButtons(pad);
      }
      frames[player] = frame;
    }
    if (this.touch) {
      const fromTouch = this.touch.takeFrame();
      if (frameIsActive(fromTouch)) this.device = InputDevice.Touch;
      frames[PlayerId.One] = mergeFrames(frames[PlayerId.One], fromTouch);
    }
    return frames;
  }

  /** Drops any queued presses (used when leaving a menu so a confirm does not also punch). */
  flush(): void {
    this.keys.takePresses();
    this.touch?.takeFrame();
  }

  dispose(): void {
    this.keys.dispose();
  }
}

