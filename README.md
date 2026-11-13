# Ballot Brawl

An unofficial, slapstick parody brawler for phone and desktop browsers. Bobblehead caricatures of
politicians, tycoons and historical legends fight in teams of up to four, with punches, kicks, a
defend that blocks all damage, and a power meter that unlocks a big finishing hit.

Ballot Brawl is satire. It is not affiliated with, endorsed by or meant to represent the views of
anyone depicted. There is no gore: knocked-out fighters just fall over.

## Status

Playable: Story and Brawl modes, 36 fighters, three arenas. See [ROADMAP.md](ROADMAP.md).

## Modes

- **Brawl**: 1v1 up to 4v4, every slot set to Player 1, Player 2 or CPU.
- **Story**: choose Politicians, Tycoons or Legends, pick a fighter and beat 10 opponents in a row,
  ending with the boss (Churchill, Rockefeller or Napoleon). Each fight is harder than the last; you
  get three continues. Beat the boss and you saved the world. The score comes from the damage you take
  across the run (plus stage clears and perfect fights), with an S to D rank and a saved best score.

## Fighting

- **Punch** is quick, **Kick** is slower with more reach and knockback.
- **Defend** (hold) takes no damage at all, but blocked hits drain your guard; an empty guard breaks
  and leaves you dizzy.
- Dealing, taking and blocking hits fills the **power meter**. When it is full, **Finisher** unleashes a
  slow, heavy signature move that does several times a kick's damage (no gore, just a big hit).
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
| Swap teammate | U | ' | LB | Swap button |

## Setup

Requires Node 22 or newer and read access to the private engine repository.

```bash
npm install
npm run dev        # http://localhost:5175, also reachable from a phone on the same network
npm test
npm run build
```

## Deploy

The site is static. `npm run deploy:preview` builds locally and uploads `dist/` to Vercel (run
`npx vercel login` once); `npm run deploy` publishes to production.

## Images and licence

Code is MIT licensed (see [LICENSE](LICENSE)). Face images in `public/faces/` are **not** covered by
the MIT licence. Each is a cropped, resized and oval-masked derivative of a public domain or freely
licensed photo on Wikimedia Commons, and keeps that photo's licence (images from CC BY-SA sources are
shared under the same CC BY-SA licence). Author, licence and source of every image are listed in
`src/roster/credits.json` and on the in-game credits screen.

To change a face, edit `scripts/faces/faceSources.json` (a Commons file name and an optional crop) and
run `npm run faces` (add `-- --detect` on macOS to find the face automatically). Non-free licences
are rejected by the script.
