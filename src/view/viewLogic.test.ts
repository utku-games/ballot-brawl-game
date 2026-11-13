/**
 * Tests for the pure view logic: poses follow move frame data, the head spring settles, and framing fits everyone.
 * A punch must be fully extended exactly on its active frames, and knockouts must end lying down.
 * Portrait screens must push the camera back compared with landscape ones.
 */
import { describe, expect, it } from 'vitest';
import { ActionKind } from '../fight/fightTypes';
import { MoveKind, MOVES } from '../fight/moves';
import { frameFighters, MAX_DISTANCE, MIN_DISTANCE } from './cameraFraming';
import { RESTING_SPRING, kickSpring, stepSpring } from './headSpring';
import { attackPhase, computePose } from './poseLogic';

const BASE = { frame: 0, duration: 0, move: null, moving: false, time: 0 };

describe('computePose', () => {
  it('extends the punching arm on the active frames', () => {
    const active = MOVES[MoveKind.Punch].startup;
    const pose = computePose({ ...BASE, kind: ActionKind.Attack, move: MoveKind.Punch, frame: active });
    const wind = computePose({ ...BASE, kind: ActionKind.Attack, move: MoveKind.Punch, frame: 1 });
    expect(attackPhase(MoveKind.Punch, active).phase).toBe('active');
    expect(pose.armR).toBeGreaterThan(wind.armR);
  });

  it('raises both arms when defending and lies down when knocked out', () => {
    expect(computePose({ ...BASE, kind: ActionKind.Defend }).armL).toBeGreaterThan(1);
    expect(computePose({ ...BASE, kind: ActionKind.KnockedOut, frame: 100 }).fall).toBe(1);
  });

  it('falls and gets back up during a knockdown', () => {
    const duration = 45;
    expect(computePose({ ...BASE, kind: ActionKind.Knockdown, frame: 20, duration }).fall).toBe(1);
    expect(computePose({ ...BASE, kind: ActionKind.Knockdown, frame: duration, duration }).fall).toBe(0);
  });
});

describe('head spring', () => {
  it('wobbles then settles back upright', () => {
    let s = kickSpring(RESTING_SPRING, 3, 0);
    s = stepSpring(s, 0.05);
    expect(Math.abs(s.x)).toBeGreaterThan(0);
    for (let i = 0; i < 300; i += 1) s = stepSpring(s, 1 / 60);
    expect(Math.abs(s.x)).toBeLessThan(0.001);
  });
});

describe('frameFighters', () => {
  const fov = Math.PI / 4;
  it('centres on the fighters and clamps the distance', () => {
    const f = frameFighters({ points: [{ x: -2, z: 0 }, { x: 4, z: 0 }], aspect: 16 / 9, fovY: fov });
    expect(f.targetX).toBe(1);
    expect(f.distance).toBeGreaterThanOrEqual(MIN_DISTANCE);
    expect(frameFighters({ points: [{ x: -100, z: 0 }, { x: 100, z: 0 }], aspect: 1, fovY: fov }).distance).toBe(MAX_DISTANCE);
  });

  it('pulls back further on a portrait screen', () => {
    const points = [{ x: -6, z: 0 }, { x: 6, z: 0 }];
    const wide = frameFighters({ points, aspect: 16 / 9, fovY: fov }).distance;
    const tall = frameFighters({ points, aspect: 9 / 16, fovY: fov }).distance;
    expect(tall).toBeGreaterThan(wide);
  });
});
