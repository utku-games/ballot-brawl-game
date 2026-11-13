/**
 * Ballot Brawl's audio front end: wraps the engine SynthAudio, plays named sound effects, and maps fight events to sounds.
 * The audio context is unlocked on the first user gesture, as browsers require, and a mute flag silences everything.
 * Only the sound choices live here; synthesis and mixing stay in the engine.
 */
import { SynthAudio } from '@utku/engine';
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

export class GameAudio {
  private readonly synth = new SynthAudio();
  muted = false;

  unlock(): void {
    void this.synth.unlock();
  }

  play(sfx: Sfx): void {
    if (!this.muted) this.synth.playLayers(SFX[sfx], SFX_VOLUME);
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
