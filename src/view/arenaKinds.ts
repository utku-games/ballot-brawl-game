/**
 * The arenas with their lighting environments and colour palettes: one per story category plus The Rooftop.
 * Parliament for politicians, a trading floor for tycoons, a museum hall for legends, a TV studio for celebrities, and
 * an open rooftop without walls, the only arena with ring-outs.
 * Kept as data so the arena builder and the menus share the same names and colours.
 */
import type { RenderEnvironment } from '@utku/engine';
import { Category } from '../roster/rosterTypes';

export enum ArenaKind {
  Parliament = 'parliament',
  TradingFloor = 'tradingFloor',
  Museum = 'museum',
  Studio = 'studio',
  /** An open platform with no walls: hard hits knock fighters off. */
  Rooftop = 'rooftop',
}

export interface ArenaStyle {
  label: string;
  floor: number;
  floorEdge: number;
  wall: number;
  trim: number;
  accent: number;
  environment: RenderEnvironment;
}

export const ARENA_FOR_CATEGORY: Readonly<Record<Category, ArenaKind>> = {
  [Category.Politicians]: ArenaKind.Parliament,
  [Category.Tycoons]: ArenaKind.TradingFloor,
  [Category.Legends]: ArenaKind.Museum,
  [Category.Celebrities]: ArenaKind.Studio,
  /** Specials have no story; Brawl picks its own arena. */
  [Category.Specials]: ArenaKind.Studio,
};

export const ARENA_ORDER: readonly ArenaKind[] = [ArenaKind.Parliament, ArenaKind.TradingFloor, ArenaKind.Museum, ArenaKind.Studio, ArenaKind.Rooftop];

/** True for arenas without walls, where fighters can be knocked off. */
export function arenaHasRingOuts(kind: ArenaKind): boolean {
  return kind === ArenaKind.Rooftop;
}

export const ARENA_STYLES: Readonly<Record<ArenaKind, ArenaStyle>> = {
  [ArenaKind.Parliament]: {
    label: 'The Chamber', floor: 0x7a5232, floorEdge: 0x4f3420, wall: 0x2e4a34, trim: 0xc9a45a, accent: 0x2f7d4a,
    environment: {
      skyTopColor: 0x1b2a22, skyBottomColor: 0x4d6b55, fogColor: 0x24382b, fogNear: 25, fogFar: 70,
      sunDirection: { x: -0.3, y: 1, z: 0.5 }, sunColor: 0xffe9c4, ambientColor: 0x9fb39f,
    },
  },
  [ArenaKind.TradingFloor]: {
    label: 'The Trading Floor', floor: 0x23262e, floorEdge: 0x15171c, wall: 0x101827, trim: 0x30d07a, accent: 0xe8b23a,
    environment: {
      skyTopColor: 0x060a14, skyBottomColor: 0x1d2a44, fogColor: 0x0b1222, fogNear: 25, fogFar: 70,
      sunDirection: { x: 0.4, y: 1, z: 0.6 }, sunColor: 0xd8e6ff, ambientColor: 0x7d8fb8,
    },
  },
  [ArenaKind.Studio]: {
    label: 'The Studio', floor: 0x1e1a24, floorEdge: 0x111014, wall: 0x6a2a8a, trim: 0xffc84a, accent: 0xb0182a,
    environment: {
      skyTopColor: 0x0a0812, skyBottomColor: 0x2a1a3a, fogColor: 0x120e1a, fogNear: 25, fogFar: 70,
      sunDirection: { x: 0.1, y: 1, z: 0.8 }, sunColor: 0xfff0e0, ambientColor: 0x9a88b8,
    },
  },
  [ArenaKind.Rooftop]: {
    label: 'The Rooftop', floor: 0x5a5e66, floorEdge: 0xffc84a, wall: 0x1c2233, trim: 0xffc84a, accent: 0x8a93a6,
    environment: {
      skyTopColor: 0x1a2a5a, skyBottomColor: 0xe88a5a, fogColor: 0x6a5a7a, fogNear: 30, fogFar: 90,
      sunDirection: { x: -0.6, y: 0.7, z: 0.4 }, sunColor: 0xffd0a0, ambientColor: 0xa090b0,
    },
  },
  [ArenaKind.Museum]: {
    label: 'The Grand Gallery', floor: 0xd9d3c4, floorEdge: 0xa89f8a, wall: 0x7a2e2e, trim: 0xd4af37, accent: 0xf2ece0,
    environment: {
      skyTopColor: 0x3a2020, skyBottomColor: 0x8a5a4a, fogColor: 0x4a2a28, fogNear: 25, fogFar: 70,
      sunDirection: { x: -0.2, y: 1, z: 0.7 }, sunColor: 0xfff2dc, ambientColor: 0xb8a898,
    },
  },
};
