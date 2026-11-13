# Ring-outs: Design

Piece 6 of the enhancement roadmap is ring-outs. The user asked for this piece. They delegated the design ("go go go without waiting"), so the choices below were made without a review round.

## Decisions

- **Ring-outs come with an arena, not a toggle.** A new arena, **The Rooftop**, is an open platform above a city skyline with no walls. Fighting there always has ring-outs; every other arena keeps its walls. Players can see the open edges, so the rule needs no explanation.
- **Only hits push fighters off.** Walking, dashing and Rush finishers stop at the edge like a wall. A fighter is rung out only while being knocked back by a hit: in hitstun, knocked down or guard-broken. Running off by accident is impossible, and knocking someone off is a skill.
- **A ring-out is a knockout.**
  - The fighter's health drops to 0 and they are marked as rung out.
  - The simulation emits `ringOut` and `ko` with `by: 'ringout'`.
  - The match ends by the usual rules.
- **Modes:**
  - **Brawl:** The Rooftop is a choice in the arena row on the Brawl setup screen.
  - **Story and Rivalry Battles:** they keep their own arenas and have no ring-outs.
- **The view:**
  - **Rung-out fighters:** they keep sliding over the edge, then fall out of sight. They spin as they fall, with a dust burst at the edge.
  - **Announcement:** the HUD shows "RING OUT!".
  - **Replay:** the knockout replay shows it again.

## Simulation

- `MatchSetup` and `MatchState` gain `ringOuts: boolean`, set from the plan's arena through `arenaHasRingOuts`.
- `FighterState` gains `ringedOut: boolean`.
- **After knockback:** in a ring-out match, a fighter whose centre ends a tick beyond the platform edge while being knocked back is rung out. The platform edge is the arena half-size, so the fighter's centre has to pass the edge.
- **Walls:** all other fighters are kept inside the walls as now. Rung-out fighters are no longer clamped, take no hits and are not pushed by others.

## Testing

- **Platform edge:**
  - A kick near the edge rings the target out, with `ringOut` and `ko` events and the match ending.
  - The same kick far from the edge does not.
  - Walking and Rush stop at the edge.
- **Other arenas:** with ring-outs off, the old wall behaviour is unchanged.
- **Determinism:** it holds.
- **Plans:** Brawl on The Rooftop has ring-outs; Story and Rivalry plans do not.
- **In-game:** screenshots of The Rooftop and a ring-out on desktop and phone sizes.
