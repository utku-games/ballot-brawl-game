/**
 * Drives one fighter's model each frame: interpolated position, heading, procedural pose, head wobble, hit flash and
 * the photo head's facial expression.
 * The simulation state is read only; between ticks the position is blended so motion stays smooth above 60 Hz,
 * and the photo head always turns to face the camera so every face stays readable, even lying on the floor.
 * Hits squash the head, flash the body and make the face wince; knockouts close the eyes and circle stars overhead;
 * the match result makes winners grin and cheer and the losing side slump; big knockouts launch the fighter into the air,
 * and a held item shows in the right hand.
 */
import * as THREE from 'three';
import { dampAngle, dampValue } from '@utku/engine';
import { ActionKind, type FighterState, type ItemKind } from '../fight/fightTypes';
import type { FaceCredit } from '../roster/credits';
import type { FighterDef } from '../roster/rosterTypes';
import type { FinisherStyle, Gesture } from '../roster/signatureTypes';
import type { Expression } from './faceWarp';
import { buildFighterRig, setFall, type FighterRig } from './fighterModel';
import { kickSpring, RESTING_SPRING, stepSpring, type SpringState } from './headSpring';
import { computePose, launchArc, Mood, ringOutDrop, type Pose } from './poseLogic';
import { itemParts } from './extraParts';
import { attachParts, fixedColorMaterials, type MaterialSet } from './outfitMeshes';
import { Anchor } from './partSpec';

const TURN_RATE = 18;
const FLASH_DECAY = 6;
const FLASH_COLOR = new THREE.Color(0xffffff);
const MARKER_SPIN = 3;
const STEP_WOBBLE = 0.02;
const KO_RING_OPACITY = 0.15;
const RING_OPACITY = 0.85;
/** Seconds a wince lasts after a hit, and how fast expressions blend. */
const WINCE_SECONDS = 0.5;
const EXPRESSION_RATE = 10;
/** Expression strengths for the dizzy guard break and the sad face of the losing side. */
const DIZZY_KO = 0.6;
const LOSE_HURT = 0.45;
const SQUASH = 0.16;
const STAR_SPIN = 4;
/** Held items are drawn smaller than floor items so they fit the hand. */
const HELD_SCALE = 0.7;
/** A rung-out fighter is hidden once this far below the platform, meters. */
const RING_OUT_HIDE_DEPTH = 25;

const parentWorld = new THREE.Quaternion();
const wobble = new THREE.Quaternion();
const wobbleEuler = new THREE.Euler();

export class FighterView {
  readonly rig: FighterRig;
  private spring: SpringState = { ...RESTING_SPRING };
  private flash = 0;
  private heading = 0;
  private wince = 0;
  private expression: Expression = { hurt: 0, happy: 0, ko: 0 };
  private koStart = -1;
  private mood = Mood.None;
  private intro = false;
  private readonly style: FinisherStyle;
  private readonly gesture: Gesture;
  private launchStart = -1;
  private ringOutStart = -1;
  private held: { kind: ItemKind; group: THREE.Group; materials: MaterialSet } | null = null;

  constructor(def: FighterDef, tone: number, face: THREE.Texture, credit: FaceCredit, teamColor: number, sizeScale: number) {
    this.rig = buildFighterRig(def, tone, face, credit, teamColor);
    this.style = def.signature.style;
    this.gesture = def.signature.gesture;
    this.rig.root.scale.setScalar(sizeScale);
  }

  /** Shows the player marker in the given colour, or hides it for CPU fighters. */
  setMarker(color: number | null): void {
    this.rig.marker.visible = color !== null;
    if (color !== null) this.rig.markerMaterial.color.setHex(color);
  }

  /** Sends the fighter flying from a big knockout, starting now. */
  launch(time: number): void {
    this.launchStart = time;
  }

  /** Shows the item in the right hand, or nothing. */
  private showHeld(kind: ItemKind | null): void {
    if ((this.held?.kind ?? null) === kind) return;
    if (this.held) {
      this.rig.grip.remove(this.held.group);
      this.held.materials.dispose();
      this.held = null;
    }
    if (!kind) return;
    const group = new THREE.Group();
    group.scale.setScalar(HELD_SCALE);
    const materials = fixedColorMaterials();
    attachParts(itemParts(kind), new Map([[Anchor.Projectile, group]]), materials);
    this.rig.grip.add(group);
    this.held = { kind, group, materials };
  }

  /** Sets the end-of-match mood (win, lose or none). */
  setMood(mood: Mood): void {
    this.mood = mood;
    if (mood !== Mood.None) this.rig.marker.visible = false;
  }

  /** Turns the match-intro gesture on or off. */
  setIntro(on: boolean): void {
    this.intro = on;
  }

  /** Reacts to being hit from direction (dirX, dirZ) in world space. */
  hit(dirX: number, dirZ: number, strength: number): void {
    const cos = Math.cos(-this.heading);
    const sin = Math.sin(-this.heading);
    const localX = dirX * cos + dirZ * sin;
    const localZ = -dirX * sin + dirZ * cos;
    this.spring = kickSpring(this.spring, -localX * strength, localZ * strength);
    this.flash = 1;
    this.wince = WINCE_SECONDS;
  }

  /** Turns the head card to face the camera in world space, then adds the wobble and tilt on top. */
  private faceCamera(cameraQuat: THREE.Quaternion, tilt: number): void {
    const head = this.rig.head;
    this.rig.root.updateMatrixWorld(true);
    head.parent?.getWorldQuaternion(parentWorld);
    wobble.setFromEuler(wobbleEuler.set(this.spring.z, 0, this.spring.x + tilt));
    head.quaternion.copy(parentWorld.invert()).multiply(cameraQuat).multiply(wobble);
  }

  update(prev: Readonly<FighterState>, cur: Readonly<FighterState>, alpha: number, time: number, dt: number, cameraQuat: THREE.Quaternion): void {
    const root = this.rig.root;
    root.position.set(prev.x + (cur.x - prev.x) * alpha, 0, prev.z + (cur.z - prev.z) * alpha);
    this.heading = dampAngle(this.heading, Math.atan2(cur.facingX, cur.facingZ), TURN_RATE, dt);
    root.rotation.y = this.heading;
    const knockedOut = cur.action.kind === ActionKind.KnockedOut;
    if (knockedOut && this.koStart < 0) this.koStart = time;
    if (!knockedOut) {
      this.koStart = -1;
      this.launchStart = -1;
    }
    if (cur.ringedOut && this.ringOutStart < 0) this.ringOutStart = time;
    if (!cur.ringedOut) this.ringOutStart = -1;
    const flight = launchArc(this.launchStart < 0 ? -1 : time - this.launchStart);
    const drop = ringOutDrop(this.ringOutStart < 0 ? -1 : time - this.ringOutStart);
    root.position.y = flight.height - drop.depth;
    root.rotation.z = flight.spin + drop.spin;
    root.visible = drop.depth < RING_OUT_HIDE_DEPTH;
    this.showHeld(cur.holding);
    const pose = computePose({
      kind: cur.action.kind, frame: cur.action.frame, duration: cur.action.duration, move: cur.action.move,
      moving: cur.moving, time, mood: knockedOut ? Mood.None : this.mood, koSeconds: knockedOut ? time - this.koStart : -1,
      style: this.style, gesture: this.gesture, intro: this.intro,
    });
    this.applyPose(pose);
    if (cur.moving) this.spring = kickSpring(this.spring, Math.sin(time * 11) * STEP_WOBBLE, 0);
    this.spring = stepSpring(this.spring, dt);
    this.faceCamera(cameraQuat, pose.tilt);
    this.updateFace(cur, knockedOut, time, dt);
    this.updateFlash(dt);
    this.rig.marker.rotation.y = time * MARKER_SPIN;
    this.rig.ringMaterial.opacity = pose.fall >= 1 && knockedOut ? KO_RING_OPACITY : RING_OPACITY;
  }

  private applyPose(pose: Readonly<Pose>): void {
    this.rig.armL.rotation.x = -pose.armL;
    this.rig.armR.rotation.x = -pose.armR;
    this.rig.legL.rotation.x = -pose.legL;
    this.rig.legR.rotation.x = -pose.legR;
    this.rig.torso.rotation.x = pose.lean;
    setFall(this.rig, pose.fall);
    this.rig.body.position.y = pose.bob;
  }

  private updateFace(cur: Readonly<FighterState>, knockedOut: boolean, time: number, dt: number): void {
    this.wince = Math.max(0, this.wince - dt);
    const dizzy = cur.action.kind === ActionKind.GuardBroken;
    const winning = this.mood === Mood.Win && !knockedOut;
    const losing = this.mood === Mood.Lose && !knockedOut;
    const target: Expression = {
      hurt: Math.max(this.wince / WINCE_SECONDS, losing ? LOSE_HURT : 0, cur.action.kind === ActionKind.Hitstun ? 1 : 0),
      happy: winning ? 1 : 0,
      ko: knockedOut ? 1 : dizzy ? DIZZY_KO : 0,
    };
    this.expression = {
      hurt: dampValue(this.expression.hurt, target.hurt, EXPRESSION_RATE, dt),
      happy: dampValue(this.expression.happy, target.happy, EXPRESSION_RATE, dt),
      ko: dampValue(this.expression.ko, target.ko, EXPRESSION_RATE, dt),
    };
    this.rig.card.setExpression(this.expression);
    const squash = (this.wince / WINCE_SECONDS) * SQUASH;
    this.rig.card.mesh.scale.set(1 + squash, 1 - squash, 1);
    this.rig.stars.visible = knockedOut || dizzy;
    this.rig.stars.rotation.y = time * STAR_SPIN;
  }

  private updateFlash(dt: number): void {
    this.flash = Math.max(0, this.flash - FLASH_DECAY * dt);
    for (const m of this.rig.flashMaterials) m.emissive.copy(FLASH_COLOR).multiplyScalar(this.flash * 0.8);
  }

  /** Frees the head card and this fighter's own materials; shared geometry stays for other fighters. */
  dispose(): void {
    this.showHeld(null);
    this.rig.card.dispose();
    this.rig.materials.dispose();
  }
}
