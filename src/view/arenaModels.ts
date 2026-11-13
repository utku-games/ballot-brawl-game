/**
 * Builds the arena scenery: the fighting floor sized from the shared arena bounds, a border, and themed set pieces
 * behind it (green benches and a Speaker's chair, glowing ticker boards, or marble columns with picture frames).
 * Everything is plain boxes and cylinders in one group so an arena costs only a few dozen draw calls on phones.
 * Each arena kind adds its own set pieces through a small builder function.
 */
import * as THREE from 'three';
import { ARENA_HALF_DEPTH, ARENA_HALF_WIDTH } from '../core/arena';
import { arenaHasRingOuts, ArenaKind, ARENA_STYLES, type ArenaStyle } from './arenaKinds';

const FLOOR_THICKNESS = 0.3;
const BORDER = 0.6;
const BACK_Z = -ARENA_HALF_DEPTH - 3;
const WALL_HEIGHT = 7;
const WALL_WIDTH = ARENA_HALF_WIDTH * 2 + 12;
const PROP_COUNT = 7;
const PROP_SPACING = (ARENA_HALF_WIDTH * 2) / (PROP_COUNT - 1);
/** Width of the Studio's red carpet, meters. */
const CARPET_WIDTH = 2.4;
/** The Rooftop: depth of the platform slab, width of its painted edge line, and the skyline far below and behind. */
const ROOF_SLAB = 1.6;
const EDGE_LINE = 0.18;
const SKYLINE_COUNT = 14;
const SKYLINE_RADIUS = 26;
const SKYLINE_SPREAD = Math.PI * 1.2;
const SKYLINE_MIN_TOP = -10;
const SKYLINE_TOP_RANGE = 14;
const BUILDING_WIDTH = 4;
const BUILDING_HEIGHT = 40;

function box(w: number, h: number, d: number, color: number, emissive = 0): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissive ? 1 : 0, roughness: 0.8 }),
  );
  m.receiveShadow = true;
  return m;
}

function place(group: THREE.Group, mesh: THREE.Mesh, x: number, y: number, z: number): THREE.Mesh {
  mesh.position.set(x, y, z);
  group.add(mesh);
  return mesh;
}

function buildFloor(group: THREE.Group, style: ArenaStyle): void {
  place(group, box(ARENA_HALF_WIDTH * 2 + BORDER * 2, FLOOR_THICKNESS, ARENA_HALF_DEPTH * 2 + BORDER * 2, style.floorEdge), 0, -FLOOR_THICKNESS / 2 - 0.01, 0);
  place(group, box(ARENA_HALF_WIDTH * 2, FLOOR_THICKNESS, ARENA_HALF_DEPTH * 2, style.floor), 0, -FLOOR_THICKNESS / 2, 0);
  place(group, box(WALL_WIDTH, 0.2, 30, style.floorEdge), 0, -FLOOR_THICKNESS - 0.1, 0);
  place(group, box(WALL_WIDTH, WALL_HEIGHT, 0.5, style.wall), 0, WALL_HEIGHT / 2 - FLOOR_THICKNESS, BACK_Z - 1);
  place(group, box(WALL_WIDTH, 0.3, 0.6, style.trim), 0, WALL_HEIGHT - 1, BACK_Z - 0.8);
}

function buildParliament(group: THREE.Group, style: ArenaStyle): void {
  for (let row = 0; row < 3; row += 1) {
    place(group, box(ARENA_HALF_WIDTH * 2 + 2, 0.5 + row * 0.5, 0.9, style.accent), 0, 0.25 + row * 0.25, BACK_Z + 1.6 - row * 0.9);
  }
  place(group, box(1.6, 3.2, 1.2, style.floorEdge), 0, 1.6, BACK_Z - 0.2);
  place(group, box(1.2, 0.4, 1.3, style.trim), 0, 3.3, BACK_Z - 0.2);
  place(group, box(1.2, 0.9, 0.6, style.trim), -ARENA_HALF_WIDTH - 1.5, 0.45, 0);
  place(group, box(1.2, 0.9, 0.6, style.trim), ARENA_HALF_WIDTH + 1.5, 0.45, 0);
}

function buildTradingFloor(group: THREE.Group, style: ArenaStyle): void {
  for (let i = 0; i < PROP_COUNT; i += 1) {
    const x = -ARENA_HALF_WIDTH + i * PROP_SPACING;
    const color = i % 2 === 0 ? style.trim : style.accent;
    place(group, box(1.8, 1, 0.1, 0x000000, color), x, 3 + (i % 2) * 1.2, BACK_Z - 0.6);
  }
  place(group, box(WALL_WIDTH, 0.35, 0.1, 0x000000, style.trim), 0, 1.4, BACK_Z - 0.6);
  for (const side of [-1, 1]) place(group, box(1.6, 1, 1, style.floorEdge), side * (ARENA_HALF_WIDTH + 1.8), 0.5, -1);
}

function buildMuseum(group: THREE.Group, style: ArenaStyle): void {
  const column = new THREE.CylinderGeometry(0.35, 0.4, WALL_HEIGHT - 1, 12);
  const marble = new THREE.MeshStandardMaterial({ color: style.accent, roughness: 0.4 });
  for (let i = 0; i < PROP_COUNT; i += 1) {
    const x = -ARENA_HALF_WIDTH + i * PROP_SPACING;
    const c = new THREE.Mesh(column, marble);
    c.position.set(x, (WALL_HEIGHT - 1) / 2, BACK_Z + 0.4);
    c.castShadow = true;
    group.add(c);
    if (i < PROP_COUNT - 1) {
      place(group, box(1.4, 1.8, 0.1, style.trim), x + PROP_SPACING / 2, 3.2, BACK_Z - 0.7);
      place(group, box(1.1, 1.5, 0.12, 0x3a3a52), x + PROP_SPACING / 2, 3.2, BACK_Z - 0.66);
    }
  }
}

/** A talk-show set: a red carpet down the middle, glowing backdrop panels and stage lights on stands. */
function buildStudio(group: THREE.Group, style: ArenaStyle): void {
  place(group, box(CARPET_WIDTH, 0.02, ARENA_HALF_DEPTH * 2, style.accent), 0, 0.005, 0);
  for (let i = 0; i < PROP_COUNT; i += 1) {
    const x = -ARENA_HALF_WIDTH + i * PROP_SPACING;
    place(group, box(1.5, 2.4, 0.1, 0x000000, i % 2 === 0 ? style.trim : style.wall), x, 2.6, BACK_Z - 0.6);
  }
  for (const side of [-1, 1]) {
    place(group, box(0.12, 3, 0.12, style.floorEdge), side * (ARENA_HALF_WIDTH + 1.4), 1.5, -2);
    place(group, box(0.7, 0.5, 0.5, 0x000000, style.trim), side * (ARENA_HALF_WIDTH + 1.4), 3.1, -2);
  }
}

/** An open platform: a thick slab with a painted edge line and a city skyline around and below it, and no walls. */
function buildRooftop(group: THREE.Group, style: ArenaStyle): void {
  place(group, box(ARENA_HALF_WIDTH * 2, ROOF_SLAB, ARENA_HALF_DEPTH * 2, style.floor), 0, -ROOF_SLAB / 2, 0);
  for (const side of [-1, 1]) {
    place(group, box(ARENA_HALF_WIDTH * 2, 0.02, EDGE_LINE, style.floorEdge), 0, 0.005, side * (ARENA_HALF_DEPTH - EDGE_LINE / 2));
    place(group, box(EDGE_LINE, 0.02, ARENA_HALF_DEPTH * 2, style.floorEdge), side * (ARENA_HALF_WIDTH - EDGE_LINE / 2), 0.005, 0);
  }
  for (let i = 0; i < SKYLINE_COUNT; i += 1) {
    const angle = Math.PI + (i / (SKYLINE_COUNT - 1) - 0.5) * SKYLINE_SPREAD;
    const top = SKYLINE_MIN_TOP + ((i * 7) % SKYLINE_COUNT) / SKYLINE_COUNT * SKYLINE_TOP_RANGE;
    const x = Math.sin(angle) * SKYLINE_RADIUS;
    const z = Math.cos(angle) * SKYLINE_RADIUS;
    place(group, box(BUILDING_WIDTH, BUILDING_HEIGHT, BUILDING_WIDTH, i % 2 === 0 ? style.wall : style.accent), x, top - BUILDING_HEIGHT / 2, z);
    place(group, box(BUILDING_WIDTH * 0.7, 0.3, 0.05, 0x000000, style.trim), x, top - 1.5, z + BUILDING_WIDTH / 2 + 0.03);
  }
}

const BUILDERS: Readonly<Record<ArenaKind, (group: THREE.Group, style: ArenaStyle) => void>> = {
  [ArenaKind.Parliament]: buildParliament,
  [ArenaKind.TradingFloor]: buildTradingFloor,
  [ArenaKind.Museum]: buildMuseum,
  [ArenaKind.Studio]: buildStudio,
  [ArenaKind.Rooftop]: buildRooftop,
};

export function buildArena(kind: ArenaKind): THREE.Group {
  const group = new THREE.Group();
  const style = ARENA_STYLES[kind];
  if (!arenaHasRingOuts(kind)) buildFloor(group, style);
  BUILDERS[kind](group, style);
  return group;
}

/** Frees the arena's geometries and materials. */
export function disposeArena(group: THREE.Group): void {
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
}
