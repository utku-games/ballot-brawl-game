/**
 * The soundtrack as data: a menu theme and one procedural song per arena, played by the engine's music sequencer.
 * Each song is four bars of chords, a bass rhythm, a lead line per bar and a drum pattern, in its own style.
 * Pure data plus the arena-to-song mapping, so the soundtrack can be checked without an audio device.
 */
import { ChordStyle, type Song, type Voice } from '@utku/engine';
import { ArenaKind } from '../view/arenaKinds';

/** A song and the tempo it plays at, in beats per minute. */
export interface Track {
  song: Song;
  bpm: number;
}

const _ = null;

const SQUARE_LEAD: Readonly<Voice> = { wave: 'square', gain: 0.07, lengthSteps: 1.6, detuneCents: 6 };
const SAW_LEAD: Readonly<Voice> = { wave: 'sawtooth', gain: 0.05, lengthSteps: 1.4, detuneCents: 10 };
const TRI_LEAD: Readonly<Voice> = { wave: 'triangle', gain: 0.1, lengthSteps: 2, detuneCents: 0 };
const SINE_BASS: Readonly<Voice> = { wave: 'sine', gain: 0.22, lengthSteps: 1.8, detuneCents: 0 };
const SAW_BASS: Readonly<Voice> = { wave: 'sawtooth', gain: 0.09, lengthSteps: 1.2, detuneCents: 4 };
const PAD: Readonly<Voice> = { wave: 'triangle', gain: 0.035, lengthSteps: 16, detuneCents: 8 };
const STAB: Readonly<Voice> = { wave: 'square', gain: 0.03, lengthSteps: 1, detuneCents: 5 };
const ARP: Readonly<Voice> = { wave: 'triangle', gain: 0.04, lengthSteps: 0.9, detuneCents: 0 };

const MARCH_DRUMS = { kick: 'x---x---x---x---', snare: '----x-------x-xx', hat: 'x-x-x-x-x-x-x-x-', openHat: '----------------' };
const DISCO_DRUMS = { kick: 'x---x---x---x---', snare: '----x-------x---', hat: '--x---x---x---x-', openHat: '--x---x---x---x-' };
const BREAK_DRUMS = { kick: 'x-----x-x-------', snare: '----x-------x---', hat: 'x-x-x-x-x-x-x-x-', openHat: '-------x-------x' };
const ROCK_DRUMS = { kick: 'x-x---x-x-x---x-', snare: '----x-------x---', hat: 'x-x-x-x-x-x-x-x-', openHat: '--------------x-' };
const SOFT_DRUMS = { kick: 'x-------x-------', snare: '--------x-------', hat: '----x-------x---', openHat: '----------------' };

const MENU: Readonly<Song> = {
  id: 'menu', title: 'Order of Business', rootMidi: 67,
  chords: [{ root: 0, minor: false }, { root: 5, minor: false }, { root: 7, minor: false }, { root: 0, minor: false }],
  chordStyle: ChordStyle.Stab,
  bass: [0, _, _, _, 7, _, _, _, 0, _, _, _, 7, _, 5, _],
  lead: [
    [0, _, 4, _, 7, _, 4, _, 12, _, _, _, 7, _, _, _],
    [5, _, 9, _, 12, _, 9, _, 5, _, _, _, 9, _, _, _],
    [7, _, 11, _, 14, _, 11, _, 7, _, 11, _, 14, _, 12, _],
    [12, _, 7, _, 4, _, 7, _, 0, _, _, _, _, _, _, _],
  ],
  drums: SOFT_DRUMS, bassVoice: SINE_BASS, leadVoice: SQUARE_LEAD, chordVoice: STAB,
};

const PARLIAMENT: Readonly<Song> = {
  id: 'parliament', title: 'Point of Order', rootMidi: 62,
  chords: [{ root: 0, minor: true }, { root: 8, minor: false }, { root: 3, minor: false }, { root: 7, minor: false }],
  chordStyle: ChordStyle.Stab,
  bass: [0, _, 0, _, 7, _, 0, _, 0, _, 0, _, 7, _, 5, _],
  lead: [
    [0, _, 3, 5, 7, _, 7, _, 8, _, 7, _, 5, _, 3, _],
    [8, _, 7, _, 5, _, 3, _, 5, _, 7, _, 8, _, _, _],
    [7, _, 3, _, 10, _, 7, _, 3, _, 5, _, 7, _, _, _],
    [7, _, 8, 7, 5, _, 2, _, 7, _, _, _, 11, _, _, _],
  ],
  drums: MARCH_DRUMS, bassVoice: SAW_BASS, leadVoice: SQUARE_LEAD, chordVoice: STAB,
};

const TRADING_FLOOR: Readonly<Song> = {
  id: 'trading-floor', title: 'Bull Run', rootMidi: 64,
  chords: [{ root: 0, minor: true }, { root: 5, minor: true }, { root: 10, minor: false }, { root: 3, minor: false }],
  chordStyle: ChordStyle.Arp,
  bass: [0, _, 0, 12, _, 0, _, 12, 0, _, 0, 12, _, 0, 10, _],
  lead: [
    [12, _, _, 10, _, 7, _, _, 12, _, 15, _, 14, _, 12, _],
    [17, _, _, 15, _, 12, _, _, 10, _, 12, _, 8, _, _, _],
    [10, _, _, 14, _, 17, _, _, 15, _, 14, _, 10, _, _, _],
    [15, _, 14, _, 12, _, 10, _, 7, _, _, _, 12, _, _, _],
  ],
  drums: BREAK_DRUMS, bassVoice: SAW_BASS, leadVoice: SAW_LEAD, chordVoice: ARP,
};

const MUSEUM: Readonly<Song> = {
  id: 'museum', title: 'Grand Gallery Waltz', rootMidi: 69,
  chords: [{ root: 0, minor: true }, { root: 5, minor: true }, { root: 7, minor: false }, { root: 0, minor: true }],
  chordStyle: ChordStyle.Arp,
  bass: [0, _, _, _, 7, _, _, _, 12, _, _, _, 7, _, _, _],
  lead: [
    [0, _, 2, 3, 5, _, 7, _, 8, _, 7, _, 5, _, 3, _],
    [5, _, 3, _, 2, _, 0, _, 3, _, 5, _, 8, _, _, _],
    [7, _, 11, _, 14, _, 11, _, 7, _, 5, _, 2, _, _, _],
    [3, _, 2, _, 0, _, _, _, -1, _, 0, _, _, _, _, _],
  ],
  drums: SOFT_DRUMS, bassVoice: SINE_BASS, leadVoice: TRI_LEAD, chordVoice: ARP,
};

const STUDIO: Readonly<Song> = {
  id: 'studio', title: 'Red Carpet', rootMidi: 65,
  chords: [{ root: 0, minor: false }, { root: 9, minor: true }, { root: 5, minor: false }, { root: 7, minor: false }],
  chordStyle: ChordStyle.Stab,
  bass: [0, _, 12, _, 0, _, 12, _, 0, _, 12, _, 10, _, 12, _],
  lead: [
    [7, _, 9, _, 12, _, _, 9, _, 7, _, 4, _, _, _, _],
    [9, _, 12, _, 16, _, _, 12, _, 9, _, 7, _, _, _, _],
    [5, _, 9, _, 12, _, 14, _, 12, _, 9, _, 5, _, _, _],
    [7, _, 11, _, 14, _, 12, _, 11, _, 7, _, 2, _, _, _],
  ],
  drums: DISCO_DRUMS, bassVoice: SAW_BASS, leadVoice: SQUARE_LEAD, chordVoice: STAB,
};

const ROOFTOP: Readonly<Song> = {
  id: 'rooftop', title: 'Edge of the Roof', rootMidi: 64,
  chords: [{ root: 0, minor: true }, { root: 10, minor: false }, { root: 8, minor: false }, { root: 7, minor: false }],
  chordStyle: ChordStyle.Pad,
  bass: [0, 0, _, 0, 0, _, 0, _, 0, 0, _, 0, 7, _, 10, _],
  lead: [
    [12, _, 12, _, 15, _, 12, _, 10, _, 12, _, _, _, 7, _],
    [10, _, 10, _, 14, _, 10, _, 9, _, 10, _, _, _, 5, _],
    [8, _, 8, _, 12, _, 8, _, 7, _, 8, _, _, _, 3, _],
    [7, _, 11, _, 14, _, 11, _, 19, _, _, _, 14, _, _, _],
  ],
  drums: ROCK_DRUMS, bassVoice: SAW_BASS, leadVoice: SAW_LEAD, chordVoice: PAD,
};

export const MENU_TRACK: Readonly<Track> = { song: MENU, bpm: 104 };

export const ARENA_TRACKS: Readonly<Record<ArenaKind, Readonly<Track>>> = {
  [ArenaKind.Parliament]: { song: PARLIAMENT, bpm: 120 },
  [ArenaKind.TradingFloor]: { song: TRADING_FLOOR, bpm: 128 },
  [ArenaKind.Museum]: { song: MUSEUM, bpm: 112 },
  [ArenaKind.Studio]: { song: STUDIO, bpm: 118 },
  [ArenaKind.Rooftop]: { song: ROOFTOP, bpm: 140 },
};

/** Every track, for checks. */
export const ALL_TRACKS: readonly Readonly<Track>[] = [MENU_TRACK, ...Object.values(ARENA_TRACKS)];

/** The step count every bar uses. */
export const STEPS_PER_BAR = 16;
