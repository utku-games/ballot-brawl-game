/**
 * Set dressing that makes the indoor arenas read as real rooms: a carved Speaker's chair, wood panelling with a gold rail, tall bright windows and glowing wall lamps.
 * Every piece is a few boxes, cylinders and spheres in the arena's shared materials, placed against the back wall at BACK_Z.
 * Pure placement on a Three.js group; the arena builder decides which arenas get which pieces.
 */
import * as THREE from 'three';
import { BACK_Z, WALL_WIDTH, box, place, type ArenaMaterials } from './arenaKit';

/** Front face of the back wall: the wall box is 0.5 m deep and centred 1 m behind BACK_Z. */
const WALL_FACE_Z = BACK_Z - 0.75;
const PANEL_DEPTH = 0.06;
const STILE_WIDTH = 0.08;
const STILE_SPACING = 1.6;
const RAIL_HEIGHT = 0.08;
const WINDOW_WIDTH = 1.3;
const WINDOW_HEIGHT = 2.6;
const WINDOW_BOTTOM = 3;
const MULLION = 0.07;
/** Pale daylight through the windows: an emitter like the screens, not a blooming lamp. */
const DAYLIGHT = 0xfff1cc;
const SCONCE_HEIGHT = 4.3;
const BULB_RADIUS = 0.13;
const BULB_SEGMENTS = 12;
const HALF = 2;

/** A band of panelling along the back wall up to `height`, with vertical stiles and a gold rail on top. */
export function addPanelling(group: THREE.Group, m: ArenaMaterials, height: number): void {
  place(group, box(WALL_WIDTH, height, PANEL_DEPTH, m.panel), 0, height / HALF, WALL_FACE_Z + PANEL_DEPTH / HALF);
  const count = Math.floor(WALL_WIDTH / STILE_SPACING);
  for (let i = 0; i <= count; i += 1) {
    const x = -WALL_WIDTH / HALF + i * STILE_SPACING;
    place(group, box(STILE_WIDTH, height, PANEL_DEPTH, m.edge), x, height / HALF, WALL_FACE_Z + PANEL_DEPTH * 1.5);
  }
  place(group, box(WALL_WIDTH, RAIL_HEIGHT, PANEL_DEPTH * HALF, m.trim), 0, height, WALL_FACE_Z + PANEL_DEPTH);
}

/** Tall windows at the given x positions: a glowing pane, a centre mullion and a transom, framed in trim. */
export function addWindows(group: THREE.Group, m: ArenaMaterials, xs: readonly number[]): void {
  const y = WINDOW_BOTTOM + WINDOW_HEIGHT / HALF;
  for (const x of xs) {
    place(group, box(WINDOW_WIDTH + MULLION * HALF, WINDOW_HEIGHT + MULLION * HALF, PANEL_DEPTH, m.trim), x, y, WALL_FACE_Z + PANEL_DEPTH / HALF);
    place(group, box(WINDOW_WIDTH, WINDOW_HEIGHT, PANEL_DEPTH, m.glow(DAYLIGHT)), x, y, WALL_FACE_Z + PANEL_DEPTH);
    place(group, box(MULLION, WINDOW_HEIGHT, PANEL_DEPTH, m.panel), x, y, WALL_FACE_Z + PANEL_DEPTH * HALF);
    place(group, box(WINDOW_WIDTH, MULLION, PANEL_DEPTH, m.panel), x, y + WINDOW_HEIGHT / 6, WALL_FACE_Z + PANEL_DEPTH * HALF);
  }
}

/** Brass wall lamps with glowing bulbs at the given x positions. */
export function addSconces(group: THREE.Group, m: ArenaMaterials, xs: readonly number[]): void {
  const bulb = new THREE.SphereGeometry(BULB_RADIUS, BULB_SEGMENTS, BULB_SEGMENTS);
  for (const x of xs) {
    place(group, box(0.08, 0.35, 0.08, m.trim), x, SCONCE_HEIGHT - 0.1, WALL_FACE_Z + 0.06);
    place(group, box(0.06, 0.06, 0.28, m.trim), x, SCONCE_HEIGHT, WALL_FACE_Z + 0.16);
    const light = new THREE.Mesh(bulb, m.lamp);
    light.position.set(x, SCONCE_HEIGHT + BULB_RADIUS, WALL_FACE_Z + 0.3);
    group.add(light);
  }
}

/** The Speaker's chair: a plinth, a high carved back with a cushioned panel, arms and a canopy with a gold crest. */
export function addSpeakerChair(group: THREE.Group, m: ArenaMaterials, x: number, z: number): void {
  place(group, box(2, 0.4, 1.5, m.panel), x, 0.2, z);
  place(group, box(1.3, 0.55, 1, m.panel), x, 0.68, z + 0.05);
  place(group, box(1.15, 0.12, 0.9, m.accent), x, 1.01, z + 0.08);
  place(group, box(1.5, 2.7, 0.25, m.panel), x, 1.75, z - 0.42).castShadow = true;
  place(group, box(1.05, 1.6, 0.08, m.accent), x, 1.85, z - 0.27);
  for (const side of [-1, 1]) {
    place(group, box(0.16, 0.5, 0.95, m.panel), x + side * 0.72, 1.2, z + 0.05);
    place(group, box(0.2, 0.08, 1, m.trim), x + side * 0.72, 1.47, z + 0.05);
  }
  place(group, box(1.8, 0.22, 0.9, m.panel), x, 3.2, z - 0.15);
  place(group, box(1.9, 0.07, 0.95, m.trim), x, 3.07, z - 0.15);
  const crest = new THREE.Mesh(new THREE.SphereGeometry(0.2, BULB_SEGMENTS, BULB_SEGMENTS), m.trim);
  crest.position.set(x, 3.5, z - 0.15);
  crest.castShadow = true;
  group.add(crest);
}
