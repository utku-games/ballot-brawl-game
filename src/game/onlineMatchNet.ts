/**
 * The MatchNet of a live online duel, carried by a PeerJS connection.
 * On the host it collects the guest's controls and sends every new state; on the guest it sends controls and buffers
 * the host's states for the match session to show.
 * Incoming match messages reach it through receive, called by the online flow that owns the connection.
 */
import type { MatchState } from '../fight/fightTypes';
import type { ControlFrame } from '../input/controlFrame';
import type { PeerConnection } from '../net/peerLink';
import { MsgKind, type NetMessage } from '../net/protocol';
import { RemoteInput } from '../net/remoteInput';
import { SnapshotQueue } from '../net/snapshotQueue';
import { NetRole, type MatchNet } from './matchNet';

export class OnlineMatchNet implements MatchNet {
  private readonly remote = new RemoteInput();
  private readonly states = new SnapshotQueue<MatchState>();

  constructor(readonly role: NetRole, private readonly conn: PeerConnection) {}

  receive(m: Readonly<NetMessage>): void {
    if (m.kind === MsgKind.Input && this.role === NetRole.Host) this.remote.push(m.frame);
    else if (m.kind === MsgKind.State && this.role === NetRole.Guest) this.states.push(m.state);
  }

  takeRemoteFrame(): ControlFrame {
    return this.remote.take();
  }

  publish(state: Readonly<MatchState>): void {
    this.conn.send({ kind: MsgKind.State, state });
  }

  sendFrame(frame: Readonly<ControlFrame>): void {
    this.conn.send({ kind: MsgKind.Input, frame });
  }

  takeStates(clockSteps: number): MatchState[] {
    return this.states.take(clockSteps);
  }
}
