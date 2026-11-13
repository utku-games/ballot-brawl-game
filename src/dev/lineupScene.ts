/**
 * Development-only lineup page: shows six of one category's twelve fighters side by side to check every costume.
 * The query string picks the category, which half of it (0 or 1) and a pose: idle, punch, ko, gesture (each fighter's
 * looping gesture) or finisher (each fighter's finisher style at its first active frame), all with match lighting.
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
import { buildFighterRig, setFall, type FighterRig } from '../view/fighterModel';
import { ActionKind } from '../fight/fightTypes';
import { FINISHERS, MoveKind } from '../fight/moves';
import type { FighterDef } from '../roster/rosterTypes';
import { gesturePose } from '../view/gesturePoses';
import { computePose, Mood, type Pose as JointPose } from '../view/poseLogic';

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
  Gesture = 'gesture',
  Finisher = 'finisher',
}

/** Puts a computed joint pose on the rig, as FighterView does in a match. */
function setJoints(rig: FighterRig, p: Readonly<JointPose>): void {
  rig.armL.rotation.x = -p.armL;
  rig.armR.rotation.x = -p.armR;
  rig.legL.rotation.x = -p.legL;
  rig.legR.rotation.x = -p.legR;
  rig.torso.rotation.x = p.lean;
  rig.body.position.y = p.bob;
}

/** The animated pose for the gesture and finisher views, or null for the static ones. */
function livePose(def: FighterDef, pose: Pose, seconds: number): JointPose | null {
  if (pose === Pose.Gesture) return gesturePose(def.signature.gesture, seconds);
  if (pose !== Pose.Finisher) return null;
  const frame = FINISHERS[def.signature.style].startup + 1;
  return computePose({
    kind: ActionKind.Attack, frame, duration: 0, move: MoveKind.Finisher, moving: false, time: seconds, mood: Mood.None,
    koSeconds: -1, style: def.signature.style, gesture: def.signature.gesture, intro: false,
  });
}

function applyPose(rig: FighterRig, pose: Pose): void {
  if (pose === Pose.Punch) rig.armR.rotation.x = -PUNCH_ARM;
  if (pose === Pose.Ko) {
    setFall(rig, 1);
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
  const defs = fightersIn(category).slice(half * COLUMNS, (half + 1) * COLUMNS);
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
  const startedAt = last;
  const frame = (now: number): void => {
    rigs.forEach((rig, i) => {
      const live = livePose(defs[i], pose, (now - startedAt) / MS_PER_SECOND);
      if (live) setJoints(rig, live);
      faceCamera(rig, view.camera.quaternion);
    });
    view.render((now - last) / MS_PER_SECOND);
    last = now;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

start();
