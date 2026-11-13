# Character Looks Implementation Plan

> **For agentic workers:** execute task by task; steps use checkbox (`- [ ]`) syntax for tracking. Per the global
> agent loop this is a Normal task: the main session builds, then one `qa` agent verifies. Copy this file to
> `.loop/character-looks/plan.md` and drive it with `~/.claude/harness/bin/loop-state`.

**Goal:** Give all 36 fighters their own body type, outfit, neckwear, headwear and hand prop, visual only.

**Architecture:** Pure modules turn a fighter's look into body dimensions and lists of `PartSpec` primitives; a thin
Three.js layer builds meshes from those specs and attaches them to the existing bobblehead rig. The fight simulation
is untouched.

**Tech Stack:** TypeScript, Three.js 0.186, Vite 8, Vitest 4.

**Spec:** `docs/specs/2026-11-13-character-looks-design.md` (catalogue and per-fighter assignments live there; this
plan does not repeat them).

## Global Constraints

- Every file starts with a three-sentence summary; at most 500 lines; functions about 50 lines or less.
- Named constants, no magic numbers; full type annotations on exports; no emojis; no commented-out code.
- Pure modules (`lookTypes`, `buildShapes`, `partSpec`, `outfitParts`, `headwearParts`, `propParts`, the
  `silhouette` additions) import nothing from `three` or the DOM and have colocated `*.test.ts` files.
- Domain errors only (`RosterDataError`, plus a new `RigBuildError` in `src/core/errors.ts`).
- No logos, slogans or brand names on any item.
- The fight layer (`src/fight/**`) and its tests are not modified.
- Git Flow: commit on `feature/character-looks`; never commit `.loop/`; run `~/.claude/harness/bin/harness-check`
  before each commit; no AI attribution anywhere.

## Review Focus

1. Hit flash must stay per fighter: materials are cached per rig, never shared across fighters, or one hit flashes
   every fighter wearing that colour. Owner: Task 6 (QA checks with two same-coloured fighters).
2. A face whose silhouette grid is empty or missing rows (the Leonardo sketch has default landmarks) must still get
   a seated hat, not a hat at the card centre or a crash. Owner: Task 4 test `falls back when the grid is empty`.
3. Tall builds plus the boss size scale must stay inside the camera frame and keep the player marker above the hat.
   Owner: Task 6 (marker height from build dimensions plus headwear height) and Task 7 screenshots.
4. Knocked-out fighters lie on the floor: long garments and hats must not sink through it or detach. Owner: Task 7.
5. Shared geometry must not be disposed when one fighter is disposed (menu backdrop and match rebuild fighters).
   Owner: Task 6 (`dispose` only frees the head card and the rig's own materials).

---

### Task 1: Look types and roster data

**Files:**
- Create: `src/roster/lookTypes.ts`
- Modify: `src/roster/rosterTypes.ts` (`FighterLook`), `src/roster/defineFighter.ts`, `src/roster/politicians.ts`,
  `src/roster/tycoons.ts`, `src/roster/legends.ts`, `src/roster/roster.ts` (`validateRoster`)
- Test: `src/roster/roster.test.ts`

**Interfaces:**
- Produces: string enums `Build`, `Outfit`, `Neckwear`, `Headwear`, `Prop` with exactly the values in the spec's
  catalogue table (kebab-case string values, e.g. `Build.Lanky = 'lanky'`, `Prop.CoilWand = 'coil-wand'`).
- Produces: `FighterLook` gains `build`, `outfit`, `neckwear`, `headwear`, `prop` (colour fields unchanged).
- Produces: `FighterRow` gains `kit: readonly [Build, Outfit, Neckwear, Headwear, Prop]`.

- [ ] **Step 1: Write the failing tests** in `roster.test.ts`:

```ts
it('gives every fighter a complete look from the catalogue', () => {
  for (const f of ROSTER) {
    expect(Object.values(Build)).toContain(f.look.build);
    expect(Object.values(Outfit)).toContain(f.look.outfit);
    expect(Object.values(Neckwear)).toContain(f.look.neckwear);
    expect(Object.values(Headwear)).toContain(f.look.headwear);
    expect(Object.values(Prop)).toContain(f.look.prop);
  }
});

it('matches the spec for signature looks', () => {
  expect(fighterById('abraham-lincoln').look).toMatchObject({ build: Build.Lanky, outfit: Outfit.FrockCoat, neckwear: Neckwear.BowTie, headwear: Headwear.TopHat, prop: Prop.None });
  expect(fighterById('napoleon-bonaparte').look).toMatchObject({ build: Build.Short, outfit: Outfit.MilitaryCoat, headwear: Headwear.Bicorne, prop: Prop.Sword });
  expect(fighterById('winston-churchill').look).toMatchObject({ build: Build.Round, neckwear: Neckwear.BowTie, headwear: Headwear.Homburg, prop: Prop.Cigar });
  expect(fighterById('bernie-sanders').look.prop).toBe(Prop.Mittens);
});

it('rejects a look value outside the catalogue', () => {
  const broken = ROSTER.map((f, i) => (i === 0 ? { ...f, look: { ...f.look, outfit: 'cape' as Outfit } } : f));
  expect(() => validateRoster(broken)).toThrow(RosterDataError);
});
```

- [ ] **Step 2: Run** `npx vitest run src/roster` — expected FAIL (`Build` not defined).
- [ ] **Step 3: Implement.** Add the enums; extend `FighterLook` and `FighterRow`; `defineFighter` spreads `kit`
  into `look`; add a `kit` to every row in the three category files exactly per the spec's Assignments table;
  `validateRoster` throws `RosterDataError` naming the fighter and field when any look value is not in its enum.
- [ ] **Step 4: Run** `npx vitest run src/roster && npm run typecheck` — expected PASS.
- [ ] **Step 5: Commit** `Add look catalogue and per-fighter looks to the roster`.

### Task 2: Body dimensions per build

**Files:**
- Create: `src/view/buildShapes.ts`, `src/view/buildShapes.test.ts`

**Interfaces:**
- Consumes: `Build` (Task 1).
- Produces:

```ts
export interface BodyDims {
  legLength: number; legRadius: number; hipWidth: number;
  torsoHeight: number; torsoWidth: number; torsoDepth: number;
  armLength: number; limbRadius: number; shoulderWidth: number;
}
export function bodyDims(build: Build): BodyDims;
/** Height of the neck pivot above the floor. */
export function headPivotHeight(dims: Readonly<BodyDims>): number;
```

Average equals today's constants (`LEG_LENGTH` 0.72, `TORSO_HEIGHT` 0.62, `TORSO_WIDTH` 0.62, `TORSO_DEPTH` 0.34,
`ARM_LENGTH` 0.58, `LIMB_RADIUS` 0.09, leg radius `LIMB_RADIUS * 1.2`, `HIP_WIDTH` 0.16, `SHOULDER_WIDTH` 0.38).
Other builds are named multiplier tables on Average:

| Build | leg | torsoH | torsoW | depth | arm | limbR | shoulder |
|---|---|---|---|---|---|---|---|
| Tall | 1.2 | 1.12 | 1 | 1 | 1.12 | 1 | 1 |
| Lanky | 1.25 | 1.15 | 0.82 | 0.85 | 1.25 | 0.8 | 0.85 |
| Short | 0.68 | 0.88 | 1 | 1 | 0.85 | 1 | 1 |
| Round | 0.8 | 1 | 1.35 | 1.6 | 1 | 1.1 | 1.15 |
| Stocky | 0.92 | 1 | 1.25 | 1.2 | 1 | 1.3 | 1.25 |

`headPivotHeight` = `legLength - TORSO_OVERLAP (0.05) + torsoHeight + NECK_HEIGHT (0.08)`, matching today's rig.

- [ ] **Step 1: Write the failing tests:**

```ts
it('keeps Average equal to the current rig', () => expect(bodyDims(Build.Average).legLength).toBe(0.72));
it('orders heights', () => {
  const h = (b: Build): number => headPivotHeight(bodyDims(b));
  expect(h(Build.Tall)).toBeGreaterThan(h(Build.Average));
  expect(h(Build.Lanky)).toBeGreaterThan(h(Build.Average));
  expect(h(Build.Short)).toBeLessThan(h(Build.Average));
});
it('makes Round wider, Lanky longer-armed and Stocky thicker', () => { /* torsoWidth, armLength, limbRadius vs Average */ });
it('keeps every build buildable', () => {
  for (const b of Object.values(Build)) {
    const d = bodyDims(b);
    for (const v of Object.values(d)) expect(v).toBeGreaterThan(0);
    expect(d.torsoHeight).toBeGreaterThan(d.torsoDepth); // capsule needs height above its diameter
    expect(d.legLength).toBeGreaterThan(d.legRadius * 2);
  }
});
```

- [ ] **Step 2: Run** `npx vitest run src/view/buildShapes` — expected FAIL.
- [ ] **Step 3: Implement** `bodyDims` and `headPivotHeight` in `buildShapes.ts`.
- [ ] **Step 4: Run** the same command — expected PASS.
- [ ] **Step 5: Commit** `Add body dimensions for each build`.

### Task 3: Part specs, outfits and neckwear

**Files:**
- Create: `src/view/partSpec.ts`, `src/view/outfitParts.ts`, `src/view/outfitParts.test.ts`

**Interfaces:**
- Consumes: `Outfit`, `Neckwear` (Task 1); `BodyDims` (Task 2).
- Produces, in `partSpec.ts`:

```ts
export enum Shape { Box = 'box', Capsule = 'capsule', Cylinder = 'cylinder', Cone = 'cone', Sphere = 'sphere', Torus = 'torus' }
export enum Anchor { Body = 'body', Torso = 'torso', ArmL = 'armL', ArmR = 'armR', LegL = 'legL', LegR = 'legR', Card = 'card', HandR = 'handR' }
export enum ColorSlot { Main = 'main', MainDark = 'main-dark', Accent = 'accent', Skin = 'skin', Hair = 'hair', Fixed = 'fixed' }
export type Vec3 = readonly [number, number, number];
export interface PartSpec { shape: Shape; anchor: Anchor; position: Vec3; size: Vec3; rotation: Vec3; color: ColorSlot; fixedColor: number }
```

  `size` is the primitive's full extent per axis (a capsule or cylinder uses x and z as diameters, y as height).
  `Anchor.Body` is the hip-height point on the body group (`y = legLength`), used for skirts so they do not swing
  with the legs. Positions are relative to the anchor pivot.
- Produces, in `outfitParts.ts`:

```ts
export interface OutfitLayout { torso: ColorSlot; sleeves: ColorSlot; pants: ColorSlot; parts: PartSpec[] }
export function outfitLayout(outfit: Outfit, dims: Readonly<BodyDims>): OutfitLayout;
export function neckwearParts(neckwear: Neckwear, dims: Readonly<BodyDims>): PartSpec[];
```

  Base colouring per outfit: Toga has `Skin` sleeves; Gown, Robe and Toga add a skirt cone on `Anchor.Body`; FrockCoat
  and LabCoat add tails on `Anchor.Torso` reaching below the hips; MilitaryCoat adds two epaulettes and a sash in
  `Accent`; Parka thickens the torso and sleeves; Hoodie adds a hood behind the neck; Casual adds open lapels and no
  tie. Suit and TrouserSuit have no extra parts beyond lapels. `Neckwear.None` returns `[]`.

- [ ] **Step 1: Write the failing tests:**

```ts
it('gives every outfit valid parts', () => {
  for (const o of Object.values(Outfit)) {
    const layout = outfitLayout(o, bodyDims(Build.Average));
    for (const p of layout.parts) {
      expect(Object.values(Anchor)).toContain(p.anchor);
      for (const s of p.size) expect(s).toBeGreaterThan(0);
    }
  }
});
it('hangs long garments from the hips', () => {
  for (const o of [Outfit.Gown, Outfit.Robe, Outfit.Toga]) {
    expect(outfitLayout(o, bodyDims(Build.Average)).parts.some((p) => p.anchor === Anchor.Body && p.shape === Shape.Cone)).toBe(true);
  }
});
it('drapes the toga over one shoulder only', () => {
  const sash = outfitLayout(Outfit.Toga, bodyDims(Build.Average)).parts.filter((p) => p.anchor === Anchor.Torso);
  expect(sash.every((p) => p.position[0] <= 0) || sash.every((p) => p.position[0] >= 0)).toBe(true);
  expect(outfitLayout(Outfit.Toga, bodyDims(Build.Average)).sleeves).toBe(ColorSlot.Skin);
});
it('scales with the build', () => {
  const tails = (b: Build): number => Math.min(...outfitLayout(Outfit.FrockCoat, bodyDims(b)).parts.map((p) => p.position[1] - p.size[1] / 2));
  expect(tails(Build.Tall)).toBeLessThan(tails(Build.Short));
});
it('gives every neckwear except None at least one accent part', () => {
  for (const n of Object.values(Neckwear)) {
    const parts = neckwearParts(n, bodyDims(Build.Average));
    expect(parts.length > 0).toBe(n !== Neckwear.None);
  }
  expect(neckwearParts(Neckwear.LongTie, bodyDims(Build.Average))[0].size[1]).toBeGreaterThan(neckwearParts(Neckwear.Tie, bodyDims(Build.Average))[0].size[1]);
});
```

- [ ] **Step 2: Run** `npx vitest run src/view/outfitParts` — expected FAIL.
- [ ] **Step 3: Implement** `partSpec.ts` and `outfitParts.ts`, one small builder function per outfit in a
  `Record<Outfit, (dims) => OutfitLayout>` so no function exceeds 50 lines. If the file nears 500 lines, move
  neckwear into `neckwearParts.ts`.
- [ ] **Step 4: Run** the same command — expected PASS.
- [ ] **Step 5: Commit** `Add outfit and neckwear part lists`.

### Task 4: Head frame and headwear

**Files:**
- Modify: `src/view/silhouette.ts`, `src/view/silhouette.test.ts`
- Create: `src/view/headwearParts.ts`, `src/view/headwearParts.test.ts`

**Interfaces:**
- Consumes: `decodeSilhouette` (existing), `HEAD_GRID` value 48 and `HEAD_CARD_SIZE` value 1.1 passed in as numbers
  (pure modules do not import `headCard.ts`, which imports `three`), `FaceLandmarks` (existing), `Headwear`, `PartSpec`.
- Produces:

```ts
// silhouette.ts
export interface HeadFrame { top: number; width: number; eyeY: number; eyeLeft: number; eyeRight: number }
/** Card-space metres (origin at card centre, +y up): head top, head width at the brow, eye line and eye x positions. */
export function headFrame(rows: readonly string[], landmarks: Readonly<FaceLandmarks>, cells: number, cardSize: number): HeadFrame;
// headwearParts.ts
export function headwearParts(headwear: Headwear, frame: Readonly<HeadFrame>): PartSpec[];
/** Extra height the headwear adds above frame.top, for placing the player marker. */
export function headwearHeight(headwear: Headwear): number;
```

  `top` comes from the first occupied silhouette row. When the grid is empty, `top` falls back to
  `cardSize * DEFAULT_TOP_FRACTION` (0.4) and `width` to `cardSize * DEFAULT_WIDTH_FRACTION` (0.6). Every hat part
  uses `Anchor.Card`, sits at or above `top - HAT_SINK` (sink 0.06, so hats seat into the hair rather than float), and
  sits slightly behind the card plane (`z` between -0.12 and 0). Aviators sit on `eyeY` at `z` 0.02 in front of the card.
  `Headwear.None` returns `[]`.

- [ ] **Step 1: Write the failing tests:**

```ts
// silhouette.test.ts
it('finds the head top from the first occupied row', () => {
  const rows = ['000000000000', '000ff0000000', ...Array(46).fill('0fffffffff00')];
  expect(headFrame(rows, LANDMARKS, 48, 1.1).top).toBeCloseTo(1.1 / 2 - (1 / 48) * 1.1, 5);
});
it('falls back when the grid is empty', () => {
  expect(headFrame([], LANDMARKS, 48, 1.1).top).toBeCloseTo(0.44, 5);
});
// headwearParts.test.ts
it('seats every hat on the head top', () => {
  for (const h of Object.values(Headwear).filter((v) => v !== Headwear.None && v !== Headwear.Aviators)) {
    const parts = headwearParts(h, FRAME);
    expect(parts.length).toBeGreaterThan(0);
    for (const p of parts) {
      expect(p.anchor).toBe(Anchor.Card);
      expect(p.position[1] - p.size[1] / 2).toBeGreaterThanOrEqual(FRAME.top - 0.06 - 1e-6);
    }
  }
});
it('puts aviators on the eye line in front of the face', () => {
  const lenses = headwearParts(Headwear.Aviators, FRAME);
  expect(lenses.every((p) => Math.abs(p.position[1] - FRAME.eyeY) < 0.05 && p.position[2] > 0)).toBe(true);
});
it('makes the top hat the tallest hat', () => {
  expect(headwearHeight(Headwear.TopHat)).toBeGreaterThan(headwearHeight(Headwear.Bicorne));
  expect(headwearHeight(Headwear.None)).toBe(0);
});
```

- [ ] **Step 2: Run** `npx vitest run src/view/silhouette src/view/headwearParts` — expected FAIL.
- [ ] **Step 3: Implement** `headFrame` and `headwearParts` / `headwearHeight`, one builder per headwear in a record.
- [ ] **Step 4: Run** the same command — expected PASS.
- [ ] **Step 5: Commit** `Add head frame and headwear part lists`.

### Task 5: Hand props

**Files:**
- Create: `src/view/propParts.ts`, `src/view/propParts.test.ts`

**Interfaces:**
- Consumes: `Prop`, `PartSpec`, `BodyDims`.
- Produces:

```ts
export interface PropLayout { parts: PartSpec[]; hidesHand: boolean }
export function propParts(prop: Prop, dims: Readonly<BodyDims>): PropLayout;
```

  Parts use `Anchor.HandR` (origin at the hand centre). `Prop.Mittens` returns `hidesHand: true` with one mitten on
  each hand, using `Anchor.ArmL` and `Anchor.ArmR` at `y = -armLength`. Fixed colours are named constants (gold for
  the dime and crown-style sceptre tip, orange for the chainsaw, green for the vial glow).

- [ ] **Step 1: Write the failing tests:**

```ts
it('gives every prop except None parts in the right hand', () => {
  for (const p of Object.values(Prop).filter((v) => v !== Prop.None && v !== Prop.Mittens)) {
    const layout = propParts(p, bodyDims(Build.Average));
    expect(layout.parts.length).toBeGreaterThan(0);
    expect(layout.parts.every((s) => s.anchor === Anchor.HandR)).toBe(true);
    expect(layout.hidesHand).toBe(false);
  }
  expect(propParts(Prop.None, bodyDims(Build.Average)).parts).toEqual([]);
});
it('replaces both hands with mittens', () => {
  const m = propParts(Prop.Mittens, bodyDims(Build.Lanky));
  expect(m.hidesHand).toBe(true);
  expect(new Set(m.parts.map((s) => s.anchor))).toEqual(new Set([Anchor.ArmL, Anchor.ArmR]));
  expect(m.parts[0].position[1]).toBeCloseTo(-bodyDims(Build.Lanky).armLength, 5);
});
```

- [ ] **Step 2: Run** `npx vitest run src/view/propParts` — expected FAIL.
- [ ] **Step 3: Implement** `propParts`, one builder per prop in a record.
- [ ] **Step 4: Run** the same command — expected PASS.
- [ ] **Step 5: Commit** `Add hand prop part lists`.

### Task 6: Mesh layer and rig assembly

**Files:**
- Create: `src/view/outfitMeshes.ts`
- Modify: `src/core/errors.ts` (add `RigBuildError extends GameError`), `src/view/bobbleheadParts.ts`,
  `src/view/fighterModel.ts`, `src/view/fighterView.ts` (`dispose`)
- Test: none new (Three.js adapter); verified by typecheck, the existing suite and Task 7 screenshots.

**Interfaces:**
- Consumes: everything from Tasks 1 to 5; `creditFor` landmarks and silhouette (already passed to `buildFighterRig`).
- Produces:

```ts
// bobbleheadParts.ts: base geometry per build, cached once per build
export function bodyGeometry(dims: Readonly<BodyDims>, build: Build, name: 'limb' | 'leg' | 'torso' | 'neck' | 'hand' | 'shoe'): THREE.BufferGeometry;
export function partGeometry(name: 'star' | 'ring' | 'marker'): THREE.BufferGeometry;
// outfitMeshes.ts
export class MaterialSet { constructor(look: Readonly<FighterLook>, tone: number); get(slot: ColorSlot, fixedColor: number): THREE.MeshStandardMaterial; all(): THREE.MeshStandardMaterial[]; dispose(): void }
export function attachParts(parts: readonly PartSpec[], anchors: ReadonlyMap<Anchor, THREE.Object3D>, materials: MaterialSet): void;
```

  - `attachParts` throws `RigBuildError` when a part names an anchor missing from the map.
  - Part geometry is cached module-wide by shape and size key (shared, never disposed).
  - `MaterialSet` is created per rig, so materials are never shared across fighters (Review Focus 1). `MainDark` is
    the main colour times the existing `PANTS_DARKEN` 0.7.
  - `buildFighterRig` uses `bodyDims(def.look.build)` for every pivot and length instead of the fixed constants. It
    applies `outfitLayout` colours to the torso, sleeves and legs, moves the tie into `neckwearParts`, and hides the
    right and left hand meshes when `hidesHand` is set. It places the marker at
    `headPivotHeight + HEAD_CARD_SIZE + headwearHeight + MARKER_GAP`.
  - `flashMaterials` becomes `materials.all()`, so outfit parts flash too.
  - `FighterView.dispose` disposes the head card and the rig's `MaterialSet` only.

- [ ] **Step 1: Implement** the above. Keep `fighterModel.ts` under 200 lines by keeping part building in
  `outfitMeshes.ts`.
- [ ] **Step 2: Run** `npm run typecheck && npm test` — expected PASS with every existing test unchanged.
- [ ] **Step 3: Run** `npm run build` — expected success, bundle growth under 20 kB gzip for `index-*.js`.
- [ ] **Step 4: Commit** `Build fighter outfits, hats and props on the rig`.

### Task 7: Lineup page, visual checks, docs

**Files:**
- Create: `lineup.html`, `src/dev/lineupScene.ts` (dev-only page; `vite build` only bundles `index.html`)
- Modify: `README.md` (structure and status), `CHANGELOG.md` (`## [Unreleased]` / Added), `ROADMAP.md` (piece 1 status)

**Interfaces:**
- Consumes: `FighterView`, `ROSTER`, `fightersIn`, `CATEGORY_ORDER`, the arena and lighting setup from `matchView`.
- Produces: `/lineup.html?category=<politicians|tycoons|legends>&pose=<idle|ko>` showing that category's 12 fighters in
  a row facing the camera in the given pose.

- [ ] **Step 1: Implement** the lineup page with the match lighting and post chain so ambient occlusion is included.
- [ ] **Step 2: Screenshot** with the scratchpad Playwright setup (`CHROME_EXE` = cached Chrome for Testing) against
  `npx vite --port 5196`: each category in `idle` and `ko`, at 1280x720 and 390x844. Check distinct silhouettes; hats
  seated without gaps or clipping; props in the right hand; mittens on Sanders; no garment sinking through the floor
  in `ko`.
- [ ] **Step 3: Screenshot** a 4v4 match via `vite preview` in each arena: the marker sits above the tallest hat; the
  camera keeps a boss Churchill and a Tall fighter in frame.
- [ ] **Step 4: Measure** frames per second over 10 seconds of a 4v4 at 390x844 on this build and on `main` (0.2.3).
  Accept a drop of at most 10 percent.
- [ ] **Step 5: Update** the README, CHANGELOG and ROADMAP; run `harness-check`.
- [ ] **Step 6: Commit** `Add lineup preview page and document character looks`.

### After the tasks

- [ ] Record the build with `loop-state record --stage build`; spawn one `qa` agent with the spec and plan paths
  only. It writes `.loop/character-looks/qa-1.md`; fix blocking findings (at most 2 rounds).
- [ ] Push, open a PR into `develop` with the acceptance evidence and QA report summary, merge with a merge commit,
  delete the branch.
- [ ] Release 0.3.0 per Git Flow (`release/0.3.0`, version bump, dated changelog, PR into `main`, tag, GitHub
  release, PR back into `develop`). The user runs `npm run deploy`.
