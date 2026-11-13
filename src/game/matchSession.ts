/**
 * Runs one match in the browser: fixed-step simulation, player and CPU control, rendering, HUD, sound and announcements.
 * It shows a short intro with every fighter's gesture, plays the fight with slow motion after finishers, replays a
 * knockout in slow motion, then reports the outcome.
 * Pausing simply stops the clock; the game app owns the pause menu and calls resume or dispose.
 */
import { createRng, FixedStepClock, type GameRenderer, type Rng } from '@utku/engine';
import { type AiMemory, FRESH_MEMORY, thinkAi } from '../ai/aiBrain';
import { profileForLevel, type AiProfile } from '../ai/aiProfile';
import { METER_MAX, TICK_SECONDS } from '../fight/fightConstants';
import { EndReason, MatchPhase, type FighterInput, type MatchState, type TeamIndex } from '../fight/fightTypes';
import { isAlive } from '../fight/matchQueries';
import { createMatch } from '../fight/matchSetup';
import { stepMatch } from '../fight/matchStep';
import { EMPTY_FRAME, PlayerId, toFighterInput, type ControlFrame } from '../input/controlFrame';
import { fighterById } from '../roster/roster';
import type { Twist } from '../rivalry/rivalryTypes';
import { blackoutLight } from '../rivalry/twists';
import type { GameAudio } from '../audio/gameAudio';
import { Hud } from '../ui/hud';
import { PLAYER_COLORS } from '../ui/theme';
import type { TouchControls } from '../ui/touchControls';
import { MatchView } from '../view/matchView';
import { playerSlots, updateAssignment } from './controlAssignment';
import { buildMatchSetup, cpuLevels, initialAssignment, type MatchPlan } from './matchPlan';
import { pushCapped, REPLAY_SPEED, REPLAY_TICKS, replayIndex } from './replayBuffer';

export interface MatchOutcome {
  winner: TeamIndex | null;
  /** Damage taken by the human team (team 0) this match. */
  playerTeamDamage: number;
  final: MatchState;
}

export interface SessionDeps {
  renderer: GameRenderer;
  hudParent: HTMLElement;
  audio: GameAudio;
  touch: TouchControls | null;
}

const MAX_CATCH_UP_STEPS = 5;
const INTRO_SECONDS = 2.2;
const OUTRO_SECONDS = 2.6;
/** Pause on the knockout before the replay starts. */
const KO_PAUSE_SECONDS = 0.9;
const SLOWMO_SECONDS = 0.9;
const SLOWMO_SCALE = 0.3;
/** Normal arena light, used outside the fight itself (intro, knockout outro, result screen). */
const FULL_LIGHT = 1;
const PLAYERS: readonly PlayerId[] = [PlayerId.One, PlayerId.Two];

export class MatchSession {
  private state: MatchState;
  private prev: MatchState;
  private readonly view: MatchView;
  private readonly hud: Hud;
  private readonly clock = new FixedStepClock(TICK_SECONDS, MAX_CATCH_UP_STEPS);
  private readonly rng: Rng;
  private readonly profiles = new Map<string, AiProfile>();
  private memories = new Map<string, AiMemory>();
  private assignment: Map<PlayerId, string>;
  private time = 0;
  private slowmo = 0;
  private outro = -1;
  /** Recent states for the knockout replay, oldest first. */
  private history: MatchState[] = [];
  /** Seconds left before the replay starts, seconds into the replay (-1 when not replaying), last replayed index. */
  private replayWait = 0;
  private replayAt = -1;
  private replayShown = -1;
  private started = false;
  private readonly twist: Twist;
  private finished = false;
  paused = false;

  constructor(plan: MatchPlan, private readonly deps: SessionDeps, private readonly onEnd: (o: MatchOutcome) => void, private readonly onPause: () => void) {
    this.state = createMatch(buildMatchSetup(plan));
    this.twist = plan.twist;
    this.prev = this.state;
    this.rng = createRng(plan.seed);
    for (const [slot, level] of cpuLevels(plan)) this.profiles.set(slot, profileForLevel(level));
    this.assignment = initialAssignment(plan);
    this.view = new MatchView(deps.renderer, this.state, plan.arena);
    this.hud = new Hud(deps.hudParent, this.state);
    this.refreshMarkers();
    this.view.setIntro(true);
    this.hud.announce(plan.banner ?? 'READY?', plan.banner !== null, false);
  }

  private refreshMarkers(): void {
    const markers = new Map<string, number>();
    const css = new Map<string, string>();
    for (const [player, slot] of this.assignment) {
      markers.set(slot, PLAYER_COLORS[player].hex);
      css.set(slot, PLAYER_COLORS[player].css);
    }
    this.view.setMarkers(markers);
    this.hud.setPlayers(css);
  }

  private inputsFor(frames: Readonly<Record<PlayerId, ControlFrame>>, first: boolean): FighterInput[] {
    const bySlot = new Map<string, ControlFrame>();
    for (const [player, slot] of this.assignment) {
      const f = frames[player];
      bySlot.set(slot, first ? f : { ...EMPTY_FRAME, moveX: f.moveX, moveY: f.moveY, defend: f.defend });
    }
    return this.state.fighters.map((f) => {
      const frame = bySlot.get(f.slotId);
      if (frame) return toFighterInput(frame);
      const d = thinkAi(this.state, f, this.profiles.get(f.slotId) ?? profileForLevel(0.5), this.memories.get(f.slotId) ?? FRESH_MEMORY, this.rng);
      this.memories.set(f.slotId, d.memory);
      return d.input;
    });
  }

  private updateAssignments(frames: Readonly<Record<PlayerId, ControlFrame>>): void {
    let changed = false;
    for (const player of PLAYERS) {
      const before = this.assignment.get(player);
      this.assignment = updateAssignment(this.assignment, this.state.fighters, player, frames[player].swap);
      if (this.assignment.get(player) !== before) changed = true;
    }
    if (changed) {
      this.memories = new Map([...this.memories].filter(([slot]) => !playerSlots(this.assignment).has(slot)));
      this.refreshMarkers();
    }
  }

  private announceEvents(state: Readonly<MatchState>): void {
    for (const e of state.events) {
      if (e.kind === 'swing' && e.move === 'finisher') {
        const f = state.fighters.find((x) => x.slotId === e.attacker);
        if (f) this.hud.announce(`${fighterById(f.fighterId).finisher}!`, true, false);
      } else if (e.kind === 'hit' && e.move === 'finisher') {
        this.slowmo = SLOWMO_SECONDS;
      } else if (e.kind === 'tauntDone' && playerSlots(this.assignment).has(e.fighter) && e.meter > 0) {
        this.hud.announce('+POWER', true, false);
      } else if (e.kind === 'ringOut') {
        this.hud.announce('RING OUT!', false, false);
      } else if (e.kind === 'matchOver') {
        this.hud.announce(e.reason === EndReason.KnockOut ? 'K.O.!' : 'TIME!', false, true);
        this.outro = OUTRO_SECONDS;
        if (e.reason === EndReason.KnockOut) this.replayWait = KO_PAUSE_SECONDS;
      }
    }
  }

  private simulate(dt: number, frames: Readonly<Record<PlayerId, ControlFrame>>): number {
    const scale = this.slowmo > 0 ? SLOWMO_SCALE : 1;
    this.slowmo = Math.max(0, this.slowmo - dt);
    const plan = this.clock.advance(dt * scale);
    for (let i = 0; i < plan.steps && this.state.phase === MatchPhase.Fighting; i += 1) {
      if (i === 0) this.updateAssignments(frames);
      const inputs = this.inputsFor(frames, i === 0);
      this.prev = this.state;
      this.state = stepMatch(this.state, inputs);
      this.history = pushCapped(this.history, this.state, REPLAY_TICKS);
      this.view.handleEvents(this.state.events, this.state);
      this.deps.audio.playEvents(this.state.events);
      this.announceEvents(this.state);
    }
    return plan.alpha;
  }

  /** Advances the session by one rendered frame. */
  frame(dt: number, frames: Readonly<Record<PlayerId, ControlFrame>>): void {
    if (this.finished) return;
    if (PLAYERS.some((p) => frames[p].pause) && !this.paused && this.outro < 0) {
      this.paused = true;
      this.onPause();
    }
    if (this.paused) {
      this.view.render(this.prev, this.state, 1, this.time, 0);
      return;
    }
    this.time += dt;
    let alpha = 1;
    if (!this.started) {
      if (this.time >= INTRO_SECONDS) {
        this.started = true;
        this.view.setIntro(false);
        this.hud.announce('FIGHT!', false, false);
      }
    } else if (this.state.phase === MatchPhase.Fighting) {
      alpha = this.simulate(dt, frames);
    } else if (this.stepOutro(dt, frames)) {
      this.view.setLight(FULL_LIGHT);
      this.updateHud();
      return;
    } else {
      this.prev = this.state;
    }
    const fighting = this.started && this.state.phase === MatchPhase.Fighting;
    this.view.setLight(fighting ? blackoutLight(this.twist, this.time) : FULL_LIGHT);
    this.view.render(this.prev, this.state, alpha, this.time, dt * (this.slowmo > 0 ? SLOWMO_SCALE : 1));
    this.updateHud();
  }

  /** After the match: the pause before the replay, the replay itself, then the outro. True when a replay frame was drawn. */
  private stepOutro(dt: number, frames: Readonly<Record<PlayerId, ControlFrame>>): boolean {
    if (this.replayWait > 0) {
      this.replayWait -= dt;
      if (this.replayWait <= 0 && this.history.length > 1) this.startReplay();
      return false;
    }
    if (this.replayAt >= 0) return this.stepReplay(dt, frames);
    this.outro -= dt;
    if (this.outro <= 0) this.finish();
    return false;
  }

  private startReplay(): void {
    this.replayAt = 0;
    this.replayShown = -1;
    this.view.clearMoods();
    this.hud.announce('REPLAY', true, true);
  }

  /** Plays the buffered fight back in slow motion; any attack button skips it. */
  private stepReplay(dt: number, frames: Readonly<Record<PlayerId, ControlFrame>>): boolean {
    this.replayAt += dt;
    const skip = PLAYERS.some((p) => frames[p].punch || frames[p].kick || frames[p].special);
    const index = replayIndex(this.replayAt, this.history.length);
    if (index < 0 || skip) {
      this.endReplay();
      return false;
    }
    for (let i = this.replayShown + 1; i <= index; i += 1) {
      this.view.handleEvents(this.history[i].events, this.history[i]);
      this.deps.audio.playEvents(this.history[i].events);
    }
    this.replayShown = index;
    const before = this.history[Math.max(0, index - 1)];
    this.view.render(before, this.history[index], 1, this.time, dt * REPLAY_SPEED);
    return true;
  }

  private endReplay(): void {
    this.replayAt = -1;
    const ending = this.state.events.filter((e) => e.kind === 'matchOver');
    this.view.handleEvents(ending, this.state);
    this.hud.announce('K.O.!', false, true);
  }

  private updateHud(): void {
    const focus = this.assignment.get(PlayerId.One) ?? null;
    this.hud.update(this.state, focus);
    const f = this.state.fighters.find((x) => x.slotId === focus);
    const mates = f ? this.state.fighters.filter((x) => x.team === f.team && isAlive(x)).length : 0;
    this.deps.touch?.setState(!!f && f.meter >= METER_MAX, mates > 1);
  }

  private finish(): void {
    this.finished = true;
    const damage = this.state.fighters.filter((f) => f.team === 0).reduce((sum, f) => sum + f.damageTaken, 0);
    this.onEnd({ winner: this.state.winner, playerTeamDamage: damage, final: this.state });
  }

  resume(): void {
    this.paused = false;
  }

  dispose(): void {
    this.view.dispose();
    this.hud.dispose();
  }
}
