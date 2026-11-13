/**
 * Placeholder arena scene for the scaffold: a lit floor sized from the shared arena bounds and a fixed camera.
 * It proves the engine renderer, environment and resize handling work before fighters exist.
 * Later milestones replace it with the full arena models and the framing camera.
 */
import * as THREE from 'three';
import { createGameRenderer, type GameRenderer, type RenderEnvironment } from '@utku/engine';
import { ARENA_HALF_DEPTH, ARENA_HALF_WIDTH } from '../core/arena';

const FLOOR_COLOR = 0x6b3fa0;
const FLOOR_THICKNESS = 0.2;
const CAMERA_HEIGHT = 7;
const CAMERA_DISTANCE = 12;
const MS_PER_SECOND = 1000;

const PREVIEW_ENVIRONMENT: RenderEnvironment = {
  skyTopColor: 0x1d1a44,
  skyBottomColor: 0x7a4fd1,
  fogColor: 0x2a2458,
  fogNear: 30,
  fogFar: 80,
  sunDirection: { x: -0.4, y: 1, z: 0.6 },
  sunColor: 0xfff1d6,
  ambientColor: 0x8f86c8,
};

/** Builds the preview scene inside the container and starts its render loop. */
export function startArenaPreview(container: HTMLElement): GameRenderer {
  const view = createGameRenderer(container);
  view.setEnvironment(PREVIEW_ENVIRONMENT);
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(ARENA_HALF_WIDTH * 2, FLOOR_THICKNESS, ARENA_HALF_DEPTH * 2),
    new THREE.MeshStandardMaterial({ color: FLOOR_COLOR }),
  );
  floor.position.y = -FLOOR_THICKNESS / 2;
  floor.receiveShadow = true;
  view.scene.add(floor);
  view.camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
  view.camera.lookAt(0, 0, 0);
  window.addEventListener('resize', () => view.resize());
  let last = performance.now();
  const frame = (now: number): void => {
    view.render((now - last) / MS_PER_SECOND);
    last = now;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return view;
}
