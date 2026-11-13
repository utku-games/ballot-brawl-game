/**
 * Tests for the guest's deep state check: a real simulated state passes, and each kind of damage is rejected.
 * Damage covers wrong or reordered fighters, non-finite positions, unknown actions and phases, and broken lists.
 * States come from the real simulation, so the check stays in step with the MatchState shape.
 */
import { createRng } from '@utku/engine';
import { describe, expect, it } from 'vitest';
import { NetProtocolError } from '../core/errors';
import { IDLE_INPUT, type MatchState } from '../fight/fightTypes';
import { createMatch } from '../fight/matchSetup';
import { stepMatch } from '../fight/matchStep';
import { buildMatchSetup } from '../game/matchPlan';
import { defaultBrawl, setFighter, toMatchPlan } from '../game/brawlConfig';
import { ArenaKind } from '../view/arenaKinds';
import { checkState } from './stateCheck';

const IDS = ['goat', 'pig'];

function live(): MatchState {
  const config = setFighter(setFighter(defaultBrawl(ArenaKind.Rooftop), 0, 0, IDS[0]), 1, 0, IDS[1]);
  let s = createMatch(buildMatchSetup(toMatchPlan(config, createRng(3))));
  for (let i = 0; i < 30; i += 1) s = stepMatch(s, [{ ...IDLE_INPUT, moveX: 1, punch: i % 5 === 0 }, IDLE_INPUT]);
  return JSON.parse(JSON.stringify(s)) as MatchState;
}

/** A state opened up for damaging: any field may be replaced. */
interface Loose {
  [key: string]: unknown;
  fighters: Array<Record<string, unknown> & { action: Record<string, unknown> }>;
}

function broken(change: (s: Loose) => void): unknown {
  const s = live() as unknown as Loose;
  change(s);
  return s;
}

describe('state check', () => {
  it('accepts a real streamed state', () => {
    expect(checkState(live(), IDS).fighters).toHaveLength(2);
  });

  it('rejects damaged states', () => {
    const bad: unknown[] = [
      null, [], 'state',
      broken((s) => { s.fighters.reverse(); }),
      broken((s) => { s.fighters.pop(); }),
      broken((s) => { s.fighters[0].x = 'far'; }),
      broken((s) => { s.fighters[1].health = null; }),
      broken((s) => { s.fighters[0].action.kind = 'fly'; }),
      broken((s) => { s.fighters[0].team = 7; }),
      broken((s) => { s.phase = 'paused'; }),
      broken((s) => { s.winner = 5; }),
      broken((s) => { s.items = [{ x: 1 }]; }),
      broken((s) => { s.hazards = {}; }),
      broken((s) => { s.events = [{}]; }),
      broken((s) => { delete s.tick; }),
    ];
    for (const b of bad) expect(() => checkState(b, IDS)).toThrow(NetProtocolError);
  });
});
