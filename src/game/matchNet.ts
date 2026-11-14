/**
 * The network side of an online match as the match session sees it, independent of how messages travel.
 * The host takes the guest's controls once per tick and publishes every new state; the guest sends its controls
 * every frame and shows the states the host streamed.
 * Defining the interface here keeps the match session free of PeerJS and lets tests drive it with plain objects.
 */
import type { MatchState } from '../fight/fightTypes';
import type { ControlFrame } from '../input/controlFrame';

export enum NetRole {
  Host = 'host',
  Guest = 'guest',
}

export interface MatchNet {
  readonly role: NetRole;
  /** True while the other player's page is hidden (an app switch); the host holds the fight until they return. */
  readonly peerAway: boolean;
  /** Host: the guest's controls for the next tick. */
  takeRemoteFrame(): ControlFrame;
  /** Host: sends a state after each tick. */
  publish(state: Readonly<MatchState>): void;
  /** Guest: sends this frame's local controls. */
  sendFrame(frame: Readonly<ControlFrame>): void;
  /** Guest: the streamed states to show this frame, oldest first; clockSteps is how far the guest's clock advanced. */
  takeStates(clockSteps: number): MatchState[];
}
