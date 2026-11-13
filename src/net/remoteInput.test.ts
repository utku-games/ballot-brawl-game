/**
 * Tests for the host's buffer of guest controls.
 * A press survives until one tick takes it, even when later frames have no press; held values follow the latest frame.
 * Swap and pause never pass through, since online fights have no teammates and never pause.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_FRAME } from '../input/controlFrame';
import { RemoteInput } from './remoteInput';

describe('remote input', () => {
  it('is idle before any frame', () => {
    expect(new RemoteInput().take()).toEqual(EMPTY_FRAME);
  });

  it('keeps a press for exactly one tick', () => {
    const r = new RemoteInput();
    r.push({ ...EMPTY_FRAME, punch: true });
    r.push({ ...EMPTY_FRAME });
    expect(r.take().punch).toBe(true);
    expect(r.take().punch).toBe(false);
  });

  it('follows the latest stick and defend', () => {
    const r = new RemoteInput();
    r.push({ ...EMPTY_FRAME, moveX: 1, defend: true });
    r.push({ ...EMPTY_FRAME, moveX: -0.5, defend: false });
    const f = r.take();
    expect(f.moveX).toBe(-0.5);
    expect(f.defend).toBe(false);
    expect(r.take().moveX).toBe(-0.5);
  });

  it('drops swap and pause', () => {
    const r = new RemoteInput();
    r.push({ ...EMPTY_FRAME, swap: true, pause: true });
    const f = r.take();
    expect(f.swap).toBe(false);
    expect(f.pause).toBe(false);
  });
});
