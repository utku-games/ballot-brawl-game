/**
 * Shared building blocks for the arena scenery: the arena's back-wall and floor dimensions, its one shared material set, and box placement helpers.
 * Materials come from the engine's surface presets named in the arena style, plus fixed looks for trim, screens, panelling and lamps.
 * Used by the arena builder and the set dressing, so both draw from the same materials and stay cheap on phones.
 */
import * as THREE from 'three';
import { createSurfaceMaterial } from '@utku/engine';
import { ARENA_HALF_DEPTH, ARENA_HALF_WIDTH } from '../core/arena';
import type { ArenaStyle, SurfaceSpec } from './arenaKinds';
import { floorTexture } from './floorTextures';

export const FLOOR_THICKNESS = 0.3;
/** Z of the back of the set, behind the fighting floor; the back wall stands 1 m behind it. */
export const BACK_Z = -ARENA_HALF_DEPTH - 3;
export const WALL_HEIGHT = 7;
export const WALL_WIDTH = ARENA_HALF_WIDTH * 2 + 12;

/**
 * Screens, tickers and stage lights only emit: a black, fully matte, non-reflective base, so no sky or sun reflection
 * washes their colour toward white, and an emissive strength under the game's bloom threshold (1.6) keeps them saturated.
 */
const SCREEN_GLOW = 1;
const SCREEN_ROUGHNESS = 1;
const NO_REFLECTION = 0;
/** Brushed gold: rough enough that the sun's reflection on the trim spreads out instead of blooming into a hotspot. */
const TRIM_ROUGHNESS = 0.75;
/** The picture inside a gallery frame. */
const CANVAS_COLOR = 0x3a3a52;
const BLACK = 0x000000;
/** Dark varnished wood for panelling and the Speaker's chair. */
const PANEL_WOOD = 0x4a2e1c;
/** Warm lamp bulbs bloom softly: above the game's bloom threshold (1.6). */
const LAMP_COLOR = 0xffd9a0;
const LAMP_GLOW = 2.2;

/** The shared materials of one arena, built from its style. */
export interface ArenaMaterials {
  floor: THREE.Material;
  edge: THREE.Material;
  wall: THREE.Material;
  trim: THREE.Material;
  accent: THREE.Material;
  canvas: THREE.Material;
  dark: THREE.Material;
  /** Dark varnished wood for panelling and furniture. */
  panel: THREE.Material;
  /** Warm glowing lamp bulbs. */
  lamp: THREE.Material;
  glow: (color: number) => THREE.Material;
}

function surface(spec: SurfaceSpec, color: number): THREE.MeshStandardMaterial {
  return createSurfaceMaterial(spec.preset, { ...spec.tweaks, color });
}

export function arenaMaterials(style: ArenaStyle): ArenaMaterials {
  const floor = surface(style.surfaces.floor, style.floor);
  floor.map = floorTexture(style.floorPattern, ARENA_HALF_WIDTH * 2, ARENA_HALF_DEPTH * 2, style.floorTile);
  const glows = new Map<number, THREE.Material>();
  return {
    floor,
    edge: surface(style.surfaces.floor, style.floorEdge),
    wall: surface(style.surfaces.wall, style.wall),
    trim: createSurfaceMaterial('metal', { color: style.trim, roughness: TRIM_ROUGHNESS }),
    accent: surface(style.surfaces.accent, style.accent),
    canvas: createSurfaceMaterial('fabric', { color: CANVAS_COLOR }),
    dark: createSurfaceMaterial('rubber', { color: BLACK }),
    panel: createSurfaceMaterial('wood', { color: PANEL_WOOD }),
    lamp: createSurfaceMaterial('glow', { color: LAMP_COLOR, emissiveIntensity: LAMP_GLOW }),
    glow: (color) => {
      let m = glows.get(color);
      if (!m) {
        const screen = createSurfaceMaterial('glow', { color, emissiveIntensity: SCREEN_GLOW, roughness: SCREEN_ROUGHNESS, envMapIntensity: NO_REFLECTION });
        screen.color.setHex(BLACK);
        glows.set(color, (m = screen));
      }
      return m;
    },
  };
}

export function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.receiveShadow = true;
  return m;
}

export function place(group: THREE.Group, mesh: THREE.Mesh, x: number, y: number, z: number): THREE.Mesh {
  mesh.position.set(x, y, z);
  group.add(mesh);
  return mesh;
}

