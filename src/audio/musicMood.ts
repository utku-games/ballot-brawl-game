/**
 * Pure rule for how intense the fight music is: calm during the intro, driving during the fight, and peaking in the
 * last seconds or when any side is close to defeat.
 * The engine applies changes on the next bar, so calling this every frame is cheap and sounds musical.
 * It reads only the match state, so it is tested without audio.
 */
import { MusicIntensity } from '@utku/engine';
import { TICK_RATE } from '../fight/fightConstants';
import { MatchPhase, type MatchState } from '../fight/fightTypes';
import { teamHealthFraction } from '../fight/matchQueries';

/** Seconds left on the clock from which the music peaks, and the side health fraction below which it peaks. */
export const PEAK_SECONDS = 15;
export const PEAK_HEALTH = 0.25;

export function musicIntensity(state: Readonly<MatchState>, started: boolean): MusicIntensity {
  if (!started || state.phase === MatchPhase.Over) return MusicIntensity.Calm;
  if (state.ticksLeft <= PEAK_SECONDS * TICK_RATE) return MusicIntensity.Peak;
  const sides = [...new Set(state.fighters.map((f) => f.team))];
  if (sides.some((t) => teamHealthFraction(state.fighters, t) < PEAK_HEALTH)) return MusicIntensity.Peak;
  return MusicIntensity.Drive;
}
