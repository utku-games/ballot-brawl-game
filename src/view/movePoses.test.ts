/**
 * Tests the directional move poses: every move starts near the standing pose, flips and spins complete their turn by the end of the active frames, and lunges lean into the strike.
 * Frames come from the move frame data, so the poses stay in step with the simulation.
 * Pure numbers; no rig or Three.js.
 */
import { describe, expect, it } from 'vitest';
import { DIRECTIONAL_MOVES, MoveKind, type DirectionalMove } from '../fight/moves';
import { directionalPose, isDirectionalMove } from './movePoses';

const MOVES = Object.keys(DIRECTIONAL_MOVES) as DirectionalMove[];
const strikeFrame = (m: DirectionalMove): number => DIRECTIONAL_MOVES[m].startup;
const endOfActive = (m: DirectionalMove): number => DIRECTIONAL_MOVES[m].startup + DIRECTIONAL_MOVES[m].active;

describe('directionalPose', () => {
  it('knows exactly the directional moves', () => {
    for (const m of MOVES) expect(isDirectionalMove(m)).toBe(true);
    expect(isDirectionalMove(MoveKind.Punch)).toBe(false);
  });

  it.each(MOVES)('%s starts close to standing', (m) => {
    const p = directionalPose(m, 0);
    expect(Math.abs(p.flip)).toBeLessThan(0.01);
    expect(Math.abs(p.bob)).toBeLessThan(0.01);
  });

  it('completes the backflip and the spins by the end of the active frames', () => {
    expect(directionalPose(MoveKind.BackflipKick, endOfActive(MoveKind.BackflipKick)).flip).toBeCloseTo(-Math.PI * 2);
    expect(directionalPose(MoveKind.SpinKick, endOfActive(MoveKind.SpinKick)).spin).toBeCloseTo(Math.PI * 2);
    expect(directionalPose(MoveKind.SpinningBackfist, endOfActive(MoveKind.SpinningBackfist)).spin).toBeCloseTo(Math.PI * 2);
  });

  it('leans into the charge moves and lies back for the bicycle kick', () => {
    expect(directionalPose(MoveKind.FlyingPunch, strikeFrame(MoveKind.FlyingPunch)).lean).toBeGreaterThan(0.5);
    expect(directionalPose(MoveKind.Headbutt, strikeFrame(MoveKind.Headbutt)).lean).toBeGreaterThan(0.5);
    expect(directionalPose(MoveKind.BicycleKick, strikeFrame(MoveKind.BicycleKick)).flip).toBeLessThan(-1);
  });
});
