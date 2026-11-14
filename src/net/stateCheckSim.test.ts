/**
 * Plays long randomised simulated matches and runs the deep state check on every streamed state.
 * It proves the check accepts legitimate states, including ring-outs, items, hazards, projectiles, knock-outs and match over.
 * States are real simulation output sent through JSON like the network does, so the check stays in step with the simulation.
 */
import { createRng } from '@utku/engine';
import { describe, expect, it } from 'vitest';
import { ActionKind, IDLE_INPUT, MatchPhase, type FighterInput, type MatchState } from '../fight/fightTypes';
import { applyRingOuts } from '../fight/ringOuts';
import { createMatch } from '../fight/matchSetup';
import { stepMatch } from '../fight/matchStep';
import { buildMatchSetup } from '../game/matchPlan';
import { defaultBrawl, setFighter, toMatchPlan } from '../game/brawlConfig';
import { ROSTER } from '../roster/roster';
import { ArenaKind } from '../view/arenaKinds';
import { checkState } from './stateCheck';

const GAMES = 6;
const TICKS = 12000;
const MOVE_RANGE = 2;

function randomInput(r: () => number, s: MatchState, me: number): FighterInput {
  const a = s.fighters[me];
  const b = s.fighters[1 - me];
  const chase = r() < 0.7;
  return {
    ...IDLE_INPUT, moveX: chase ? Math.sign(b.x - a.x) : (r() - 0.5) * MOVE_RANGE, moveZ: chase ? Math.sign(b.z - a.z) : (r() - 0.5) * MOVE_RANGE,
    punch: r() < 0.2, kick: r() < 0.1, special: r() < 0.05, taunt: r() < 0.01, defend: r() < 0.1,
  };
}

describe('state check on simulated matches', () => {
  it('accepts every streamed state of long random matches', () => {
    const seen = { ringed: false, items: false, hazards: false, projectiles: false, over: false };
    for (let g = 0; g < GAMES; g += 1) {
      const ids = [ROSTER[g % ROSTER.length].id, ROSTER[(g * 7 + 3) % ROSTER.length].id];
      const arena = g % 2 === 0 ? ArenaKind.Rooftop : ArenaKind.Parliament;
      const config = setFighter(setFighter(defaultBrawl(arena), 0, 0, ids[0]), 1, 0, ids[1]);
      const rng = createRng(g + 1);
      let s: MatchState = createMatch(buildMatchSetup(toMatchPlan(config, createRng(g + 11))));
      for (let i = 0; i < TICKS; i += 1) {
        s = stepMatch(s, [randomInput(rng, s, 0), randomInput(rng, s, 1)]);
        const wire = JSON.parse(JSON.stringify(s)) as unknown;
        expect(() => checkState(wire, ids)).not.toThrow();
        seen.ringed ||= s.fighters.some((f) => f.ringedOut);
        seen.items ||= s.items.length > 0;
        seen.hazards ||= s.hazards.length > 0;
        seen.projectiles ||= s.projectiles.length > 0;
        seen.over ||= s.phase === MatchPhase.Over;
      }
    }
    expect(seen).toEqual({ ringed: false, items: true, hazards: true, projectiles: true, over: true });
  });

  it('accepts a state right after a ring-out', () => {
    const ids = [ROSTER[0].id, ROSTER[1].id];
    const config = setFighter(setFighter(defaultBrawl(ArenaKind.Rooftop), 0, 0, ids[0]), 1, 0, ids[1]);
    const s = createMatch(buildMatchSetup(toMatchPlan(config, createRng(2))));
    s.fighters[1].x = 500;
    s.fighters[1].action = { ...s.fighters[1].action, kind: ActionKind.Hitstun };
    applyRingOuts(s.fighters, s.fighters, s.events);
    expect(s.fighters[1].ringedOut).toBe(true);
    expect(() => checkState(JSON.parse(JSON.stringify(s)), ids)).not.toThrow();
  });
});
