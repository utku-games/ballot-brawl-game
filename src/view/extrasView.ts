/**
 * Draws the Brawl extras: items lying on the floor, the warning shadow of a falling anvil, and the anvil itself.
 * Items bob and turn slowly so they catch the eye; the anvil drops during the last third of its warning and rests
 * briefly where it landed.
 * State comes from the simulation every frame; meshes are created when something appears and freed when it is gone.
 */
import * as THREE from 'three';
import type { HazardState, ItemState } from '../fight/fightTypes';
import { HAZARD_RADIUS, HAZARD_WARNING_TICKS } from '../fight/hazards';
import { anvilParts, itemParts } from './extraParts';
import { attachParts, fixedColorMaterials, type MaterialSet } from './outfitMeshes';
import { Anchor } from './partSpec';

const ITEM_HEIGHT = 0.3;
const ITEM_BOB = 0.08;
const ITEM_BOB_RATE = 4;
const ITEM_SPIN_RATE = 1.5;
const FALL_HEIGHT = 9;
/** Share of the warning during which the anvil is visibly falling. */
const FALL_SHARE = 1 / 3;
const RING_COLOR = 0xff3030;
const RING_OPACITY = 0.55;
const RING_PULSE_RATE = 10;
const RING_HEIGHT = 0.02;
const LANDED_SECONDS = 0.8;
const RING_SEGMENTS = 40;

interface Built {
  group: THREE.Group;
  materials: MaterialSet;
}

interface Falling extends Built {
  ring: THREE.Mesh;
}

function build(scene: THREE.Scene, parts: Parameters<typeof attachParts>[0]): Built {
  const group = new THREE.Group();
  const materials = fixedColorMaterials();
  attachParts(parts, new Map([[Anchor.Projectile, group]]), materials);
  scene.add(group);
  return { group, materials };
}

export class ExtrasView {
  private readonly items = new Map<string, Built>();
  private readonly hazards = new Map<string, Falling>();
  private readonly landed: Array<Built & { until: number }> = [];
  private readonly ringGeometry = new THREE.RingGeometry(HAZARD_RADIUS * 0.85, HAZARD_RADIUS, RING_SEGMENTS).rotateX(-Math.PI / 2);
  private readonly ringMaterial = new THREE.MeshBasicMaterial({ color: RING_COLOR, transparent: true, opacity: RING_OPACITY, depthWrite: false });

  constructor(private readonly scene: THREE.Scene) {}

  private free(b: Built): void {
    this.scene.remove(b.group);
    b.materials.dispose();
  }

  private updateItems(items: readonly ItemState[], time: number): void {
    const live = new Set(items.map((i) => i.id));
    for (const [id, b] of this.items) if (!live.has(id)) { this.free(b); this.items.delete(id); }
    for (const item of items) {
      const b = this.items.get(item.id) ?? build(this.scene, itemParts(item.kind));
      this.items.set(item.id, b);
      b.group.position.set(item.x, ITEM_HEIGHT + Math.sin(time * ITEM_BOB_RATE) * ITEM_BOB, item.z);
      b.group.rotation.y = time * ITEM_SPIN_RATE;
    }
  }

  private updateHazards(hazards: readonly HazardState[], time: number): void {
    const live = new Set(hazards.map((h) => h.id));
    for (const [id, f] of this.hazards) if (!live.has(id)) { this.free(f); this.scene.remove(f.ring); this.hazards.delete(id); }
    for (const h of hazards) {
      let f = this.hazards.get(h.id);
      if (!f) {
        const ring = new THREE.Mesh(this.ringGeometry, this.ringMaterial);
        ring.position.set(h.x, RING_HEIGHT, h.z);
        this.scene.add(ring);
        f = { ...build(this.scene, anvilParts()), ring };
        this.hazards.set(h.id, f);
      }
      const fallTicks = HAZARD_WARNING_TICKS * FALL_SHARE;
      const t = Math.min(1, h.ticksLeft / fallTicks);
      f.group.visible = h.ticksLeft < fallTicks;
      f.group.position.set(h.x, FALL_HEIGHT * t, h.z);
      f.ring.scale.setScalar(1 + Math.sin(time * RING_PULSE_RATE) * 0.06);
    }
  }

  /** Leaves an anvil where one just landed, for a moment. */
  land(x: number, z: number, time: number): void {
    const b = build(this.scene, anvilParts());
    b.group.position.set(x, 0, z);
    this.landed.push({ ...b, until: time + LANDED_SECONDS });
  }

  update(items: readonly ItemState[], hazards: readonly HazardState[], time: number): void {
    this.updateItems(items, time);
    this.updateHazards(hazards, time);
    for (let i = this.landed.length - 1; i >= 0; i -= 1) {
      if (time > this.landed[i].until) {
        this.free(this.landed[i]);
        this.landed.splice(i, 1);
      }
    }
  }

  dispose(): void {
    for (const b of this.items.values()) this.free(b);
    for (const f of this.hazards.values()) { this.free(f); this.scene.remove(f.ring); }
    for (const b of this.landed) this.free(b);
    this.items.clear();
    this.hazards.clear();
    this.landed.length = 0;
    this.ringGeometry.dispose();
    this.ringMaterial.dispose();
  }
}
