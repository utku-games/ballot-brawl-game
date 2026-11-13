/**
 * The guest's buffer of match states streamed by the host.
 * Each rendered frame takes as many states as the guest's own clock allows, plus extra ones when the buffer has
 * grown past its target, so the guest catches up after a network hiccup without skipping any state's events.
 * Pure and generic over the state type, so the pacing rules are tested without a match or a network.
 */

/** States the guest keeps in hand to absorb jitter. */
export const TARGET_BUFFER = 3;
/** Most extra states taken in one frame while catching up. */
export const MAX_CATCH_UP = 4;

export class SnapshotQueue<T> {
  private readonly queue: T[] = [];

  push(state: T): void {
    this.queue.push(state);
  }

  get length(): number {
    return this.queue.length;
  }

  /** Takes the states to show this frame, oldest first; clockSteps is how many ticks the guest's clock advanced. */
  take(clockSteps: number): T[] {
    const surplus = Math.max(0, this.queue.length - clockSteps - TARGET_BUFFER);
    const count = Math.min(this.queue.length, clockSteps + Math.min(MAX_CATCH_UP, surplus));
    return this.queue.splice(0, count);
  }
}
