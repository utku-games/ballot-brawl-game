/**
 * Moves the engine's perspective camera to the framing target with smoothing, plus screen shake and finisher zoom.
 * The camera always looks at the floor from the front and above at a fixed pitch, which keeps every fighter's face visible.
 * Shake and zoom are short decaying offsets triggered by the match view on big hits.
 */
import * as THREE from 'three';
import { dampValue } from '@utku/engine';
import { frameFighters } from './cameraFraming';

const PITCH = 0.42;
const LOOK_HEIGHT = 1.1;
const FOLLOW_RATE = 4;
const SHAKE_DECAY = 7;
const SHAKE_FREQ = 47;
const ZOOM_DECAY = 1.8;
const ZOOM_DISTANCE_SCALE = 0.55;
const FOV_DEGREES = 40;

export class CameraRig {
  private x = 0;
  private z = 0;
  private distance = 12;
  private shake = 0;
  private zoom = 0;
  private zoomX = 0;
  private zoomZ = 0;
  private time = 0;

  constructor(private readonly camera: THREE.PerspectiveCamera) {
    camera.fov = FOV_DEGREES;
    camera.updateProjectionMatrix();
  }

  addShake(amount: number): void {
    this.shake = Math.max(this.shake, amount);
  }

  /** Briefly zooms toward a point (finisher cut-in). */
  zoomTo(x: number, z: number): void {
    this.zoom = 1;
    this.zoomX = x;
    this.zoomZ = z;
  }

  update(points: ReadonlyArray<{ x: number; z: number }>, dt: number, snap: boolean): void {
    this.time += dt;
    const framing = frameFighters({ points, aspect: this.camera.aspect, fovY: THREE.MathUtils.degToRad(this.camera.fov) });
    const z = Math.min(1, this.zoom);
    const tx = framing.targetX + (this.zoomX - framing.targetX) * z;
    const tz = framing.targetZ + (this.zoomZ - framing.targetZ) * z;
    const td = framing.distance * (1 - (1 - ZOOM_DISTANCE_SCALE) * z);
    const rate = snap ? Number.POSITIVE_INFINITY : FOLLOW_RATE;
    this.x = snap ? tx : dampValue(this.x, tx, rate, dt);
    this.z = snap ? tz : dampValue(this.z, tz, rate, dt);
    this.distance = snap ? td : dampValue(this.distance, td, rate, dt);
    this.shake = Math.max(0, this.shake - SHAKE_DECAY * dt * this.shake - dt);
    this.zoom = Math.max(0, this.zoom - ZOOM_DECAY * dt);
    const sx = Math.sin(this.time * SHAKE_FREQ) * this.shake;
    const sy = Math.cos(this.time * SHAKE_FREQ * 1.3) * this.shake;
    this.camera.position.set(
      this.x + sx,
      LOOK_HEIGHT + Math.sin(PITCH) * this.distance + sy,
      this.z + Math.cos(PITCH) * this.distance,
    );
    this.camera.lookAt(this.x, LOOK_HEIGHT, this.z);
  }
}
