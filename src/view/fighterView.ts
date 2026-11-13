/**
 * Drives one fighter's model each frame: interpolated position, heading, procedural pose, head wobble and hit flash.
 * The simulation state is read only; between ticks the position is blended so motion stays smooth above 60 Hz.
 * Hits kick the head spring away from the attacker and flash the body white for a moment.
 */
import * as THREE from 'three';
import { dampAngle } from '@utku/engine';
import type { FighterState } from '../fight/fightTypes';
import type { FighterDef } from '../roster/rosterTypes';
import { buildFighterRig, type FighterRig } from './fighterModel';
import { kickSpring, RESTING_SPRING, stepSpring, type SpringState } from './headSpring';
import { computePose } from './poseLogic';

const TURN_RATE = 18;
/** How much of the body's turn the head undoes, so faces keep looking at the camera (1 = always straight at it). */
const HEAD_CAMERA_PULL = 0.8;
const FLASH_DECAY = 6;
const FLASH_COLOR = new THREE.Color(0xffffff);
const MARKER_SPIN = 3;
const MARKER_BOB = 0.08;
const STEP_WOBBLE = 0.02;
const KO_RING_OPACITY = 0.15;
const RING_OPACITY = 0.85;

/** Wraps an angle into -PI..PI. */
function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export class FighterView {
  readonly rig: FighterRig;
  private spring: SpringState = { ...RESTING_SPRING };
  private flash = 0;
  private heading = 0;

  constructor(def: FighterDef, tone: number, face: THREE.Texture, teamColor: number, private readonly sizeScale: number) {
    this.rig = buildFighterRig(def, tone, face, teamColor);
    this.rig.root.scale.setScalar(sizeScale);
  }

  /** Shows the player marker in the given colour, or hides it for CPU fighters. */
  setMarker(color: number | null): void {
    this.rig.marker.visible = color !== null;
    if (color !== null) this.rig.markerMaterial.color.setHex(color);
  }

  /** Reacts to being hit from direction (dirX, dirZ) in world space. */
  hit(dirX: number, dirZ: number, strength: number): void {
    const cos = Math.cos(-this.heading);
    const sin = Math.sin(-this.heading);
    const localX = dirX * cos + dirZ * sin;
    const localZ = -dirX * sin + dirZ * cos;
    this.spring = kickSpring(this.spring, -localX * strength, localZ * strength);
    this.flash = 1;
  }

  update(prev: Readonly<FighterState>, cur: Readonly<FighterState>, alpha: number, time: number, dt: number): void {
    const root = this.rig.root;
    root.position.set(prev.x + (cur.x - prev.x) * alpha, 0, prev.z + (cur.z - prev.z) * alpha);
    this.heading = dampAngle(this.heading, Math.atan2(cur.facingX, cur.facingZ), TURN_RATE, dt);
    root.rotation.y = this.heading;
    const pose = computePose({ kind: cur.action.kind, frame: cur.action.frame, duration: cur.action.duration, move: cur.action.move, moving: cur.moving, time });
    this.rig.armL.rotation.x = -pose.armL;
    this.rig.armR.rotation.x = -pose.armR;
    this.rig.legL.rotation.x = -pose.legL;
    this.rig.legR.rotation.x = -pose.legR;
    this.rig.torso.rotation.x = pose.lean;
    this.rig.body.rotation.x = (-pose.fall * Math.PI) / 2;
    this.rig.body.position.y = pose.bob;
    if (cur.moving) this.spring = kickSpring(this.spring, Math.sin(time * 11) * STEP_WOBBLE, 0);
    this.spring = stepSpring(this.spring, dt);
    this.rig.head.rotation.z = this.spring.x + pose.tilt;
    this.rig.head.rotation.x = this.spring.z;
    this.rig.head.rotation.y = -wrapAngle(this.heading) * HEAD_CAMERA_PULL * (1 - pose.fall);
    this.updateFlash(dt);
    this.rig.marker.rotation.y = time * MARKER_SPIN;
    this.rig.marker.position.y = this.rig.marker.position.y + Math.sin(time * MARKER_SPIN) * MARKER_BOB * dt;
    this.rig.ringMaterial.opacity = pose.fall >= 1 && cur.health <= 0 ? KO_RING_OPACITY : RING_OPACITY;
  }

  private updateFlash(dt: number): void {
    this.flash = Math.max(0, this.flash - FLASH_DECAY * dt);
    for (const m of this.rig.flashMaterials) m.emissive.copy(FLASH_COLOR).multiplyScalar(this.flash * 0.8);
  }

  get scale(): number {
    return this.sizeScale;
  }
}
