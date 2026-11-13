/**
 * Read-only questions about a match: who is alive, who is the nearest enemy, how healthy a team is.
 * The simulation, the CPU brain and the HUD all ask these, so they live in one tested module.
 * Lookups of unknown slot ids raise the engine UnknownEntityError.
 */
import { UnknownEntityError } from '../core/errors';
import { ActionKind, type FighterState, type MatchState, type TeamIndex } from './fightTypes';

export function isAlive(f: Readonly<FighterState>): boolean {
  return f.action.kind !== ActionKind.KnockedOut;
}

export function otherTeam(team: TeamIndex): TeamIndex {
  return team === 0 ? 1 : 0;
}

export function livingOnTeam(fighters: readonly FighterState[], team: TeamIndex): FighterState[] {
  return fighters.filter((f) => f.team === team && isAlive(f));
}

export function distanceBetween(a: Readonly<FighterState>, b: Readonly<FighterState>): number {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

/** Nearest living fighter of the other team, or null when none is left. */
export function nearestEnemy(fighters: readonly FighterState[], self: Readonly<FighterState>): FighterState | null {
  let best: FighterState | null = null;
  let bestDistance = Infinity;
  for (const other of fighters) {
    if (other.team === self.team || !isAlive(other)) continue;
    const d = distanceBetween(self, other);
    if (d < bestDistance) {
      best = other;
      bestDistance = d;
    }
  }
  return best;
}

/** Sum of health over sum of max health for a team (0..1). */
export function teamHealthFraction(fighters: readonly FighterState[], team: TeamIndex): number {
  let health = 0;
  let max = 0;
  for (const f of fighters) {
    if (f.team !== team) continue;
    health += f.health;
    max += f.profile.maxHealth;
  }
  return max > 0 ? health / max : 0;
}

export function findFighter(state: Readonly<MatchState>, slotId: string): FighterState {
  const found = state.fighters.find((f) => f.slotId === slotId);
  if (!found) throw new UnknownEntityError(`No fighter in slot ${slotId}`);
  return found;
}
