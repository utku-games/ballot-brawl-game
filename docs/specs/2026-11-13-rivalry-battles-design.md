# Rivalry Battles: Design

Piece 4 of the enhancement roadmap: a new main-menu mode of hand-picked 1v1 grudge matches. It has two sections:
- **Rivalries:** famous real rivalries and feuds.
- **Special Edition:** the user's joke matchups. More will be added later.

The user chose some of the matchups: Edison vs Tesla, Trump vs Xi, Musk vs Zuckerberg, Shehbaz Sharif vs a goat, James Cameron vs a pig, and Erdoğan vs a camel. They delegated the rest of the design, so the other choices were made without a review round.

## Rules

- **Netanyahu and Khamenei are never paired.** The rivalry data is validated at load, and the game refuses to start if that pairing exists.
- **Every rivalry has:**
  - two distinct roster fighters
  - a title and a one-line tagline
  - an arena and a section
  - a twist.
- **No war or violence references** beyond the game's slapstick. Taglines describe the rivalry, not real conflicts.

## Matchups

| Section | Left | Right | Title | Arena | Twist |
|---|---|---|---|---|---|
| Rivalries | Thomas Edison | Nikola Tesla | The War of the Currents | Museum | Blackout |
| Rivalries | Donald Trump | Xi Jinping | The Tariff Tussle | Parliament | None |
| Rivalries | Elon Musk | Mark Zuckerberg | The Cage Match | Trading Floor | Heavy Hitters |
| Rivalries | Elon Musk | Jeff Bezos | The Space Race | Trading Floor | Turbo |
| Rivalries | Steve Jobs | Bill Gates | The Garage Rivals | Trading Floor | None |
| Rivalries | Joe Biden | Donald Trump | The Rematch | Parliament | None |
| Rivalries | Boris Johnson | Keir Starmer | Question Time | Parliament | None |
| Rivalries | Cristiano Ronaldo | Lionel Messi | The G.O.A.T. Debate | Studio | Turbo |
| Rivalries | Taylor Swift | Kim Kardashian | The Feud | Studio | None |
| Special Edition | Shehbaz Sharif | Goat | The G.O.A.T. Summit | Parliament | None |
| Special Edition | James Cameron | Pig | Pigtanic | Studio | Heavy Hitters |
| Special Edition | Recep Tayyip Erdoğan | Camel | The Desert Derby | Museum | Turbo |

**Twists:**
- **None:** a normal fight.
- **Blackout:** the arena lights flicker on and off; view only.
- **Turbo:** both fighters move 35% faster.
- **Heavy Hitters:** both fighters deal 50% more damage.

## Flow

1. The title menu gains **Rivalry Battles**, between Story and Brawl.
2. The rivalry screen lists both sections. Each card shows the two portraits with "VS", the title, the tagline, the twist and a "Settled" mark once the player has won it.
3. Choosing a rivalry opens a side picker: play as either fighter, plus CPU difficulty (Easy, Normal, Hard).
4. In the fight, the match intro shows the rivalry title instead of "READY?" while both fighters do their gestures.
5. **The result screen:**
   - It reads "Rivalry settled!" or "Rivalry continues...".
   - It offers Rematch, Other rivalries and Main menu.
   - A win is saved per rivalry.

## Architecture

| File | Responsibility |
|---|---|
| `rivalry/rivalryTypes.ts` | `RivalrySection`, `Twist`, `Rivalry` types |
| `rivalry/rivalries.ts` | the matchup table and `validateRivalries`, run at load |
| `rivalry/twists.ts` | pure twist rules: `twistModifiers(twist)` for speed and damage, `blackoutLight(twist, seconds)` for lighting |
| `game/rivalryPlan.ts` | `rivalryMatchPlan(rivalry, side, difficulty, seed)`, a pure MatchPlan builder |
| `ui/screens/rivalryScreens.ts` | rivalry list and side picker |

Changes to existing code:
- `MatchPlan` gains `banner: string | null` and `twist: Twist`.
- Brawl and story plans set `null` and `Twist.None`.
- `buildMatchSetup` applies the twist's speed and damage multipliers to the combat profiles.
- `MatchSession` shows the banner during the intro and drives the blackout lighting through `MatchView`. The lights are reset when the match ends.
- `SaveData` gains `rivalriesWon: string[]`, with `recordRivalryWin`.
- The title-screen controls hint now includes the Taunt keys.

## Testing

- **Rivalries:**
  - every fighter exists and the two are different
  - titles and ids are unique
  - both sections are present
  - Netanyahu vs Khamenei is rejected
  - the user's six matchups are present.
- **Twists:** Turbo raises speed, Heavy Hitters raises damage, None changes nothing, and Blackout light levels stay within 0..1 and go dark at times.
- **Plan:** the player gets the chosen side, the CPU the other; twist multipliers reach the combat profile; the banner is set.
- **Save:** a win is recorded once; old saves without the field still load.
- **In-game:** screenshots of the rivalry list, side picker, intro banner and a Blackout fight on desktop and phone sizes.
