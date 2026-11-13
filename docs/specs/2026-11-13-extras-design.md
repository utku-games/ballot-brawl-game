# Extras: Design

Piece 5 of the enhancement roadmap adds four extras:
- **Throwable items:** briefcases, gavels and money bags to pick up and throw.
- **Arena hazards:** a cartoon anvil that drops where a shadow marks the floor.
- **Flying knockouts:** big final hits launch the loser into the air.
- **Knockout replay:** a slow-motion replay of the final knockout.

The user delegated the design ("go without waiting"), so the choices below were made without a review round.

## Scope decisions

- Two roadmap ideas are left out. The arena has walls on every side, so **ring-outs** would need a different arena model. A **party mode** (free-for-all) would need more than two teams in the simulation. Both can come back as their own pieces.
- Items and hazards are **on by default in Brawl**, with a toggle on the Brawl setup screen. They are **off in Story and Rivalry Battles**, so those fights stay even.
- Flying knockouts and the knockout replay apply to **every mode**.

## Items (simulation)

- **Spawning:**
  - every 6 seconds, while fewer than 2 items lie on the floor
  - at a deterministic pseudo-random spot inside the arena, away from the walls.
- **Kinds:** Briefcase, Gavel and MoneyBag. The kind only changes the look.
- **Pick-up:**
  - happens automatically when a living fighter who is not holding an item walks within 0.7 m
  - is allowed from Idle or Defend only, so attacking or stunned fighters do not grab items
  - emits a `pickup` event.
- **Throwing:**
  - With an item in hand, Punch throws it instead of punching. A short throw animation plays (MoveKind.Item: startup 8, active 1, recovery 14).
  - The item flies like a projectile and hits the first enemy for 14 damage with light knockback and normal hitstun.
  - Defending blocks it: no damage, and it drains guard (25) but does not break it on its own.
  - A knocked-out or knocked-down fighter drops the item it holds.
- **CPU:** a CPU fighter holding an item throws it when an enemy is between 2.5 and 7 m away.

## Hazards (simulation)

- **Spawning:**
  - every 9 seconds
  - targeting a living fighter's position plus jitter, chosen deterministically from the match seed and tick.
- **Warning:** a shadow marks the spot for 1 second.
- **Impact:**
  - Every fighter of either team within 1.1 m takes 16 damage and is knocked down, unless invulnerable or already down.
  - It cannot be blocked, only dodged.
  - It emits `hazardHit` per victim and `crash` once. A knockout by a hazard emits `ko` with `by: 'hazard'`.

## Determinism

All randomness comes from `extraRandom(seed, tick, salt)`, a pure 32-bit hash. The same seed and inputs replay the same match. `MatchSetup` gains `extras: boolean` and `seed: number`, and `MatchState` gains `items`, `hazards`, `extras` and `seed`.

## View

- **Floor items:**
  - pulse gently on the floor
  - a held item shows in the fighter's right hand
  - thrown items reuse the projectile view with the item's parts.
- **Hazards:**
  - a red pulsing ring on the floor during the warning
  - a cartoon anvil that falls during the last third of the warning
  - a dust shockwave and screen shake on impact.
- **Flying knockouts:** a knockout from a finisher or a hazard launches the fighter up in an arc for 0.8 s with a spin before the normal fall. The pure `launchArc(seconds)` drives it.
- **Knockout replay:**
  - The session keeps the last 2.5 s of states.
  - After a knockout ends the match, it replays them at 40% speed with a "REPLAY" banner, then shows the result.
  - Any button press skips the replay.
  - A time-over ending has no replay.

## Testing

- **Items:**
  - spawn timing and the cap
  - pick-up range and allowed states
  - punch throws instead of punching
  - a thrown item hits for its damage and is blocked by defend without a guard break
  - drop on knockdown
  - no items when extras are off.
- **Hazards:**
  - the warning, then impact damage and knockdown on both teams, sparing anyone outside the radius
  - knockout attribution
  - none when extras are off.
- **Determinism:** the same seed gives identical states, and a different seed gives different spawn spots.
- **CPU:** throws a held item at range.
- **View logic:** `launchArc` rises and comes back to the floor; the replay buffer keeps only the last N states.
- **In-game:** Brawl with extras (items, a throw, a hazard, a flying knockout, the replay) on desktop and phone sizes, and the frame rate.
