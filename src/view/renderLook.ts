/**
 * The game's render look on top of the engine defaults: arena-sized soft shadows, a gentle colour grade, a higher bloom
 * threshold and a fighter rim light.
 * useArenaEnvironment points the sun at the arena centre after each environment change, so the light comes from the
 * arena's own sunDirection and fighters cast shadows. Every value is a named constant, so the look is tuned in one place.
 */
import type { ColorGrade, GameRenderer, RenderEnvironment, RimLight } from '@utku/engine';
import { NEUTRAL_GRADE, addRimLight } from '@utku/engine';
import type * as THREE from 'three';
import { ARENA_HALF_WIDTH } from '../core/arena';

const ARENA_CENTER = { x: 0, y: 0, z: 0 };
/** Shadows cover the floor plus room for fighters knocked past the edge, at four times the engine's default detail. */
const SHADOW_EDGE_MARGIN = 6;
export const SHADOW_HALF_EXTENT = ARENA_HALF_WIDTH + SHADOW_EDGE_MARGIN;
/** Shadow blur radius in shadow-map texels: soft edges without losing the contact shape under the feet. */
export const SHADOW_SOFTNESS = 2.5;

/** A little more colour and punch, with darkened corners that frame the fight. */
export const ARENA_GRADE: ColorGrade = {
  ...NEUTRAL_GRADE,
  saturation: 1.1,
  contrast: 1.06,
  vignette: 0.3,
  vignetteSoftness: 0.6,
};

/**
 * Only clearly bright things glow: with the sun now reaching the floor, white walls, columns and statues sit just
 * above the engine's default threshold and would bloom into a haze.
 */
export const BLOOM_THRESHOLD = 1.6;

/** A faint white edge light so dark suits stand out against the dark arena backdrops. */
export const FIGHTER_RIM: RimLight = { color: 0xffffff, strength: 0.35, power: 3 };

/** Applies the shadow and colour settings; call once after creating the renderer. */
export function applyRenderLook(view: GameRenderer): void {
  view.setShadows({ softness: SHADOW_SOFTNESS, halfExtent: SHADOW_HALF_EXTENT });
  view.setColorGrade(ARENA_GRADE);
  view.setBloom({ threshold: BLOOM_THRESHOLD });
}

/** Switches to an arena's lighting and aims the sun at the arena centre from the arena's sun direction. */
export function useArenaEnvironment(view: GameRenderer, environment: RenderEnvironment): void {
  view.setEnvironment(environment);
  view.setShadowFocus(ARENA_CENTER);
}

/** Adds the fighter rim light to one material (idempotent per material). */
export function addFighterRim(material: THREE.MeshStandardMaterial): void {
  addRimLight(material, FIGHTER_RIM);
}
