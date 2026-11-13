# Personality: Design

Piece 2 of the enhancement roadmap: each fighter gets a signature finisher style, a personal gesture used for the
match entrance, a new taunt and the win celebration, and themed finisher effects. The user delegated the design
decisions for this piece ("go ahead without waiting for me"), so the choices below were made without a review round.

## Goals

- Fighters play differently, not only look different: the meter finisher becomes a per-fighter signature move.
- Every fighter has a recognisable gesture (Churchill's V sign, Mozart conducting, Merkel's hand diamond).
- A risk-reward taunt adds personality and a reason to keep distance.

## Decisions

- **No new attack button.** The existing meter finisher becomes the signature special; its name already exists per
  fighter (`finisher` in the roster).
- **Four finisher styles** with their own simulation rules, balanced against each other:

| Style | Behaviour | Damage | Notes |
|---|---|---|---|
| Smash | today's finisher: heavy close hit in a wide arc | 38 | unchanged |
| Rush | dashes forward 3 m during its active frames, hitting everyone in the path once | 32 | stops at the arena wall |
| Throw | releases a projectile that flies straight and hits the first enemy it touches | 34 | flies 9 m/s for up to 0.9 s; defend blocks it |
| Quake | ground slam that hits every enemy within 2 m, in all directions | 28 | |

  All styles keep the finisher rules: full meter required, guard-breaking on block, knockdown on hit.
- **Taunt**: a new button. The fighter performs their gesture for 0.9 s (54 ticks) and cannot act; if it completes
  without being hit, the fighter gains 30 meter (of 100). Being hit interrupts it like any other action. CPU fighters
  taunt now and then when no enemy is within 4 m.
  - Keyboard: Player 1 `H`, Player 2 `;`. Gamepad: B (B no longer doubles as finisher; Y stays finisher). Touch: a
    small Taunt button next to Swap.
- **Gestures** (view only, ten): Cheer, Flex, Wave, Bow, Point, Conduct, Salute, Thinker, VSign, Diamond. Each is a
  pure pose function of time. A fighter's gesture is used:
  - during the match intro (entrance; the intro grows from 1.6 s to 2.2 s),
  - during a taunt,
  - as the looping win celebration (replacing the shared fist pump).
- **Throw projectiles** have a themed look (view only): Mitten, Rocket, Parcel, Burger, Gift, Coin, Apple, Bolt, Note.
  Rush leaves a dust trail and Quake sends out a shockwave ring.
- No speech or quotes are put in anyone's mouth; personality comes from moves, gestures and objects.
- Meloni does not get the Salute gesture.

## Assignments

| Fighter | Style | Gesture | Projectile |
|---|---|---|---|
| Donald Trump | Rush | Point | - |
| Joe Biden | Smash | Wave | - |
| Barack Obama | Quake | Cheer | - |
| Bernie Sanders | Throw | Point | Mitten |
| Boris Johnson | Rush | Cheer | - |
| Keir Starmer | Smash | Bow | - |
| Emmanuel Macron | Quake | Salute | - |
| Angela Merkel | Smash | Diamond | - |
| Justin Trudeau | Rush | Wave | - |
| Giorgia Meloni | Smash | Point | - |
| Javier Milei | Rush | Flex | - |
| Winston Churchill (boss) | Smash | VSign | - |
| Elon Musk | Throw | Cheer | Rocket |
| Jeff Bezos | Throw | Flex | Parcel |
| Bill Gates | Quake | Thinker | - |
| Mark Zuckerberg | Rush | Wave | - |
| Warren Buffett | Throw | Thinker | Burger |
| Richard Branson | Rush | Cheer | - |
| Larry Ellison | Smash | Flex | - |
| Jensen Huang | Quake | Point | - |
| Oprah Winfrey | Throw | Wave | Gift |
| Steve Jobs | Smash | Point | - |
| Jack Ma | Rush | Cheer | - |
| John D. Rockefeller (boss) | Throw | Bow | Coin |
| Albert Einstein | Quake | Thinker | - |
| Isaac Newton | Throw | Point | Apple |
| Leonardo da Vinci | Rush | Bow | - |
| William Shakespeare | Smash | Bow | - |
| Cleopatra | Quake | Wave | - |
| Julius Caesar | Rush | Salute | - |
| Abraham Lincoln | Smash | Wave | - |
| Queen Victoria | Smash | Wave | - |
| Marie Curie | Quake | Thinker | - |
| Nikola Tesla | Throw | Point | Bolt |
| Wolfgang Amadeus Mozart | Throw | Conduct | Note |
| Napoleon Bonaparte (boss) | Rush | Salute | - |

## Architecture

- **Roster data:** `roster/signatureTypes.ts` holds `FinisherStyle`, `Gesture` and `Projectile` enums. Each roster row
  gains `signature: [FinisherStyle, Gesture, Projectile]`, validated like the look kit.
- **Simulation** (`src/fight`, pure, deterministic):
  - `CombatProfile` gains `finisher: FinisherStyle`, set from the roster in `combatProfile`.
  - `moves.ts`: `moveData(move, style)` returns the style's frame data for the finisher.
  - `ActionKind.Taunt`; `FighterInput.taunt`; taunt rules in `fighterControl`.
  - Rush movement in `fighterControl`, Quake as a full-circle arc, Throw spawning a `ProjectileState` in a new
    `MatchState.projectiles` list, moved and resolved in a new `projectiles.ts`.
  - New events: `taunt`, `tauntDone`, `throw`.
- **AI:** finishes from each style's useful range (Throw from afar, Quake when enemies are near), taunts when alone.
- **Input:** `ControlFrame.taunt` from keyboard, gamepad and touch.
- **View:** `gesturePoses.ts` (pure, tested) turns a gesture and time into a `Pose`; `poseLogic` uses it for taunts,
  the intro and wins. `projectileParts.ts` (pure) describes projectile looks with the existing `PartSpec` system;
  `projectileView.ts` renders `state.projectiles`. Quake shockwave and Rush dust go through `hitEffects`.
- **Audio:** taunt and throw get simple synthesised cues alongside the existing ones.

## Testing

- Simulation: each style hits as specified (Rush moves and hits along its path, Throw hits at range and is blocked by
  defend, Quake hits behind the attacker), the finisher still needs and empties the meter, taunt grants meter only
  when completed, determinism (same inputs give the same states).
- Roster: every fighter has a valid signature matching the table.
- View logic: every gesture yields a finite pose that differs from standing; projectile part lists are valid.
- In-game: screenshots of each style mid-finisher, a taunt, the intro and a win; phone 4v4 frame rate unchanged.

## Out of scope

New fighters, Rivalry Battles, items and hazards (pieces 3 to 5).
