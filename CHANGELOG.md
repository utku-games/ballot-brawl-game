# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses semantic versioning.

## [Unreleased]

### Added
- Signature finishers: every fighter's finisher now has a style. Smash hits hard in a wide arc, Rush dashes through
  everyone in its path, Throw sends a themed projectile flying (Newton's apple, Musk's rocket, Tesla's lightning bolt,
  Mozart's music note and more), and Quake slams the ground to hit everyone nearby.
- Taunt: a new button (H, ;, gamepad B, on-screen Taunt). A taunt that ends without being hit earns power.
- Personal gestures: each fighter has one (Churchill's V sign, Merkel's hand diamond, Mozart conducting, Napoleon's
  salute and more), shown in the match intro, while taunting and as their win celebration.
- Quake shockwaves, rush dust trails, and new throw, taunt and power-up sounds.

### Changed
- Gamepad B is now Taunt; Y stays Finisher.
- The match intro is a little longer so every fighter can show off.

## [0.3.0] - 2026-11-13

### Added
- Every fighter has their own body type (average, tall, lanky, short, round or stocky) and costume: suits, frock
  coats, a toga, gowns, a lab coat, a parka, hoodies and more, with neckwear, hats and a signature hand prop such as
  Lincoln's top hat, Napoleon's bicorne and sword, Churchill's homburg and cigar, and Sanders' mittens.
- Costumes flash on hits, swing with punches and stay on through knockouts.
- A development lineup page (`lineup.html`) to check every fighter's costume side by side.

## [0.2.3] - 2026-11-13

### Fixed
- Heads are solid again: each head's geometry is now cut to the face's own silhouette, so ambient occlusion sees the
  real head shape without the see-through look or a square behind it.

## [0.2.2] - 2026-11-13

### Fixed
- Story mode: the third lost fight now ends the run and shows the score; before, "See score" started a hidden
  fourth fight. Continues are shown as lives.
- No more dark square behind the photo heads: the ambient-occlusion pass skips the head cards.
- Heads are cut along the face outline: necks, collars and raised shoulders are removed, and hair tapers into the face.

## [0.2.1] - 2026-11-13

### Fixed
- Photo heads no longer show a faint square around them: near-transparent pixels are cleared and the head uses a
  hard cut-out edge.
- Necks and collars are cut away along each face's detected jawline instead of a straight line under an estimated chin.

## [0.2.0] - 2026-11-13

### Added
- Photo heads are now background-free sticker cut-outs with a white outline that always face the camera.
- Live facial expressions: fighters wince and squash when hit, shut their eyes under circling stars when knocked out
  or dizzy, and grin when they win.
- End-of-match poses: winners cheer with pumping fists and jumps, the losing side slumps.

### Fixed
- Knocked-out fighters now fall to the floor and stay down, including the final knockout of a match.
- The camera keeps knocked-out fighters in view after the match ends.

## [0.1.0] - 2026-11-13

### Added
- Project scaffold: Vite, TypeScript and Three.js on the shared `@utku/engine` v0.2.0.
- Arena bounds with a tested clamp shared by the simulation and the view.
- Vercel deploy script, harness config, architecture contract and roadmap.
- Deterministic team fight simulation for 1v1 up to 4v4: punch, kick, defend (no damage, drains guard),
  guard breaks, combo knockdowns, a power meter and a finisher, knockouts and time over.
- CPU brain with skill levels from easy to boss, seeded so matches replay identically.
- Roster of 36 caricatures in three categories (Politicians, Tycoons, Legends), each with a boss.
- Story ladder of ten rising-difficulty opponents ending with the boss, continues, and a score based on
  the damage taken across the run.
- Face pipeline: downloads Commons photos, rejects non-free licences, crops the head (macOS Vision helper
  for detection), feathers an oval mask and writes WebP faces plus credits with author, licence and tone.
- Faces and credits for all 36 fighters.
- 3D bobblehead fighters: suit, tie and limbs in roster colours, a big head wearing the photo face that
  keeps looking at the camera, procedural animation from move frame data and a springy head wobble.
- Three arenas (The Chamber, The Trading Floor, The Grand Gallery), a camera that frames every fighter,
  screen shake, finisher zoom and slow motion, and particle bursts for hits, blocks and knockdowns.
- HUD with portraits and health bars for every fighter, timer, power and guard bars and announcements.
- Keyboard (two players), gamepad and touch controls with Punch, Kick, Defend, Finisher and Swap buttons.
- Synthesised sound effects for swings, hits, blocks, finishers and knockouts.
- Title menu, pause menu and credits screen listing every face's author, source and licence.
- Brawl mode: 1v1 up to 4v4, any fighter or Random per slot, Player 2 on any slot, CPU difficulty and arena.
- Story mode: pick a league and a fighter, climb ten rising-difficulty opponents to the boss, three
  continues, "You saved the world!" ending with a damage-based score, rank and saved best per league.
- Menus work with mouse, touch, keyboard and gamepad; web manifest and icons for home-screen install.
- Faces fill the whole front of the head: tighter crops, a near-solid mask, 320 px textures.
- On-screen fight buttons on every device (mouse clicks work too) and one-tap 1v1 to 4v4 team size buttons.
