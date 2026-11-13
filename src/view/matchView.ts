/**
 * The 3D side of a match: builds the arena and one FighterView per fighter, renders interpolated states,
 * and turns fight events into effects (sparks, dust, head wobble, camera shake and the finisher zoom).
 * It owns nothing of the simulation; the match session feeds it states and events every frame.
 * Team colours for floor rings are defined here and mirrored by the HUD theme.
 */
import * as THREE from 'three';
import type { GameRenderer } from '@utku/engine';
import { MatchPhase, type FightEvent, type FighterState, type MatchState } from '../fight/fightTypes';
import { isAlive } from '../fight/matchQueries';
import { MoveKind } from '../fight/moves';
import { creditFor, toneOf } from '../roster/credits';
import { fighterById } from '../roster/roster';
import { ARENA_STYLES, type ArenaKind } from './arenaKinds';
import { buildArena, disposeArena } from './arenaModels';
import { CameraRig } from './cameraRig';
import { faceTexture } from './faceTextures';
import { FighterView } from './fighterView';
import { BurstKind, HitEffects } from './hitEffects';
import { Mood } from './poseLogic';

export const TEAM_COLORS: readonly [number, number] = [0x3a8dff, 0xff4a4a];

const HIT_HEIGHT = 1.4;
const FLOOR_HEIGHT = 0.1;
const HIT_WOBBLE: Readonly<Record<MoveKind, number>> = { [MoveKind.Punch]: 4, [MoveKind.Kick]: 6, [MoveKind.Finisher]: 10 };
const HIT_SHAKE: Readonly<Record<MoveKind, number>> = { [MoveKind.Punch]: 0.05, [MoveKind.Kick]: 0.12, [MoveKind.Finisher]: 0.45 };
const HIT_BURST: Readonly<Record<MoveKind, BurstKind>> = {
  [MoveKind.Punch]: BurstKind.Punch, [MoveKind.Kick]: BurstKind.Kick, [MoveKind.Finisher]: BurstKind.Finisher,
};
const KO_SHAKE = 0.3;

export class MatchView {
  private readonly arena: THREE.Group;
  private readonly fighters = new Map<string, FighterView>();
  private readonly effects: HitEffects;
  private readonly camera: CameraRig;
  private firstFrame = true;

  constructor(private readonly view: GameRenderer, state: Readonly<MatchState>, arena: ArenaKind) {
    view.setEnvironment(ARENA_STYLES[arena].environment);
    this.arena = buildArena(arena);
    view.scene.add(this.arena);
    for (const f of state.fighters) {
      const def = fighterById(f.fighterId);
      const fv = new FighterView(def, toneOf(def.id), faceTexture(def.id), creditFor(def.id).landmarks, TEAM_COLORS[f.team], f.profile.sizeScale);
      this.fighters.set(f.slotId, fv);
      view.scene.add(fv.rig.root);
    }
    this.effects = new HitEffects(view.scene);
    this.camera = new CameraRig(view.camera);
  }

  /** Marks player-controlled fighters with a floating arrow of the player's colour. */
  setMarkers(markers: ReadonlyMap<string, number>): void {
    for (const [slot, fv] of this.fighters) fv.setMarker(markers.get(slot) ?? null);
  }

  render(prev: Readonly<MatchState>, cur: Readonly<MatchState>, alpha: number, time: number, dt: number): void {
    const living = cur.fighters.filter(isAlive);
    const framed = cur.phase === MatchPhase.Over || living.length === 0 ? cur.fighters : living;
    this.camera.update(framed, dt, this.firstFrame);
    const cameraQuat = this.view.camera.quaternion;
    cur.fighters.forEach((f, i) => this.fighters.get(f.slotId)?.update(prev.fighters[i] ?? f, f, alpha, time, dt, cameraQuat));
    this.firstFrame = false;
    this.effects.update(dt);
    this.view.render(dt);
  }

  handleEvents(events: readonly FightEvent[], state: Readonly<MatchState>): void {
    const bySlot = new Map(state.fighters.map((f) => [f.slotId, f]));
    for (const e of events) this.handleEvent(e, bySlot);
  }

  private handleEvent(e: FightEvent, bySlot: ReadonlyMap<string, FighterState>): void {
    if (e.kind === 'hit') {
      const attacker = bySlot.get(e.attacker);
      const target = bySlot.get(e.target);
      if (attacker && target) {
        const len = Math.hypot(target.x - attacker.x, target.z - attacker.z) || 1;
        this.fighters.get(e.target)?.hit((target.x - attacker.x) / len, (target.z - attacker.z) / len, HIT_WOBBLE[e.move]);
      }
      this.effects.burst(HIT_BURST[e.move], e.x, HIT_HEIGHT, e.z);
      this.camera.addShake(HIT_SHAKE[e.move]);
    } else if (e.kind === 'block') {
      this.effects.burst(BurstKind.Block, e.x, HIT_HEIGHT, e.z);
    } else if (e.kind === 'guardBreak') {
      const t = bySlot.get(e.target);
      if (t) this.effects.burst(BurstKind.GuardBreak, t.x, HIT_HEIGHT, t.z);
    } else if (e.kind === 'swing' && e.move === MoveKind.Finisher) {
      const a = bySlot.get(e.attacker);
      if (a) this.camera.zoomTo(a.x, a.z);
    } else if (e.kind === 'matchOver') {
      for (const [slot, fv] of this.fighters) {
        const team = bySlot.get(slot)?.team;
        fv.setMood(e.winner === null ? Mood.Lose : team === e.winner ? Mood.Win : Mood.Lose);
      }
    } else if (e.kind === 'ko' || e.kind === 'knockdown') {
      const t = bySlot.get(e.target);
      if (t) this.effects.burst(BurstKind.Dust, t.x, FLOOR_HEIGHT, t.z);
      if (e.kind === 'ko') this.camera.addShake(KO_SHAKE);
    }
  }

  dispose(): void {
    this.view.scene.remove(this.arena);
    disposeArena(this.arena);
    for (const fv of this.fighters.values()) {
      this.view.scene.remove(fv.rig.root);
      fv.dispose();
    }
    this.effects.dispose();
  }
}
