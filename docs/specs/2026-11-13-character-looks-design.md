# Character Looks: Design

This spec covers piece 1 of the enhancement roadmap: every fighter gets their own body type, outfit, neckwear,
headwear and hand prop, built procedurally from Three.js primitives. Looks are visual only; the fight simulation,
hit areas and balance do not change. It targets release 0.3.0.

## Goal

Make all 36 fighters recognisable by silhouette, not just by face. Lincoln reads as tall and thin with a top hat,
Napoleon as short with a bicorne, Churchill as round with a homburg and cigar, from across the arena and on a phone.

## Decisions

- Body shape varies per fighter (option B), via six body-type presets that stretch the existing parts.
- Outfits are built in code from primitives (approach A): no imported models, no external art, no licences.
- Looks are visual only. Stats keep driving health, damage and speed; the boss size scale stays as it is.
- Everything is generic: no logos, slogans or brand names on any item.
- The photo hair is the hairstyle; there are no wigs.

## Data model

`FighterLook` in `roster/rosterTypes.ts` grows from four colours to:

```ts
interface FighterLook {
  build: Build;
  outfit: Outfit;
  neckwear: Neckwear;
  headwear: Headwear;
  prop: Prop;
  suitColor: number;   // main colour: the outfit
  accentColor: number; // neckwear and trim
  skinColor: number;
  hairColor: number;
}
```

The enums live in a new `roster/lookTypes.ts`. `defineFighter` takes the extra fields so each category file stays
one line per fighter.

## Catalogue

| List | Values |
|---|---|
| `Build` | Average, Tall, Lanky, Short, Round, Stocky |
| `Outfit` | Suit, TrouserSuit, FrockCoat, MilitaryCoat, Toga, Gown, Doublet, Robe, LabCoat, Parka, Turtleneck, Hoodie, LeatherJacket, Casual |
| `Neckwear` | None, Tie, LongTie, BowTie, Ruff, Cravat, GoldCollar |
| `Headwear` | None, TopHat, Bicorne, Crown, Laurel, EgyptianHeaddress, Homburg, RenaissanceCap, Aviators |
| `Prop` | None, Cigar, Sceptre, Quill, Apple, Chalk, Baton, Vial, Paintbrush, CoilWand, Sword, Snake, Chainsaw, Mittens, Burger, ToyRocket, Dime, Microphone |

Body types:

| Build | Shape |
|---|---|
| Average | today's proportions |
| Tall | longer legs and torso |
| Lanky | tall and thin, long arms |
| Short | short legs, same head |
| Round | wide belly, short legs |
| Stocky | broad shoulders, thick limbs |

Notes:
- Mittens replace the hands rather than being held.
- Aviators sit over the eyes, so the closed-eye knockout face is hidden for Biden; accepted.

## Assignments

Colours stay as in the current roster; the outfit uses the main colour, neckwear and trim the accent colour.
Gown colours: Cleopatra white, Victoria black, Curie dark. Mozart's frock coat is red.

| Fighter | Build | Outfit | Neckwear | Headwear | Prop |
|---|---|---|---|---|---|
| Donald Trump | Tall | Suit | LongTie | None | None |
| Joe Biden | Average | Suit | Tie | Aviators | None |
| Barack Obama | Tall | Suit | Tie | None | None |
| Bernie Sanders | Average | Parka | None | None | Mittens |
| Boris Johnson | Stocky | Suit | Tie | None | None |
| Keir Starmer | Average | Suit | Tie | None | None |
| Emmanuel Macron | Average | Suit | Tie | None | None |
| Angela Merkel | Average | TrouserSuit | None | None | None |
| Justin Trudeau | Tall | Suit | Tie | None | None |
| Giorgia Meloni | Short | TrouserSuit | None | None | None |
| Javier Milei | Average | Suit | Tie | None | Chainsaw |
| Winston Churchill (boss) | Round | Suit | BowTie | Homburg | Cigar |
| Elon Musk | Tall | Casual | None | None | ToyRocket |
| Jeff Bezos | Stocky | Casual | None | None | None |
| Bill Gates | Average | Casual | None | None | None |
| Mark Zuckerberg | Short | Hoodie | None | None | None |
| Warren Buffett | Round | Suit | BowTie | None | Burger |
| Richard Branson | Average | Casual | None | None | None |
| Larry Ellison | Average | Suit | None | None | None |
| Jensen Huang | Average | LeatherJacket | None | None | None |
| Oprah Winfrey | Average | Casual | None | None | Microphone |
| Steve Jobs | Lanky | Turtleneck | None | None | None |
| Jack Ma | Short | Suit | Tie | None | None |
| John D. Rockefeller (boss) | Stocky | FrockCoat | Cravat | None | Dime |
| Albert Einstein | Average | LabCoat | None | None | Chalk |
| Isaac Newton | Average | FrockCoat | Cravat | None | Apple |
| Leonardo da Vinci | Average | Robe | None | RenaissanceCap | Paintbrush |
| William Shakespeare | Average | Doublet | Ruff | None | Quill |
| Cleopatra | Average | Gown | GoldCollar | EgyptianHeaddress | Snake |
| Julius Caesar | Average | Toga | None | Laurel | Sword |
| Abraham Lincoln | Lanky | FrockCoat | BowTie | TopHat | None |
| Queen Victoria | Round | Gown | None | Crown | Sceptre |
| Marie Curie | Average | Gown | None | None | Vial |
| Nikola Tesla | Lanky | FrockCoat | Tie | None | CoilWand |
| Wolfgang Amadeus Mozart | Short | FrockCoat | Cravat | None | Baton |
| Napoleon Bonaparte (boss) | Short | MilitaryCoat | None | Bicorne | Sword |

## Architecture

A look becomes a model in two steps.

1. **Pure part lists.** Code with no Three.js imports turns a look into body dimensions and a list of `PartSpec`
   entries: a primitive shape, an anchor bone, a position, a size and a colour slot.
2. **Thin mesh layer.** A Three.js adapter builds the meshes from the specs and attaches them to the rig.

```ts
type Anchor = 'body' | 'hips' | 'torso' | 'armL' | 'armR' | 'legL' | 'legR' | 'head' | 'handR';
type ColorSlot = 'main' | 'accent' | 'skin' | 'hair' | 'fixed';
interface PartSpec {
  shape: 'box' | 'capsule' | 'cylinder' | 'cone' | 'sphere' | 'torus';
  anchor: Anchor;
  position: readonly [number, number, number];
  size: readonly [number, number, number];
  rotation: readonly [number, number, number];
  color: ColorSlot;
  fixedColor: number; // used when color is 'fixed', e.g. gold, leaf green, chainsaw orange
}
```

| File | Responsibility |
|---|---|
| `roster/lookTypes.ts` | Enums for builds, outfits, neckwear, headwear and props |
| `view/buildShapes.ts` | Build to body dimensions (leg, torso, arm lengths, widths, limb radius); pure, tested |
| `view/outfitParts.ts` | Outfit and neckwear to part specs; pure, tested |
| `view/headwearParts.ts` | Headwear to part specs, placed from the head top; pure, tested |
| `view/propParts.ts` | Prop to part specs in the right hand; pure, tested |
| `view/outfitMeshes.ts` | Part specs to meshes; caches geometry per shape and size, materials per colour |
| `view/bobbleheadParts.ts` | Base geometry becomes per-build, cached once per build |
| `view/fighterModel.ts` | Assembles the body from build dimensions and attaches the parts |

Rig integration:
- **Body types:** the fixed `LEG_LENGTH`, `TORSO_HEIGHT` and similar constants become per-build dimensions. The
  head card, silhouette and expressions are unchanged.
- **Headwear:** anchored to the head group at the top of the face silhouette (from the credit silhouette rows), so
  hats billboard, wobble and squash with the face.
- **Long garments** (Robe, Gown, Toga, the frock-coat tails): skirts hang from the hips; legs still animate
  underneath so kicks poke out.
- **Props:** attached to the right hand and swing with punches. Mittens replace the hand meshes.
- **Hit flash:** outfit materials join `flashMaterials` so the whole fighter still flashes on hits.
- **Simulation:** untouched. `combatProfile`, hit areas and `sizeScale` stay as they are.

Performance: geometries are shared per shape and size, and materials per colour, so a 4v4 adds only a modest
number of draw calls. Target: no visible frame-rate drop against 0.2.3 in a phone-sized 4v4.

## Error handling

The roster validation in `roster.ts` rejects a fighter whose look has an unknown enum value, throwing
`RosterDataError`. A part spec that names an unknown anchor throws a domain error at rig build time, not silently.

## Testing

Unit tests (pure, no Three.js):
- `buildShapes`: Tall is taller than Average, Short shorter, Round wider, Lanky has longer arms; feet stay on the
  floor and the neck stays under the head for every build.
- Part lists: every outfit, neckwear, headwear and prop value yields at least one part, except `None`. Every part
  names a valid anchor. Skirts start at the hips. The toga covers one shoulder only.
- Roster: all 36 fighters have a complete, valid look.
- Fight tests pass unchanged, confirming no balance change.

In-game checks:
- Headless screenshots of a lineup of all 36 fighters and of sample matches in each arena.
  - Distinct silhouettes per category.
  - Hats seated on the head without gaps or clipping into the face.
  - Props in the right hand; long garments not swallowing kicks.
- A knockout fall for each build: hats stay attached and gowns do not fold through the floor.
- A phone-sized 4v4 frame-rate comparison against 0.2.3.

## Out of scope

- Special moves, taunts, entrances and celebrations: piece 2.
- New fighters and their items (Netanyahu, Khamenei, Edison, Xi, the Celebrities category, the goat and the pig,
  animal bodies): piece 3.
- Rivalry Battles and Special Edition: piece 4.

## Delivery

Process: plan, build, QA, then a PR into `develop`. Then release 0.3.0; the user runs the deploy.
