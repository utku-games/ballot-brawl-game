# Ballot Brawl

An unofficial, slapstick parody brawler for phone and desktop browsers. Bobblehead caricatures of
politicians, tycoons and historical legends fight in teams of up to four, with punches, kicks, a
defend that blocks all damage, and a power meter that unlocks a big finishing hit.

Ballot Brawl is satire. It is not affiliated with, endorsed by or meant to represent the views of
anyone depicted. There is no gore: knocked-out fighters just fall over.

## Status

Playable: Story and Brawl modes, 36 fighters with their own body types and costumes, three arenas. See
[ROADMAP.md](ROADMAP.md).

## Modes

- **Brawl**: 1v1 up to 4v4, every slot set to Player 1, Player 2 or CPU.
- **Story**: choose Politicians, Tycoons or Legends, pick a fighter and beat 10 opponents in a row,
  ending with the boss (Churchill, Rockefeller or Napoleon). Each fight is harder than the last; you
  have three lives: the third lost fight ends the run and shows your score. Beat the boss and you saved the world. The score comes from the damage you take
  across the run (plus stage clears and perfect fights), with an S to D rank and a saved best score.

## Fighting

- **Punch** is quick, **Kick** is slower with more reach and knockback.
- **Defend** (hold) takes no damage at all, but blocked hits drain your guard; an empty guard breaks
  and leaves you dizzy.
- Dealing, taking and blocking hits fills the **power meter**. When it is full, **Finisher** unleashes the
  fighter's signature move (no gore, just a big hit), in one of four styles:
  - **Smash**: a heavy close hit in a wide arc.
  - **Rush**: a dash that ploughs through everyone in its path.
  - **Throw**: a themed projectile (an apple, a rocket, a burger, a lightning bolt...) that hits the first enemy it
    reaches; defending blocks it.
  - **Quake**: a ground slam that hits every enemy close by, even behind you.
- **Taunt** shows off your fighter's personal gesture. Finish it without being hit and you earn a chunk of power;
  get hit and you earn nothing. The same gesture plays in the match intro and when your team wins.
- In team fights, **Swap** jumps to your next teammate; if your fighter is knocked out you switch
  automatically.

## Controls

| Action | Keyboard P1 | Keyboard P2 | Gamepad | Touch |
|---|---|---|---|---|
| Move | WASD | Arrows | Left stick / D-pad | Left thumb joystick |
| Punch | J | , | X | Punch button |
| Kick | K | . | A | Kick button |
| Defend (hold) | L | / | RB | Defend button |
| Finisher (meter full) | I | Right Shift | Y | Finisher button |
| Taunt | H | ; | B | Taunt button |
| Swap teammate | U | ' | LB | Swap button |

## Setup

Requires Node 22 or newer and read access to the private engine repository.

```bash
npm install
npm run dev        # http://localhost:5175, also reachable from a phone on the same network
npm test
npm run build
```

## Costumes

Each roster entry has a `kit`: build, outfit, neckwear, headwear and hand prop, chosen from the catalogue in
`src/roster/lookTypes.ts`. Pure modules in `src/view` (`buildShapes`, `outfitParts`, `neckwearParts`,
`headwearParts`, `propParts`) turn a kit into simple 3D shapes; `outfitMeshes.ts` builds them on the fighter.
Looks are visual only and never change the fight.

With `npm run dev` running, `http://localhost:5175/lineup.html?category=legends&half=0&pose=idle` shows six fighters
of a category side by side (`half` 0 or 1, `pose` idle, punch, ko, gesture or finisher) to check costumes, gestures
and finisher poses. The page is never part of
the production build.

## Deploy

The site is static. `npm run deploy:preview` builds locally and uploads `dist/` to Vercel (run
`npx vercel login` once); `npm run deploy` publishes to production.

## Images and licence

Code is MIT licensed (see [LICENSE](LICENSE)). Face images in `public/faces/` are **not** covered by
the MIT licence. Each is a derivative (background removed, cropped, resized, outlined) of a public domain or freely
licensed photo on Wikimedia Commons, and keeps that photo's licence (images from CC BY-SA sources are
shared under the same CC BY-SA licence). Author, licence and source of every image are listed in
`src/roster/credits.json` and on the in-game credits screen.

To change a face, edit `scripts/faces/faceSources.json` (a Commons file name and an optional crop) and
run `npm run faces`. Add `-- --analyze` on macOS to lift the subject from the background and find the face, eyes
and mouth with the Vision framework (stored in `faceSources.json`, so later runs work anywhere). Non-free
licences are rejected by the script.
