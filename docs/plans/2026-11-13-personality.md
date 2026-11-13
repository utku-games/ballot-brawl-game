# Personality Implementation Plan

> Normal-size agent loop: the main session builds, then one `qa` agent verifies. Copy to `.loop/personality/plan.md`.

**Goal:** Per-fighter finisher styles (Smash, Rush, Throw, Quake), a taunt, and per-fighter gestures for the intro,
taunt and win.

**Architecture:** Signature data in the roster; the pure 60 Hz simulation gains the finisher styles, projectiles and
the taunt; the view gains pure gesture poses and projectile part lists rendered with the existing costume system.

**Tech Stack:** TypeScript, Three.js 0.186, Vitest 4.

**Spec:** `docs/specs/2026-11-13-personality-design.md` (assignment table and numbers live there).

## Global Constraints

- Three-sentence file headers, at most 500 lines per file, functions about 50 lines, named constants, domain errors,
  no emojis, no commented-out code; pure modules have colocated tests.
- The simulation stays deterministic and free of DOM and Three.js; the state passed to `stepMatch` is never mutated.
- Existing fight tests keep passing; Smash keeps today's finisher numbers.
- No speech or quotes attributed to real people.

## Review Focus

1. A Throw projectile must not hit its own team, must disappear on hit, at the arena wall and when its time runs out,
   and must not survive into the next match. Owner: Task 3 tests.
2. Rush must stop at the arena wall and must not push the attacker through other bodies. Owner: Task 2 test.
3. A taunt interrupted by a hit grants no meter; a taunt cannot start mid-attack. Owner: Task 4 tests.
4. Swapping to a teammate mid-taunt or mid-Rush must not leave a stuck action. Owner: Task 4 test (inputs switch
   to the CPU without breaking the action).
5. The match intro must still accept no input; gestures must not hide that the fight has started. Owner: Task 6.

---

### Task 1: Signature data

- Create `src/roster/signatureTypes.ts`: `FinisherStyle` (`smash`, `rush`, `throw`, `quake`), `Gesture` (`cheer`,
  `flex`, `wave`, `bow`, `point`, `conduct`, `salute`, `thinker`, `v-sign`, `diamond`), `Projectile` (`none`,
  `mitten`, `rocket`, `parcel`, `burger`, `gift`, `coin`, `apple`, `bolt`, `note`), and
  `type Signature = readonly [FinisherStyle, Gesture, Projectile]`.
- `FighterDef` gains `signature: { style: FinisherStyle; gesture: Gesture; projectile: Projectile }`; `FighterRow`
  gains `signature: Signature`; every row per the spec table.
- `validateRoster` rejects unknown values, a Throw style without a projectile, and a projectile on a non-Throw style.
- Tests in `roster.test.ts`: complete valid signatures; spot checks (Churchill Smash/VSign, Newton Throw/Apple,
  Mozart Throw/Conduct/Note, Napoleon Rush/Salute); Meloni's gesture is not Salute; the two rejection rules.

### Task 2: Finisher styles in the simulation

- `CombatProfile.finisher: FinisherStyle`, filled by `combatProfile` from the fighter definition (update its
  signature and callers, `testFight.ts` helpers default to Smash).
- `moves.ts`: `FINISHER_STYLES: Record<FinisherStyle, MoveData>` and `moveData(move: MoveKind, style: FinisherStyle):
  MoveData`. Smash equals today's finisher. Rush: damage 32, reach 0.8, full-circle arc (`arcCos` -1), active 12
  ticks. Quake: damage 28, reach 2.0 minus body radii, full circle. Throw: damage 34, reach 0 (no melee contact).
  `RUSH_SPEED` 15 m/s during active frames (3 m over 12 ticks).
- `hitResolution` and the pose/AI callers use `moveData(move, attacker.profile.finisher)`.
- `fighterControl`: during Rush active frames the attacker moves forward along its facing; `keepInArena` and
  `separateBodies` already run after control.
- Tests (`finisherStyles.test.ts`): Rush ends about 3 m forward and hits an enemy on its path; Rush stops at the wall;
  Quake hits an enemy directly behind; Smash numbers unchanged; every style still needs a full meter and empties it.

### Task 3: Projectiles

- `fightTypes.ts`: `ProjectileState { id: string; owner: string; team: TeamIndex; x: number; z: number; dirX: number;
  dirZ: number; ticksLeft: number }`; `MatchState.projectiles: ProjectileState[]` (empty in `createMatch`); events
  `{ kind: 'throw'; attacker: string; projectile: string }`.
- New `src/fight/projectiles.ts`: `spawnProjectiles(fighters, tick, events): ProjectileState[]` spawns one on the
  first active frame of a Throw finisher, in front of the thrower; `stepProjectiles(projectiles, fighters, events):
  ProjectileState[]` moves each by `PROJECTILE_SPEED` 9 m/s, hits the first living enemy within
  `PROJECTILE_RADIUS` 0.35 plus body radius (hit or block like a melee finisher contact, reusing hitResolution's
  apply functions, exported for this), and drops projectiles that hit, leave the arena or run out
  (`PROJECTILE_TICKS` 54).
- `stepMatch` calls both after `resolveAttacks`; projectiles are cloned like fighters.
- Tests (`projectiles.test.ts`): hits an enemy 5 m away; blocked by defend (guard broken, no damage); ignores
  teammates; disappears on hit, at the wall and on timeout; deterministic ids.

### Task 4: Taunt

- `FighterInput.taunt` and `IDLE_INPUT.taunt = false`; `ActionKind.Taunt`; constants `TAUNT_TICKS` 54,
  `TAUNT_METER` 30.
- `fighterControl.chooseAction`: a fresh taunt press from Idle or Defend starts a Taunt action (lowest priority after
  attacks and defend); emits `taunt`. `advanceTimers`: when a Taunt action completes, add `TAUNT_METER` (capped) and
  emit `tauntDone` (advanceTimers gains an events parameter).
- Tests (`taunt.test.ts`): full taunt grants 30 meter; a hit during the taunt grants nothing; no taunt while
  attacking; a taunting fighter keeps the action when its controller switches to the CPU; meter capped at 100.

### Task 5: Input and CPU

- `ControlFrame.taunt` (fresh press), merged and mapped in `toFighterInput`; keyboard P1 `KeyH`, P2 `Semicolon`;
  gamepad B (removed from special); touch Taunt button in `touchControls.ts` and `touchLogic.ts`.
- `aiBrain`: finisher range per style (`Throw` 6 m, `Quake` 1.9 m, `Rush` 3 m, `Smash` as today); taunt with chance
  `TAUNT_CHANCE` 0.02 per decision when the nearest enemy is beyond 4 m and the meter is not full.
- Tests: input mapping for every device; AI throws from range, quakes up close, taunts only when alone (seeded rng).

### Task 6: Gestures

- New pure `src/view/gesturePoses.ts`: `gesturePose(gesture: Gesture, seconds: number): Pose` for all ten gestures.
- `poseLogic.PoseInput` gains `gesture: Gesture` and `intro: boolean`; the win mood, `ActionKind.Taunt` and
  `intro` use `gesturePose`.
- `FighterView` passes the fighter's gesture; `MatchView.render` gains `intro`; `MatchSession` intro grows to 2.2 s
  and renders the intro gesture.
- Tests (`gesturePoses.test.ts`): every gesture is finite and differs from the standing pose; VSign raises one arm;
  Diamond holds both hands in front; computePose uses the gesture for taunts and wins.

### Task 7: Finisher effects, audio, HUD

- New pure `src/view/projectileParts.ts`: `projectileParts(p: Projectile): PartSpec[]` anchored at a new
  `Anchor.Projectile` (origin at the projectile centre). Tested: every projectile except None has valid parts.
- New `src/view/projectileView.ts`: keeps one mesh group per live projectile id, positions it from interpolated
  state, spins it, and removes it when gone.
- `hitEffects`: `BurstKind.Shockwave` (expanding ring) on Quake swing, dust trail during Rush.
- `gameAudio`: `taunt` and `throw` cues.
- HUD: taunt completion pops "+POWER" on the fighter's row.

### Task 8: Verify and document

- Lineup page gains `pose=taunt` (gesture loop) for checking gestures.
- Screenshots: each style mid-finisher in a match, taunt, intro, win; phone 4v4 frame rate within 10 percent of 0.3.0.
- README (controls table with Taunt, finisher styles), CHANGELOG, ROADMAP.
