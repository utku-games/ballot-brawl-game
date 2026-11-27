/**
 * Turns a procedural floor pattern into a repeating Three.js texture that multiplies an arena floor's colour.
 * One pattern tile covers `tileMeters` of floor, so planks and tiles keep a real-world size on any floor width.
 * The caller owns the texture and disposes it with the floor material.
 */
import * as THREE from 'three';
import { FloorPattern, PATTERN_SIZE, floorPatternPixels } from './floorPatterns';

const CHANNELS = 4;
const OPAQUE = 255;
const BYTE = 255;
/** Keeps the floor pattern crisp at the low camera angle. */
const ANISOTROPY = 8;

/** A repeating texture for the pattern over a floor `width` x `depth` meters, or null for a plain floor. */
export function floorTexture(pattern: FloorPattern, width: number, depth: number, tileMeters: number): THREE.DataTexture | null {
  if (pattern === FloorPattern.Plain) return null;
  const pixels = floorPatternPixels(pattern);
  const data = new Uint8Array(pixels.length * CHANNELS);
  pixels.forEach((value, i) => {
    const v = Math.round(value * BYTE);
    data.set([v, v, v, OPAQUE], i * CHANNELS);
  });
  const texture = new THREE.DataTexture(data, PATTERN_SIZE, PATTERN_SIZE, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(width / tileMeters, depth / tileMeters);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = ANISOTROPY;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
