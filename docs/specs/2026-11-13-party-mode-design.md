# Party Mode: Design

Piece 7 of the enhancement roadmap is a free-for-all party mode. The user asked for it and delegated the design ("go go go without waiting"), so the choices below were made without a review round.

## Decisions

- **Party** is a new main-menu mode: a free-for-all for 3 or 4 fighters, each on its own side. The last one standing wins.
- **Each slot:**
  - a fighter (or Random)
  - a controller: Player 1, Player 2 or CPU. Player 1 is always slot 1.
- **Shared settings:** CPU difficulty, arena (including The Rooftop for ring-outs) and items and hazards (on by default).
- **Time over:** the fighter with the highest health fraction wins. A tie is a draw.
- **Result screen:** it names the winner ("Marie Curie wins!") and offers Rematch, Change setup and Main menu.
- **Team colours:** four distinct colours (blue, red, green, gold) for floor rings and HUD rows.

## Simulation

- `TeamIndex` widens to `0 | 1 | 2 | 3`.
- `MatchSetup.teams` holds 2 to 4 teams of 1 to 4 fighters.
- **Two-team matches:** they spawn exactly as before.
- **Three or four teams:** they spawn evenly around a circle, facing the centre.
- **End check:** the match ends when at most one team has living fighters.
- **Time over:** the team with the highest health fraction wins; equal fractions are a draw.
- **Unchanged rules:** enemies are simply fighters on another team, so hits, projectiles, hazards, the CPU and swapping keep working.

## Architecture

| File | Change |
|---|---|
| `fight/fightTypes.ts`, `fight/fightConstants.ts` | `TeamIndex` is 0 to 3; `MIN_TEAMS` is 2 and `MAX_TEAMS` is 4 |
| `fight/matchSetup.ts` | 2 to 4 teams; circular spawn for more than two |
| `fight/matchStep.ts` | outcome for any number of teams |
| `game/matchPlan.ts` | `teams: SlotPlan[][]` |
| `game/partyConfig.ts` (new, pure) | party setup: player count, slots, toggles, and `toMatchPlan` |
| `ui/screens/partyScreens.ts` (new) | setup screen and result screen |
| `view/matchView.ts`, `ui/hud.ts`, `ui/theme.ts` | four team colours; HUD rows for teams after the first go in the right column |
| `game/gameApp.ts` | Party flow |

## Testing

- **Simulation:**
  - three- and four-team matches spawn inside the arena, facing the centre
  - the match ends only when one team is left, and with the correct winner
  - time over picks the healthiest fighter
  - a draw on equal health
  - two-team spawns are unchanged
  - determinism holds.
- **Config:**
  - Player 1 is fixed
  - Player 2 is unique
  - Random picks never repeat
  - the plan carries the arena, extras and ring-outs.
- **In-game:** a four-player party on desktop and phone sizes, on The Rooftop and a walled arena.
