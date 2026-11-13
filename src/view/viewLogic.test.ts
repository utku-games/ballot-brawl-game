/**
 * Tests for the pure view logic: poses follow move frame data, the head spring settles, and framing fits everyone.
 * A punch must be fully extended exactly on its active frames, and knockouts must end lying down.
 * Portrait screens must push the camera back compared with landscape ones.
 */
import { describe, expect, it } from 'vitest';
import { ActionKind } from '../fight/fightTypes';
import { MoveKind, MOVES } from '../fight/moves';
import { FinisherStyle, Gesture } from '../roster/signatureTypes';
import { frameFighters, MAX_DISTANCE, MIN_DISTANCE } from './cameraFraming';
import { RESTING_SPRING, kickSpring, stepSpring } from './headSpring';
import { gesturePose } from './gesturePoses';
import { attackPhase, computePose, KO_FALL_SECONDS, koFall, Mood, SKIRT_FOLD, skirtFold } from './poseLogic';

const BASE = {
  frame: 0, duration: 0, move: null, moving: false, time: 0, mood: Mood.None, koSeconds: -1,
  style: FinisherStyle.Smash, gesture: Gesture.Cheer, intro: false,
};

describe('computePose', () => {
  it('extends the punching arm on the active frames', () => {
    const active = MOVES[MoveKind.Punch].startup;
    const pose = computePose({ ...BASE, kind: ActionKind.Attack, move: MoveKind.Punch, frame: active });
    const wind = computePose({ ...BASE, kind: ActionKind.Attack, move: MoveKind.Punch, frame: 1 });
    expect(attackPhase(MOVES[MoveKind.Punch], active).phase).toBe('active');
    expect(pose.armR).toBeGreaterThan(wind.armR);
  });

  it('raises both arms when defending and lies down when knocked out', () => {
    expect(computePose({ ...BASE, kind: ActionKind.Defend }).armL).toBeGreaterThan(1);
    expect(computePose({ ...BASE, kind: ActionKind.KnockedOut, koSeconds: 2 }).fall).toBe(1);
  });

  it('falls over time after a knockout even though the action frame never advances', () => {
    expect(koFall(-1).fall).toBe(0);
    expect(koFall(KO_FALL_SECONDS / 2).fall).toBeGreaterThan(0);
    expect(koFall(KO_FALL_SECONDS / 2).fall).toBeLessThan(1);
    expect(computePose({ ...BASE, kind: ActionKind.KnockedOut, frame: 0, koSeconds: KO_FALL_SECONDS * 3 }).fall).toBe(1);
  });

  it('celebrates a win with raised arms and slumps a loss', () => {
    expect(computePose({ ...BASE, kind: ActionKind.Idle, mood: Mood.Win }).armL).toBeGreaterThan(2);
    expect(computePose({ ...BASE, kind: ActionKind.Idle, mood: Mood.Lose }).lean).toBeGreaterThan(0.3);
    expect(computePose({ ...BASE, kind: ActionKind.KnockedOut, mood: Mood.Win, koSeconds: 5 }).fall).toBe(1);
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

describe('skirtFold', () => {
  it('leaves a standing skirt alone', () => {
    expect(skirtFold(0, 0.6)).toEqual({ scale: 1, lift: 0 });
  });

  it('folds a fallen skirt flat so its hem stays near the floor', () => {
    const r = 0.7;
    const fold = skirtFold(1, r);
    expect(fold.scale).toBeCloseTo(SKIRT_FOLD, 6);
    expect(fold.lift - r * fold.scale).toBeGreaterThan(-r * SKIRT_FOLD);
    expect(fold.lift - r * fold.scale).toBeCloseTo(-r * SKIRT_FOLD / 2, 6);
  });

  it('clamps the fall amount', () => {
    expect(skirtFold(2, 0.5)).toEqual(skirtFold(1, 0.5));
    expect(skirtFold(-1, 0.5)).toEqual(skirtFold(0, 0.5));
  });
});

describe('gestures', () => {
  it('gives every gesture a finite pose that differs from standing', () => {
    for (const g of Object.values(Gesture)) {
      for (const t of [0, 0.4, 1.3]) {
        const pose = gesturePose(g, t);
        expect(Object.values(pose).every(Number.isFinite), g).toBe(true);
      }
      const pose = gesturePose(g, 0.4);
      const standing = computePose({ ...BASE, kind: ActionKind.Idle });
      expect(pose.armL !== standing.armL || pose.armR !== standing.armR || pose.lean !== standing.lean, g).toBe(true);
    }
  });

  it('raises one arm for the V sign and holds both hands in front for the diamond', () => {
    const v = gesturePose(Gesture.VSign, 0.5);
    expect(v.armR).toBeGreaterThan(2.5);
    expect(v.armL).toBeLessThan(0.5);
    const d = gesturePose(Gesture.Diamond, 0.5);
    expect(d.armL).toBeGreaterThan(0.6);
    expect(d.armL).toBeLessThan(1.4);
    expect(d.armR).toBeCloseTo(d.armL, 6);
  });

  it('plays the gesture for taunts, the intro and wins', () => {
    const v = gesturePose(Gesture.VSign, 0.5);
    expect(computePose({ ...BASE, gesture: Gesture.VSign, kind: ActionKind.Taunt, frame: 30 }).armR).toBeCloseTo(v.armR, 6);
    expect(computePose({ ...BASE, gesture: Gesture.VSign, kind: ActionKind.Idle, intro: true, time: 0.5 }).armR).toBeCloseTo(v.armR, 6);
    expect(computePose({ ...BASE, gesture: Gesture.VSign, kind: ActionKind.Idle, mood: Mood.Win, time: 0.5 }).armR).toBeCloseTo(v.armR, 6);
  });

  it('animates each finisher style differently', () => {
    const at = (style: FinisherStyle): number => computePose({ ...BASE, style, kind: ActionKind.Attack, move: MoveKind.Finisher, frame: 8 }).armR;
    const values = new Set(Object.values(FinisherStyle).map(at));
    expect(values.size).toBe(Object.values(FinisherStyle).length);
  });
});
