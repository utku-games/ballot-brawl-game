/**
 * Ballot Brawl's audio front end: wraps the engine SynthAudio, plays named sound effects, and maps fight events to sounds.
 * It also plays the soundtrack: a menu theme and one song per arena whose intensity follows the fight.
 * The audio context is unlocked on the first user gesture, as browsers require, and a mute flag silences everything.
 * Only the sound choices live here; synthesis and mixing stay in the engine.
 */
import { MusicIntensity, SynthAudio } from '@utku/engine';
import type { Track } from './songs';
import type { FightEvent } from '../fight/fightTypes';
import { MoveKind } from '../fight/moves';
import { Sfx, SFX } from './sfxTable';

const SFX_VOLUME = 0.8;

const HIT_SOUND: Readonly<Record<MoveKind, Sfx>> = {
  [MoveKind.Punch]: Sfx.Punch,
  [MoveKind.Kick]: Sfx.Kick,
  [MoveKind.Finisher]: Sfx.FinisherHit,
  [MoveKind.Item]: Sfx.Kick,
};

const FULL_VOLUME = 1;
const SILENT = 0;
const MS_PER_SECOND = 1000;

export class GameAudio {
  private readonly synth = new SynthAudio();
  private muteState = false;
  private track: Readonly<Track> | null = null;
  private trackStart = 0;

  get muted(): boolean {
    return this.muteState;
  }

  /** Mutes or unmutes sound effects and music together. */
  set muted(value: boolean) {
    this.muteState = value;
    this.synth.setMasterVolume(value ? SILENT : FULL_VOLUME);
  }

  /** Starts a track from its beginning unless it is already playing. */
  playTrack(track: Readonly<Track>): void {
    if (this.track === track) return;
    this.track = track;
    this.trackStart = performance.now();
    this.synth.startSong(track.song, track.bpm, 0);
  }

  setIntensity(intensity: MusicIntensity): void {
    this.synth.setMusicIntensity(intensity);
  }

  /** Keeps the music on its beat; call once per frame. */
  update(): void {
    if (this.track) this.synth.syncMusic((performance.now() - this.trackStart) / MS_PER_SECOND);
  }

  unlock(): void {
    void this.synth.unlock();
  }

  play(sfx: Sfx): void {
    if (!this.muteState) this.synth.playLayers(SFX[sfx], SFX_VOLUME);
  }

  playEvents(events: readonly FightEvent[]): void {
    for (const e of events) {
      if (e.kind === 'swing') this.play(e.move === MoveKind.Finisher ? Sfx.FinisherCharge : Sfx.Swing);
      else if (e.kind === 'hit') this.play(HIT_SOUND[e.move]);
      else if (e.kind === 'block') this.play(Sfx.Block);
      else if (e.kind === 'guardBreak') this.play(Sfx.GuardBreak);
      else if (e.kind === 'ko') this.play(Sfx.Knockout);
      else if (e.kind === 'matchOver') this.play(Sfx.Bell);
      else if (e.kind === 'throw') this.play(Sfx.Throw);
      else if (e.kind === 'taunt') this.play(Sfx.Taunt);
      else if (e.kind === 'tauntDone') this.play(Sfx.PowerUp);
    }
  }
}
