/**
 * Builds the match plan for an online duel from the host's start message, for either side of the connection.
 * The host's fighter is always on the left and the guest's on the right, so both pages build the same match.
 * Each page marks its own fighter as Player 1 and the other as Player 2, which puts its own marker and HUD focus first.
 */
import { PlayerId } from '../input/controlFrame';
import type { StartInfo } from '../net/protocol';
import { NetRole } from './matchNet';
import { PLAIN_FIGHT, type MatchPlan, type SlotPlan } from './matchPlan';

/** Unused CPU level: nobody in an online duel is CPU-controlled, but every slot declares one. */
const NO_CPU_LEVEL = 0;

function slot(fighterId: string, player: PlayerId): SlotPlan[] {
  return [{ fighterId, player, cpuLevel: NO_CPU_LEVEL, damageScale: 1, boss: false }];
}

export function onlineMatchPlan(info: Readonly<StartInfo>, role: NetRole): MatchPlan {
  const host = role === NetRole.Host ? PlayerId.One : PlayerId.Two;
  const guest = role === NetRole.Host ? PlayerId.Two : PlayerId.One;
  return {
    ...PLAIN_FIGHT,
    teams: [slot(info.hostFighter, host), slot(info.guestFighter, guest)],
    arena: info.arena,
    seed: info.seed,
    extras: info.extras,
  };
}
