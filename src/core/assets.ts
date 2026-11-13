/**
 * URLs of static assets served from the public folder, resolved against Vite's base path.
 * Both the 3D view (face textures) and the DOM UI (portraits in menus and the HUD) need the same face URLs.
 * Keeping the rule here lets lower layers share it without importing Three.js.
 */

const FACE_FOLDER = 'faces';
const FACE_EXTENSION = 'webp';

export function faceUrl(fighterId: string): string {
  return `${import.meta.env.BASE_URL}${FACE_FOLDER}/${fighterId}.${FACE_EXTENSION}`;
}
