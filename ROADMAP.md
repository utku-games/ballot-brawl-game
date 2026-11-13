# Roadmap

Each phase is one feature branch and pull request into `develop`. Read this file first when resuming.

| Phase | Branch | Content | Status |
|---|---|---|---|
| 1 | `feature/scaffold` | repo, docs, deploy script, placeholder arena | done (PR #1) |
| 2 | `feature/fight-core` | deterministic team fight sim, CPU AI, story ladder and scoring | done (PR #2) |
| 3 | `feature/arena-view` | bobblehead fighters, arenas, camera, effects, HUD, keyboard, gamepad, touch, audio | done (PR #4) |
| 4 | `feature/faces` | face pipeline, licence checks, 36-fighter roster, credits | done (PR #3) |
| 5 | `feature/modes` | menus, brawl setup up to 4v4, story mode, results, credits screen, home screen install | done (PR #5) |
| 6 | `release/0.1.0` | release 0.1.0; deploy and making the repository public follow on request | done |
| 7 | `feature/expressive-heads` | sticker heads, live expressions, KO fall fix, win and lose poses | done (PR #8) |
| 8 | `fix/*` releases 0.2.1 to 0.2.3 | jawline cut, ambient-occlusion fixes, solid silhouette heads, story lives fix | done (PRs #11 to #19) |

## Enhancements

Five pieces, built one at a time, each with its own spec, PR and release.

| Piece | Branch | Content | Status |
|---|---|---|---|
| 1 | `feature/character-looks` | body types, outfits, neckwear, headwear and hand props per fighter ([spec](docs/specs/2026-11-13-character-looks-design.md), [plan](docs/plans/2026-11-13-character-looks.md)) | done (PR #20, release 0.3.0) |
| 2 | `feature/personality` | finisher styles, taunt, per-fighter gestures for entrance, taunt and win ([spec](docs/specs/2026-11-13-personality-design.md), [plan](docs/plans/2026-11-13-personality.md)) | done (PR #23, release 0.4.0) |
| 3 | tbd | new fighters: Netanyahu and Khamenei (regular Politicians), Edison, Xi and other rivalry opponents, a Celebrities category with its own boss and ladder, the Pakistani leader, James Cameron, a goat and a pig | planned |
| 4 | tbd | Rivalry Battles mode with two sections: Rivalries (Edison vs Tesla, Trump vs Xi, Musk vs Zuckerberg and more) and Special Edition (Pakistani leader vs goat, James Cameron vs pig, more later); Netanyahu and Khamenei are never paired | planned |
| 5 | tbd | throwable items, arena hazards, flying knockouts, ring-outs, a party mode, a final-knockout replay | planned |
