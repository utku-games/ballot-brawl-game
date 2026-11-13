# Architecture

Ballot Brawl is a 2.5D team brawler: up to 4 versus 4 bobblehead fighters on a flat arena floor, seen
from a framing camera. This file is the contract between subsystems.

## Layers (imports only point down)

| Layer | Folder | May import | Notes |
|---|---|---|---|
| Entry | `src/main.ts` | everything | wires the app into the page |
| Game | `src/game/` | ui, view, input, audio, story, fight, ai, roster, core | phase machine and match session |
| UI | `src/ui/` | input, story, roster, core | DOM menus, HUD, touch controls |
| View | `src/view/` | fight, roster, core | Three.js models, animation, camera, effects |
| Input | `src/input/` | fight, core | keyboard, gamepad and touch to `FighterInput` |
| Audio | `src/audio/` | core | `GameAudio` built on the engine `SynthAudio` |
| Story | `src/story/` | fight, roster, core | ladder, difficulty curve, scoring (pure) |
| AI | `src/ai/` | fight, core | CPU brain (pure, seeded) |
| Fight | `src/fight/` | roster, core | deterministic simulation (pure) |
| Roster | `src/roster/` | core | fighter data and image credits (pure data) |
| Core | `src/core/` | engine | errors, arena bounds, shared constants |

Fight, AI, Story, Roster and Core are pure: no DOM, no Three.js, no `Math.random`, colocated tests.

## Coordinates and time

Y is up, meters and seconds. The floor spans `ARENA_HALF_WIDTH` on X and `ARENA_HALF_DEPTH` on Z
(`src/core/arena.ts`); +Z points toward the camera. The simulation runs at a fixed 60 Hz through the
engine `FixedStepClock`; frame data is counted in ticks.

## Fight simulation contract

- `MatchState` holds every `FighterState` (team, position, facing, health, guard, meter, current action),
  the remaining time and a list of `FightEvent`s produced by the last tick (hit, block, guard break,
  special, KO, time over, match end).
- `stepMatch(state, inputs)` returns the next state; `inputs` has one `FighterInput` per fighter:
  a move vector, `punch`, `kick` and `special` presses and a held `defend`.
- Defending takes no damage from any hit but drains the guard; an empty guard breaks and stuns.
- The power meter fills from dealing, taking and blocking hits; when full, `special` performs the
  fighter's finisher, a slow heavy hit that deals far more damage (no gore, only a dramatic hit).
- Fighters face the nearest living enemy. A team loses when all its fighters are knocked out.

## Modes

- Brawl: each side has 1 to 4 fighters; any slot is Player 1, Player 2 or CPU. A player whose fighter
  is knocked out (or who presses Swap) takes control of the next living teammate.
- Story: pick a category (Politicians, Tycoons, Legends) and a fighter; beat 10 opponents of that
  category one by one, each harder than the last, ending with the category boss. Winning the last
  fight shows "You saved the world!". The score is computed from the damage taken across the run.

## Faces

Each fighter's face is a public domain or freely licensed photo. `scripts/faces/` downloads the
image named in `faceSources.json`, checks its licence through the Wikimedia Commons API, crops it to a
square, feathers it into an oval and writes `public/faces/<id>.webp` plus `src/roster/credits.json`.
A test fails when a roster fighter has no credit entry or face file.
