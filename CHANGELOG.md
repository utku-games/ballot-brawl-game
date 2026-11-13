# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses semantic versioning.

## [Unreleased]

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
