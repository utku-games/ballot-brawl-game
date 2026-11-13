/**
 * Development-only lineup page: shows six of one category's twelve fighters side by side to check every costume.
 * The query string picks the category, which half of it (0 or 1) and a pose (idle, punch or ko) so costumes can be checked mid-swing
 * and lying on the floor, with the same renderer, lighting and ambient occlusion as a real match.
 * It is served only by the dev server through lineup.html; production builds bundle index.html alone.
 */
import * as THREE from 'three';
import { createGameRenderer } from '@utku/engine';
import { PlatformError } from '../core/errors';
import { creditFor, toneOf } from '../roster/credits';
import { fightersIn } from '../roster/roster';
import { Category } from '../roster/rosterTypes';
import { ARENA_FOR_CATEGORY, ARENA_STYLES } from '../view/arenaKinds';
import { buildArena } from '../view/arenaModels';
import { faceTexture } from '../view/faceTextures';
import { buildFighterRig, type FighterRig } from '../view/fighterModel';

const COLUMNS = 6;
const SPACING_X = 1.55;
const CAMERA_HEIGHT = 2.2;
const CAMERA_DISTANCE = 6.4;
const LOOK_HEIGHT = 1.35;
const TEAM_COLOR = 0x3a8dff;
const PUNCH_ARM = 1.45;
const MS_PER_SECOND = 1000;

enum Pose {
  Idle = 'idle',
  Punch = 'punch',
  Ko = 'ko',
}

function applyPose(rig: FighterRig, pose: Pose): void {
  if (pose === Pose.Punch) rig.armR.rotation.x = -PUNCH_ARM;
  if (pose === Pose.Ko) {
    rig.body.rotation.x = -Math.PI / 2;
    rig.stars.visible = true;
  }
}

/** Turns a head card toward the camera, as the match view does every frame. */
function faceCamera(rig: FighterRig, cameraQuat: THREE.Quaternion): void {
  const parent = new THREE.Quaternion();
  rig.root.updateMatrixWorld(true);
  rig.head.parent?.getWorldQuaternion(parent);
  rig.head.quaternion.copy(parent.invert()).multiply(cameraQuat);
}

function start(): void {
  const container = document.getElementById('app');
  if (!container) throw new PlatformError('Missing #app element');
  const params = new URLSearchParams(window.location.search);
  const category = (params.get('category') as Category | null) ?? Category.Politicians;
  const pose = (params.get('pose') as Pose | null) ?? Pose.Idle;
  const half = Number(params.get('half') ?? '0');
  const view = createGameRenderer(container);
  const arena = ARENA_FOR_CATEGORY[category];
  view.setEnvironment(ARENA_STYLES[arena].environment);
  view.scene.add(buildArena(arena));
  const rigs = fightersIn(category).slice(half * COLUMNS, (half + 1) * COLUMNS).map((def, i) => {
    const rig = buildFighterRig(def, toneOf(def.id), faceTexture(def.id), creditFor(def.id), TEAM_COLOR);
    rig.root.position.set((i - (COLUMNS - 1) / 2) * SPACING_X, 0, 0);
    applyPose(rig, pose);
    view.scene.add(rig.root);
    return rig;
  });
  view.camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
  view.camera.lookAt(0, LOOK_HEIGHT, 0);
  window.addEventListener('resize', () => view.resize());
  let last = performance.now();
  const frame = (now: number): void => {
    for (const rig of rigs) faceCamera(rig, view.camera.quaternion);
    view.render((now - last) / MS_PER_SECOND);
    last = now;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

start();
