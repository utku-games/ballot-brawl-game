/**
 * Draws thrown finishers: one spinning group per projectile in flight, built from the thrower's projectile parts.
 * Positions are blended between the previous and current simulation states so flight stays smooth above 60 Hz.
 * Groups and their materials are created when a projectile appears and freed as soon as it is gone.
 */
import * as THREE from 'three';
import type { ProjectileState } from '../fight/fightTypes';
import type { FighterDef } from '../roster/rosterTypes';
import { attachParts, MaterialSet } from './outfitMeshes';
import { Anchor } from './partSpec';
import { projectileParts } from './projectileParts';

/** Flight height above the floor, meters. */
const FLIGHT_HEIGHT = 1.2;
/** Spin around the flight axis, radians per second. */
const SPIN_RATE = 12;
/** Skin tone placeholder; projectiles only use fixed colours. */
const NO_TONE = 0;

interface Flying {
  group: THREE.Group;
  spinner: THREE.Group;
  materials: MaterialSet;
}

export class ProjectileView {
  private readonly flying = new Map<string, Flying>();

  /** `throwers` maps a slot id to its fighter so each projectile gets the right look. */
  constructor(private readonly scene: THREE.Scene, private readonly throwers: ReadonlyMap<string, FighterDef>) {}

  private create(p: Readonly<ProjectileState>): Flying | null {
    const def = this.throwers.get(p.owner);
    if (!def) return null;
    const group = new THREE.Group();
    const spinner = new THREE.Group();
    group.add(spinner);
    const materials = new MaterialSet(def.look, NO_TONE);
    attachParts(projectileParts(def.signature.projectile), new Map([[Anchor.Projectile, spinner]]), materials);
    this.scene.add(group);
    const entry = { group, spinner, materials };
    this.flying.set(p.id, entry);
    return entry;
  }

  private remove(id: string, entry: Flying): void {
    this.scene.remove(entry.group);
    entry.materials.dispose();
    this.flying.delete(id);
  }

  update(prev: readonly ProjectileState[], cur: readonly ProjectileState[], alpha: number, time: number): void {
    const before = new Map(prev.map((p) => [p.id, p]));
    const live = new Set(cur.map((p) => p.id));
    for (const [id, entry] of this.flying) if (!live.has(id)) this.remove(id, entry);
    for (const p of cur) {
      const entry = this.flying.get(p.id) ?? this.create(p);
      if (!entry) continue;
      const from = before.get(p.id) ?? p;
      entry.group.position.set(from.x + (p.x - from.x) * alpha, FLIGHT_HEIGHT, from.z + (p.z - from.z) * alpha);
      entry.group.rotation.y = Math.atan2(p.dirX, p.dirZ);
      entry.spinner.rotation.z = time * SPIN_RATE;
    }
  }

  dispose(): void {
    for (const [id, entry] of this.flying) this.remove(id, entry);
  }
}
