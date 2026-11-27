/**
 * Builds the arena scenery: the fighting floor sized from the shared arena bounds, a border, and themed set pieces
 * behind it (green benches with a seated crowd and a carved Speaker's chair, glowing ticker boards, or marble columns with picture frames).
 * Surfaces use the engine's material presets named in each arena's style (wood, polished marble, velvet, gold trim), with a procedural floor pattern; every arena shares one small material set, so it stays cheap on phones.
 * Each arena kind adds its own set pieces through a small builder function.
 */
import * as THREE from 'three';
import { ARENA_HALF_DEPTH, ARENA_HALF_WIDTH } from '../core/arena';
import { arenaHasRingOuts, ArenaKind, ARENA_STYLES, type ArenaStyle } from './arenaKinds';
import { BACK_Z, FLOOR_THICKNESS, WALL_HEIGHT, WALL_WIDTH, arenaMaterials, box, place, type ArenaMaterials } from './arenaKit';
import { addPanelling, addSconces, addSpeakerChair, addWindows } from './arenaDressing';
import { seatsOnBenches, type BenchRow, type SeatGap } from './crowdLayout';
import { buildCrowd } from './crowdView';

const BORDER = 0.6;
/** The Chamber: bench row height step, depth and front position, seat spacing, and the room's dressing. */
const BENCH_STEP = 0.5;
const BENCH_DEPTH = 0.9;
const BENCH_FRONT = 1.6;
const SEAT_SPACING = 0.75;
const CHAIR_CLEARANCE = 1.3;
const CHAMBER_PANEL_HEIGHT = 2.4;
const CHAMBER_WINDOWS: readonly number[] = [-9, -4.5, 4.5, 9];
const CHAMBER_SCONCES: readonly number[] = [-11.3, -6.8, -2.3, 2.3, 6.8, 11.3];
/** The Grand Gallery's dark wood dado below the paintings. */
const GALLERY_PANEL_HEIGHT = 1.4;
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

function buildFloor(group: THREE.Group, m: ArenaMaterials): void {
  place(group, box(ARENA_HALF_WIDTH * 2 + BORDER * 2, FLOOR_THICKNESS, ARENA_HALF_DEPTH * 2 + BORDER * 2, m.edge), 0, -FLOOR_THICKNESS / 2 - 0.01, 0);
  place(group, box(ARENA_HALF_WIDTH * 2, FLOOR_THICKNESS, ARENA_HALF_DEPTH * 2, m.floor), 0, -FLOOR_THICKNESS / 2, 0);
  place(group, box(WALL_WIDTH, 0.2, 30, m.edge), 0, -FLOOR_THICKNESS - 0.1, 0);
  place(group, box(WALL_WIDTH, WALL_HEIGHT, 0.5, m.wall), 0, WALL_HEIGHT / 2 - FLOOR_THICKNESS, BACK_Z - 1);
  place(group, box(WALL_WIDTH, 0.3, 0.6, m.trim), 0, WALL_HEIGHT - 1, BACK_Z - 0.8);
}

/** The Chamber's three bench rows: seat height grows and each row sits further back. */
const BENCH_ROWS: readonly BenchRow[] = [0, 1, 2].map((row) => ({ top: BENCH_STEP * (row + 1), z: BACK_Z + BENCH_FRONT - row * BENCH_DEPTH }));
/** The Speaker's chair stands in the back row at the centre, so no one sits there. */
const CHAIR_GAP: SeatGap = { row: 2, x0: -CHAIR_CLEARANCE, x1: CHAIR_CLEARANCE };

function buildParliament(group: THREE.Group, _style: ArenaStyle, m: ArenaMaterials): void {
  addPanelling(group, m, CHAMBER_PANEL_HEIGHT);
  addWindows(group, m, CHAMBER_WINDOWS);
  addSconces(group, m, CHAMBER_SCONCES);
  for (const row of BENCH_ROWS) place(group, box(ARENA_HALF_WIDTH * 2 + 2, row.top, BENCH_DEPTH, m.accent), 0, row.top / 2, row.z);
  addSpeakerChair(group, m, 0, BACK_Z - 0.2);
  group.add(buildCrowd(seatsOnBenches(BENCH_ROWS, ARENA_HALF_WIDTH, SEAT_SPACING, [CHAIR_GAP])));
  place(group, box(1.2, 0.9, 0.6, m.trim), -ARENA_HALF_WIDTH - 1.5, 0.45, 0);
  place(group, box(1.2, 0.9, 0.6, m.trim), ARENA_HALF_WIDTH + 1.5, 0.45, 0);
}

function buildTradingFloor(group: THREE.Group, style: ArenaStyle, m: ArenaMaterials): void {
  for (let i = 0; i < PROP_COUNT; i += 1) {
    const x = -ARENA_HALF_WIDTH + i * PROP_SPACING;
    const color = i % 2 === 0 ? style.trim : style.accent;
    place(group, box(1.8, 1, 0.1, m.glow(color)), x, 3 + (i % 2) * 1.2, BACK_Z - 0.6);
  }
  place(group, box(WALL_WIDTH, 0.35, 0.1, m.glow(style.trim)), 0, 1.4, BACK_Z - 0.6);
  for (const side of [-1, 1]) place(group, box(1.6, 1, 1, m.edge), side * (ARENA_HALF_WIDTH + 1.8), 0.5, -1);
}

function buildMuseum(group: THREE.Group, _style: ArenaStyle, m: ArenaMaterials): void {
  addPanelling(group, m, GALLERY_PANEL_HEIGHT);
  const column = new THREE.CylinderGeometry(0.35, 0.4, WALL_HEIGHT - 1, 12);
  for (let i = 0; i < PROP_COUNT; i += 1) {
    const x = -ARENA_HALF_WIDTH + i * PROP_SPACING;
    const c = new THREE.Mesh(column, m.accent);
    c.position.set(x, (WALL_HEIGHT - 1) / 2, BACK_Z + 0.4);
    c.castShadow = true;
    group.add(c);
    if (i < PROP_COUNT - 1) {
      place(group, box(1.4, 1.8, 0.1, m.trim), x + PROP_SPACING / 2, 3.2, BACK_Z - 0.7);
      place(group, box(1.1, 1.5, 0.12, m.canvas), x + PROP_SPACING / 2, 3.2, BACK_Z - 0.66);
    }
  }
}

/** A talk-show set: a red carpet down the middle, glowing backdrop panels and stage lights on stands. */
function buildStudio(group: THREE.Group, style: ArenaStyle, m: ArenaMaterials): void {
  place(group, box(CARPET_WIDTH, 0.02, ARENA_HALF_DEPTH * 2, m.accent), 0, 0.005, 0);
  for (let i = 0; i < PROP_COUNT; i += 1) {
    const x = -ARENA_HALF_WIDTH + i * PROP_SPACING;
    place(group, box(1.5, 2.4, 0.1, m.glow(i % 2 === 0 ? style.trim : style.wall)), x, 2.6, BACK_Z - 0.6);
  }
  for (const side of [-1, 1]) {
    place(group, box(0.12, 3, 0.12, m.dark), side * (ARENA_HALF_WIDTH + 1.4), 1.5, -2);
    place(group, box(0.7, 0.5, 0.5, m.glow(style.trim)), side * (ARENA_HALF_WIDTH + 1.4), 3.1, -2);
  }
}

/** An open platform: a thick slab with a painted edge line and a city skyline around and below it, and no walls. */
function buildRooftop(group: THREE.Group, style: ArenaStyle, m: ArenaMaterials): void {
  place(group, box(ARENA_HALF_WIDTH * 2, ROOF_SLAB, ARENA_HALF_DEPTH * 2, m.floor), 0, -ROOF_SLAB / 2, 0);
  for (const side of [-1, 1]) {
    place(group, box(ARENA_HALF_WIDTH * 2, 0.02, EDGE_LINE, m.edge), 0, 0.005, side * (ARENA_HALF_DEPTH - EDGE_LINE / 2));
    place(group, box(EDGE_LINE, 0.02, ARENA_HALF_DEPTH * 2, m.edge), side * (ARENA_HALF_WIDTH - EDGE_LINE / 2), 0.005, 0);
  }
  for (let i = 0; i < SKYLINE_COUNT; i += 1) {
    const angle = Math.PI + (i / (SKYLINE_COUNT - 1) - 0.5) * SKYLINE_SPREAD;
    const top = SKYLINE_MIN_TOP + ((i * 7) % SKYLINE_COUNT) / SKYLINE_COUNT * SKYLINE_TOP_RANGE;
    const x = Math.sin(angle) * SKYLINE_RADIUS;
    const z = Math.cos(angle) * SKYLINE_RADIUS;
    place(group, box(BUILDING_WIDTH, BUILDING_HEIGHT, BUILDING_WIDTH, i % 2 === 0 ? m.wall : m.accent), x, top - BUILDING_HEIGHT / 2, z);
    place(group, box(BUILDING_WIDTH * 0.7, 0.3, 0.05, m.glow(style.trim)), x, top - 1.5, z + BUILDING_WIDTH / 2 + 0.03);
  }
}

const BUILDERS: Readonly<Record<ArenaKind, (group: THREE.Group, style: ArenaStyle, m: ArenaMaterials) => void>> = {
  [ArenaKind.Parliament]: buildParliament,
  [ArenaKind.TradingFloor]: buildTradingFloor,
  [ArenaKind.Museum]: buildMuseum,
  [ArenaKind.Studio]: buildStudio,
  [ArenaKind.Rooftop]: buildRooftop,
};

export function buildArena(kind: ArenaKind): THREE.Group {
  const group = new THREE.Group();
  const style = ARENA_STYLES[kind];
  const materials = arenaMaterials(style);
  if (!arenaHasRingOuts(kind)) buildFloor(group, materials);
  BUILDERS[kind](group, style, materials);
  return group;
}

/** Frees the arena's geometries, its shared materials and the floor pattern texture, each once. */
export function disposeArena(group: THREE.Group): void {
  const materials = new Set<THREE.Material>();
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      materials.add(o.material as THREE.Material);
    }
  });
  for (const material of materials) {
    (material as THREE.MeshStandardMaterial).map?.dispose();
    material.dispose();
  }
}
