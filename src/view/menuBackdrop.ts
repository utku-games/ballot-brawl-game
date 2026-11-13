/**
 * The living background behind the menus: an arena with the camera slowly circling above the empty floor.
 * It reuses the arena builder and the engine renderer, so the menus cost no extra assets.
 * The arena changes with the context (for example the chosen story category).
 */
import type { GameRenderer } from '@utku/engine';
import * as THREE from 'three';
import { ARENA_STYLES, type ArenaKind } from './arenaKinds';
import { buildArena, disposeArena } from './arenaModels';

const ORBIT_RADIUS = 13;
const ORBIT_HEIGHT = 5.5;
const ORBIT_RATE = 0.08;
const ORBIT_SWING = 0.6;
const LOOK_HEIGHT = 1;

export class MenuBackdrop {
  private arena: THREE.Group | null = null;
  private kind: ArenaKind | null = null;
  private time = 0;

  constructor(private readonly view: GameRenderer) {}

  show(kind: ArenaKind): void {
    if (this.kind === kind && this.arena) return;
    this.hide();
    this.kind = kind;
    this.arena = buildArena(kind);
    this.view.scene.add(this.arena);
    this.view.setEnvironment(ARENA_STYLES[kind].environment);
  }

  hide(): void {
    if (!this.arena) return;
    this.view.scene.remove(this.arena);
    disposeArena(this.arena);
    this.arena = null;
    this.kind = null;
  }

  render(dt: number): void {
    this.time += dt;
    const angle = Math.sin(this.time * ORBIT_RATE) * ORBIT_SWING;
    this.view.camera.position.set(Math.sin(angle) * ORBIT_RADIUS, ORBIT_HEIGHT, Math.cos(angle) * ORBIT_RADIUS);
    this.view.camera.lookAt(0, LOOK_HEIGHT, 0);
    this.view.render(dt);
  }
}
