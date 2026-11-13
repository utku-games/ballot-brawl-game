/**
 * Loads and caches the face photo texture of each fighter from public/faces.
 * Textures are shared by every model and menu preview that shows the same fighter, so each image is fetched once.
 * The URL respects Vite's base path so the game also works when served from a sub-folder.
 */
import * as THREE from 'three';
import { faceUrl } from '../core/assets';

const ANISOTROPY = 4;
const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();

export function faceTexture(fighterId: string): THREE.Texture {
  const cached = cache.get(fighterId);
  if (cached) return cached;
  const texture = loader.load(faceUrl(fighterId));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = ANISOTROPY;
  cache.set(fighterId, texture);
  return texture;
}
