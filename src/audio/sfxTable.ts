/**
 * Synthesised sound effects for the brawl, described as engine SfxLayer lists: whooshes, thumps, clangs and the finisher boom.
 * Every sound is a few oscillator or filtered-noise layers, so the game ships no audio files.
 * Sound ids are an enum so the event-to-sound mapping is checked by the compiler.
 */
import type { SfxLayer } from '@utku/engine';

export enum Sfx {
  Swing = 'swing',
  Punch = 'punch',
  Kick = 'kick',
  Block = 'block',
  GuardBreak = 'guardBreak',
  FinisherCharge = 'finisherCharge',
  FinisherHit = 'finisherHit',
  Knockout = 'knockout',
  Bell = 'bell',
  MenuMove = 'menuMove',
  MenuSelect = 'menuSelect',
  Victory = 'victory',
}

/** Filter resonance of every noise layer. */
const NOISE_Q = 1;

function tone(type: OscillatorType, freq: number, freqEnd: number, start: number, duration: number, gain: number): SfxLayer {
  return { kind: 'tone', type, freq, freqEnd, start, duration, gain };
}

function noise(filter: BiquadFilterType, freq: number, start: number, duration: number, gain: number): SfxLayer {
  return { kind: 'noise', filter, freq, freqEnd: freq, q: NOISE_Q, start, duration, gain };
}

export const SFX: Readonly<Record<Sfx, readonly SfxLayer[]>> = {
  [Sfx.Swing]: [noise('bandpass', 1800, 0, 0.12, 0.15)],
  [Sfx.Punch]: [tone('sine', 160, 60, 0, 0.12, 0.6), noise('lowpass', 900, 0, 0.08, 0.35)],
  [Sfx.Kick]: [tone('sine', 120, 45, 0, 0.18, 0.75), noise('lowpass', 700, 0, 0.12, 0.45)],
  [Sfx.Block]: [tone('square', 900, 700, 0, 0.08, 0.15), tone('triangle', 1400, 1200, 0, 0.12, 0.12)],
  [Sfx.GuardBreak]: [tone('sawtooth', 600, 120, 0, 0.35, 0.25), noise('highpass', 2500, 0, 0.25, 0.2)],
  [Sfx.FinisherCharge]: [tone('sawtooth', 120, 600, 0, 0.35, 0.18), tone('sine', 240, 1200, 0, 0.35, 0.15)],
  [Sfx.FinisherHit]: [tone('sine', 90, 30, 0, 0.6, 0.9), noise('lowpass', 500, 0, 0.5, 0.6), tone('square', 220, 110, 0, 0.3, 0.12)],
  [Sfx.Knockout]: [tone('sine', 300, 80, 0, 0.5, 0.4), noise('lowpass', 400, 0.05, 0.4, 0.3)],
  [Sfx.Bell]: [tone('triangle', 1320, 1320, 0, 0.8, 0.25), tone('sine', 2640, 2640, 0, 0.6, 0.1)],
  [Sfx.MenuMove]: [tone('square', 660, 660, 0, 0.04, 0.06)],
  [Sfx.MenuSelect]: [tone('square', 880, 1320, 0, 0.09, 0.08)],
  [Sfx.Victory]: [
    tone('square', 523, 523, 0, 0.15, 0.12), tone('square', 659, 659, 0.15, 0.15, 0.12),
    tone('square', 784, 784, 0.3, 0.15, 0.12), tone('square', 1047, 1047, 0.45, 0.5, 0.14),
  ],
};
