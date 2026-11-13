/**
 * Collects the guest's control frames on the host between simulation ticks.
 * Frames arrive at the guest's frame rate while the host ticks at its own, so presses are kept until a tick takes
 * them and held values (stick and defend) follow the latest frame.
 * Pure state with no networking, so the merging rules are tested directly.
 */
import { EMPTY_FRAME, type ControlFrame } from '../input/controlFrame';

export class RemoteInput {
  private latest: ControlFrame = { ...EMPTY_FRAME };
  private presses: ControlFrame = { ...EMPTY_FRAME };

  push(frame: Readonly<ControlFrame>): void {
    this.latest = { ...frame };
    this.presses = {
      ...this.presses,
      punch: this.presses.punch || frame.punch,
      kick: this.presses.kick || frame.kick,
      special: this.presses.special || frame.special,
      taunt: this.presses.taunt || frame.taunt,
    };
  }

  /** The frame for one tick: the latest stick and defend plus every press since the last take. */
  take(): ControlFrame {
    const frame: ControlFrame = {
      ...EMPTY_FRAME,
      moveX: this.latest.moveX,
      moveY: this.latest.moveY,
      defend: this.latest.defend,
      punch: this.presses.punch,
      kick: this.presses.kick,
      special: this.presses.special,
      taunt: this.presses.taunt,
    };
    this.presses = { ...EMPTY_FRAME };
    return frame;
  }
}
