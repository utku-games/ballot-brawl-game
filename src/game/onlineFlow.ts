/**
 * The online duel flow: the online menu, hosting or joining a room, the lobby, starting matches, results and leaving.
 * It owns the PeerJS connection and routes lobby messages itself and match messages to the running OnlineMatchNet.
 * Screens and matches go through the OnlineShell the game app provides, so this flow never touches the renderer.
 */
import type { Rng } from '@utku/engine';
import { fighterById } from '../roster/roster';
import { brawlCard } from '../share/shareCards';
import { HostedRoom, joinRoom, LinkFailure, NetLinkError, openRoom, type PeerConnection } from '../net/peerLink';
import { MsgKind, PROTOCOL_VERSION, type NetMessage, type StartInfo } from '../net/protocol';
import { Liveness } from '../net/liveness';
import { makeRoomCode, normalizeRoomCode } from '../net/roomCode';
import type { Screen } from '../ui/screenKit';
import { lobbyScreen, onlineMenuScreen, onlineResultScreen, statusScreen, waitingScreen } from '../ui/screens/onlineScreens';
import { ArenaKind } from '../view/arenaKinds';
import { NetRole, type MatchNet } from './matchNet';
import type { MatchPlan } from './matchPlan';
import type { MatchOutcome } from './matchSession';
import { OnlineMatchNet } from './onlineMatchNet';
import { onlineMatchPlan } from './onlinePlan';

/** What the flow needs from the game app. */
export interface OnlineShell {
  show(make: (parent: HTMLElement) => Screen, arena: ArenaKind | null): void;
  showOverlay(make: (parent: HTMLElement) => Screen): void;
  startMatch(plan: MatchPlan, onEnd: (o: MatchOutcome) => void, net: MatchNet, onQuit: () => void): void;
  pickFighter(onPick: (fighterId: string) => void, onBack: () => void): void;
  showTitle(): void;
}

const MENU_ARENA = ArenaKind.Rooftop;
const DEFAULT_ARENA = ArenaKind.Parliament;
/** Attempts at a fresh room code when the first one is already taken. */
const HOST_ATTEMPTS = 3;
const SEED_RANGE = 1_000_000;

const FAILURE_TEXT: Readonly<Record<LinkFailure, string>> = {
  [LinkFailure.CodeTaken]: 'Could not open a room. Please try again.',
  [LinkFailure.RoomNotFound]: 'No room with that code. Check the code and that your friend is still hosting.',
  [LinkFailure.Network]: 'Could not reach the other player. Check your connection and try again.',
  [LinkFailure.Protocol]: 'The other game sent something unexpected, perhaps from a different version. Both of you reload the page.',
  [LinkFailure.Silent]: 'Connection lost. Your opponent may have lost signal or closed the game.',
};
/** How often the keep-alive check runs. */
const PULSE_MS = 500;
const BAD_CODE_TEXT = 'Room codes are five letters and numbers.';
const LEFT_TEXT = 'Your opponent left the game.';

export class OnlineFlow {
  private conn: PeerConnection | null = null;
  private room: HostedRoom | null = null;
  private role = NetRole.Host;
  private mine: string | null = null;
  private theirs: string | null = null;
  private arena = DEFAULT_ARENA;
  private extras = true;
  private net: OnlineMatchNet | null = null;
  private inLobby = false;
  /** True while the other player is in the lobby, so the host may start. */
  private theirsHere = false;
  private liveness: Liveness | null = null;
  private pulse: ReturnType<typeof setInterval> | null = null;
  /** Bumped on every leave, so replies to an abandoned attempt are ignored. */
  private attempt = 0;

  constructor(private readonly shell: OnlineShell, private readonly rng: Rng) {}

  /** Shows the online menu, with an error line or null. */
  open(error: string | null): void {
    this.inLobby = false;
    this.shell.show((p) => onlineMenuScreen(p, error, {
      onHost: () => void this.host(),
      onJoin: (typed) => this.joinTyped(typed),
      onBack: () => this.shell.showTitle(),
    }), MENU_ARENA);
  }

  private status(title: string, message: string, onCancel: () => void): void {
    this.inLobby = false;
    this.shell.show((p) => statusScreen(p, title, message, 'Cancel', onCancel), MENU_ARENA);
  }

  private async host(): Promise<void> {
    const attempt = ++this.attempt;
    this.status('Opening a room', 'Connecting...', () => this.leave(null));
    for (let i = 0; i < HOST_ATTEMPTS; i += 1) {
      const code = makeRoomCode(this.rng);
      try {
        const room = await openRoom(code);
        if (attempt !== this.attempt) return room.close();
        this.room = room;
        this.shell.show((p) => waitingScreen(p, code, () => this.leave(null)), MENU_ARENA);
        const conn = await room.waitForGuest();
        if (attempt === this.attempt) this.connected(conn, NetRole.Host);
        return;
      } catch (e) {
        if (!(e instanceof NetLinkError)) throw e;
        if (attempt !== this.attempt) return;
        if (e.failure !== LinkFailure.CodeTaken) return this.open(FAILURE_TEXT[e.failure]);
      }
    }
    this.open(FAILURE_TEXT[LinkFailure.CodeTaken]);
  }

  private joinTyped(typed: string): void {
    const code = normalizeRoomCode(typed);
    if (!code) return this.open(BAD_CODE_TEXT);
    void this.join(code);
  }

  /** Joins the room under code (from the menu or an invite link). */
  async join(code: string): Promise<void> {
    const attempt = ++this.attempt;
    this.status('Joining room', `Connecting to ${code}...`, () => this.leave(null));
    try {
      const conn = await joinRoom(code);
      if (attempt !== this.attempt) return conn.close();
      this.connected(conn, NetRole.Guest);
    } catch (e) {
      if (!(e instanceof NetLinkError)) throw e;
      if (attempt === this.attempt) this.open(FAILURE_TEXT[e.failure]);
    }
  }

  private connected(conn: PeerConnection, role: NetRole): void {
    this.conn = conn;
    this.role = role;
    this.mine = null;
    this.theirs = null;
    this.theirsHere = false;
    this.liveness = new Liveness(Date.now());
    this.pulse = setInterval(() => this.checkPulse(), PULSE_MS);
    conn.onMessage((m) => this.receive(m));
    conn.onClose((failure) => this.leave(failure === null ? LEFT_TEXT : FAILURE_TEXT[failure]));
    conn.send({ kind: MsgKind.Hello, version: PROTOCOL_VERSION });
    if (role === NetRole.Host) this.sendSettings();
    this.showLobby();
  }

  private checkPulse(): void {
    const now = Date.now();
    if (this.liveness?.lost(now)) this.leave(FAILURE_TEXT[LinkFailure.Silent]);
    else if (this.liveness?.pingDue(now)) this.conn?.send({ kind: MsgKind.Ping });
  }

  private receive(m: Readonly<NetMessage>): void {
    this.liveness?.heard(Date.now());
    switch (m.kind) {
      case MsgKind.Ping:
        return;
      case MsgKind.Here:
        if (this.theirsHere === m.inLobby) return;
        this.theirsHere = m.inLobby;
        return this.refreshLobby();
      case MsgKind.Pick:
        this.theirs = m.fighterId;
        return this.refreshLobby();
      case MsgKind.Settings:
        if (this.role !== NetRole.Guest) return;
        this.arena = m.arena;
        this.extras = m.extras;
        return this.refreshLobby();
      case MsgKind.Start:
        if (this.role === NetRole.Guest) this.beginMatch(m);
        return;
      case MsgKind.Leave:
        return this.leave(LEFT_TEXT);
      case MsgKind.Input:
      case MsgKind.State:
        this.net?.receive(m);
        return;
      case MsgKind.Hello:
        return;
    }
  }

  private refreshLobby(): void {
    if (this.inLobby) this.showLobby();
  }

  private showLobby(): void {
    this.net = null;
    if (!this.inLobby) this.conn?.send({ kind: MsgKind.Here, inLobby: true });
    this.inLobby = true;
    const view = {
      host: this.role === NetRole.Host, mine: this.mine, theirs: this.theirs, theirsHere: this.theirsHere, arena: this.arena, extras: this.extras,
    };
    this.shell.show((p) => lobbyScreen(p, view, {
      onPick: () => this.pick(),
      onArena: (a) => this.changeSettings(a, this.extras),
      onExtras: (on) => this.changeSettings(this.arena, on),
      onStart: () => this.startAsHost(),
      onLeave: () => this.leave(null),
    }), this.arena);
  }

  private pick(): void {
    this.inLobby = false;
    this.shell.pickFighter((id) => {
      this.mine = id;
      this.conn?.send({ kind: MsgKind.Pick, fighterId: id });
      this.showLobby();
    }, () => this.showLobby());
  }

  private changeSettings(arena: ArenaKind, extras: boolean): void {
    this.arena = arena;
    this.extras = extras;
    this.sendSettings();
    this.showLobby();
  }

  private sendSettings(): void {
    this.conn?.send({ kind: MsgKind.Settings, arena: this.arena, extras: this.extras });
  }

  private startAsHost(): void {
    if (!this.mine || !this.theirs || !this.theirsHere || !this.conn) return;
    const info: StartInfo = { hostFighter: this.mine, guestFighter: this.theirs, arena: this.arena, extras: this.extras, seed: Math.floor(this.rng() * SEED_RANGE) };
    this.conn.send({ kind: MsgKind.Start, ...info });
    this.beginMatch(info);
  }

  private beginMatch(info: Readonly<StartInfo>): void {
    if (!this.conn) return;
    this.inLobby = false;
    this.theirsHere = false;
    const net = new OnlineMatchNet(this.role, this.conn, [info.hostFighter, info.guestFighter]);
    this.net = net;
    this.shell.startMatch(onlineMatchPlan(info, this.role), (o) => this.showResult(info, o), net, () => this.leave(null));
  }

  private showResult(info: Readonly<StartInfo>, outcome: Readonly<MatchOutcome>): void {
    const sides = [info.hostFighter, info.guestFighter];
    const winners = outcome.winner === null ? [] : [sides[outcome.winner]];
    const title = winners.length ? `${fighterById(winners[0]).name.toUpperCase()} WINS!` : 'DRAW!';
    const card = brawlCard(sides, winners, false);
    this.shell.showOverlay((p) => onlineResultScreen(p, title, card, () => this.showLobby(), () => this.leave(null)));
  }

  /** Tells the other player and closes any room or connection, without changing screens (used when the page closes). */
  disconnect(): void {
    this.attempt += 1;
    if (this.pulse !== null) clearInterval(this.pulse);
    this.pulse = null;
    this.liveness = null;
    this.conn?.send({ kind: MsgKind.Leave });
    this.conn?.close();
    this.conn = null;
    this.room?.close();
    this.room = null;
    this.net = null;
  }

  /** Ends any room or connection; message null returns to the title, otherwise the online menu shows it. */
  leave(message: string | null): void {
    this.disconnect();
    if (message === null) this.shell.showTitle();
    else this.open(message);
  }
}
