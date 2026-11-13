# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses semantic versioning.

## [Unreleased]

## [0.13.0] - 2026-11-13

### Changed
- Online: both sides ping once a second, so a phone that loses signal or a frozen tab shows "Connection lost"
  after 8 seconds instead of hanging. The host can start a rematch only once the guest is back in the lobby
  (the lobby says so while waiting). The guest checks every streamed fight state in depth before drawing it.
  Online protocol version 2: both players need the updated game.

### Fixed
- The goat and camel faces no longer carry background patches (the goat's white body behind its horn, a second
  camel beside the first): the face pipeline takes hand-drawn erase polygons per face.
- Phone HUD with four sides: health bars split two per side instead of one and three, rows shrink when a column
  holds more than two fighters, and the touch pause button sits under the timer so no health bar covers it.
- The Rooftop: a fighter left teetering past the wall line after a hit stays where the knockback left them instead
  of snapping back inside; they still cannot walk off.

## [0.12.0] - 2026-11-13

### Added
- Online 1v1 (beta): play a friend on another device. One player hosts a room and shares its five-character code
  or an invite link (`?join=CODE`); the other joins. In the lobby both pick fighters and the host picks the arena
  and items, then starts the fight; after each fight both return to the lobby. Connections are peer-to-peer
  (WebRTC through PeerJS and its free public signalling server); the host runs the fight and streams it to the
  guest, so a phone and a laptop always see the same fight. Leaving or closing the page tells the other player.

## [0.11.0] - 2026-11-13

### Added
- Sharing: every result screen (Rivalry Battles, Brawl, Party and the end of a Story run) has a Share button. On
  phones it opens the share sheet with a result card image (the fighters' faces, the winner ringed in gold, the
  headline and the parody disclaimer); on desktops it copies the message and link and saves the card image.
- Challenge links: `?rivalry=<id>` opens that rivalry's side picker, and `?duel=<fighter>~<fighter>` opens a
  one-on-one Brawl setup with those two fighters. The rivalry side picker has a Share challenge button, and a
  shared one-on-one Brawl result links to a rematch. Unknown fighters, bosses and broken links open the title.

## [0.10.0] - 2026-11-13

### Added
- Music: a menu theme and one song per arena (a march for The Chamber, an electronic run for The Trading Floor, a
  waltz for The Grand Gallery, disco for The Studio and rock for The Rooftop). Fights start calm, drive during the
  fight and peak in the last 15 seconds or when a side is close to defeat. The Sound toggle mutes music too.
- Unlocks: each league's boss (Churchill, Rockefeller, Napoleon, Schwarzenegger) becomes playable in Brawl and Party
  once you win that league's story; locked bosses show greyed out with a hint, and the victory screen announces the
  unlock.
- Trophies: a new title-menu screen with leagues won, rivalries settled and bosses unlocked.

## [0.9.0] - 2026-11-13

### Added
- Three more Specials: Larry the Cat (Downing Street's Chief Mouser), a bull and a chicken that throws eggs.
- Three more Special Edition matchups: The Chief Mouser (Keir Starmer vs Larry), Bull Market (Warren Buffett vs the
  bull) and Free Range (Gordon Ramsay vs the chicken).

### Changed
- The face pipeline also accepts photos under the "OGL v1.0" spelling of the UK Open Government Licence.

### Fixed
- Beyoncé's face now comes from a clean, front-facing photo (no microphone over her mouth).
- Caesar's laurel is a wreath of leaves from temple to temple instead of a ring above his head.
- The health bars rewind with the knockout replay instead of showing the end of the match.
- The face pipeline fetches a fighter's photo again when its source file changes, instead of reusing the old one.

## [0.8.0] - 2026-11-13

### Added
- Party: a free-for-all mode for three or four fighters, each on their own side in their own colour (blue, red,
  green, gold); the last one standing wins, or the healthiest at time over. Items, hazards and every arena are
  available, including The Rooftop for ring-outs.

### Changed
- The Brawl and Party result screens offer "Change setup" instead of "Change teams".

### Added
- The Rooftop: a new Brawl arena, an open platform above the city with no walls. Hard hits near the edge knock
  fighters off for a ring-out, which counts as a knockout; walking never takes anyone over.

## [0.7.0] - 2026-11-13

### Added
- Brawl items: briefcases, gavels and money bags appear on the floor; walk over one to pick it up and Punch to throw it.
- Brawl hazards: a cartoon anvil drops where a red ring warns, knocking down anyone underneath on either team.
- A Brawl setup toggle for items and hazards (on by default; Story and Rivalry Battles stay without them).
- Flying knockouts: a knockout from a finisher or an anvil launches the loser into the air with a spin.
- Knockout replay: the last seconds before the final knockout play back in slow motion; attack buttons skip it.

### Changed
- David Cameron, former UK prime minister, joins the Politicians and takes the pig matchup in the Special Edition
  (now The Pork Barrel). James Cameron, added by mistake, leaves the Celebrities.

## [0.6.0] - 2026-11-13

### Added
- Rivalry Battles: a new mode of one-on-one grudge matches in two sections. Rivalries include The War of the
  Currents (Edison vs Tesla), The Tariff Tussle (Trump vs Xi), The Cage Match (Musk vs Zuckerberg), The Space Race,
  The Garage Rivals, The Rematch, Question Time, The G.O.A.T. Debate and The Feud. The Special Edition has The G.O.A.T.
  Summit (Shehbaz Sharif vs a goat), Pigtanic (James Cameron vs a pig) and The Desert Derby (Erdoğan vs a camel).
- Rivalry twists: Blackout (flickering lights), Turbo (faster fighters) and Heavy Hitters (harder hits).
- The rivalry title opens each rivalry fight; won rivalries are saved as settled.
- The title screen's controls hint now lists the Taunt keys.

## [0.5.0] - 2026-11-13

### Added
- Six new fighters in the existing leagues: Benjamin Netanyahu, Ali Khamenei, Xi Jinping, Shehbaz Sharif and
  Recep Tayyip Erdoğan join the Politicians, and Thomas Edison (throwing light bulbs) joins the Legends.
- A Celebrities story league with its own arena, The Studio: Taylor Swift, Beyoncé, Cristiano Ronaldo, Lionel Messi,
  Dwayne Johnson, Snoop Dogg, Lady Gaga, Gordon Ramsay, Keanu Reeves, James Cameron and Kim Kardashian, with
  Arnold Schwarzenegger as boss.
- Specials for Brawl: a goat, a pig and a camel.
- New costume pieces (sports jersey, fur, phone) and thrown footballs, light bulbs and frying pans.

## [0.4.0] - 2026-11-13

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
