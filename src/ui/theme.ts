/**
 * Visual theme shared by every DOM screen: colours, fonts and the player and team accent colours.
 * Values match the 3D view's team rings so a fighter's HUD bar and floor ring always agree.
 * CSS reads them through custom properties set once on the document root.
 */
import { PlayerId } from '../input/controlFrame';

export const THEME = {
  ink: '#ffffff',
  inkSoft: 'rgba(255,255,255,0.75)',
  panel: 'rgba(16,14,40,0.82)',
  panelEdge: 'rgba(255,255,255,0.18)',
  backdrop: '#14122b',
  gold: '#ffd23a',
  teamA: '#3a8dff',
  teamB: '#ff4a4a',
  health: '#52e07a',
  healthLow: '#ff5a3a',
  meter: '#ffd23a',
  guard: '#6ac8ff',
  font: "'Bungee', 'Arial Black', system-ui, sans-serif",
  bodyFont: "system-ui, -apple-system, 'Segoe UI', sans-serif",
} as const;

/** Marker colour of each local player (CSS and 0xRRGGBB for Three.js). */
export const PLAYER_COLORS: Readonly<Record<PlayerId, { css: string; hex: number; label: string }>> = {
  [PlayerId.One]: { css: '#ffd23a', hex: 0xffd23a, label: 'P1' },
  [PlayerId.Two]: { css: '#50e080', hex: 0x50e080, label: 'P2' },
};
