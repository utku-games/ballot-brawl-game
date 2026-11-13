# New Fighters: Design

Piece 3 of the enhancement roadmap adds 21 fighters:
- **Politicians:** five more.
- **Legends:** one more.
- **Celebrities:** a new story category of eleven plus a boss, with its own arena.
- **Specials:** a group of three animals for Brawl and the Special Edition matchups in piece 4.

The user chose Netanyahu, Khamenei, Edison, Xi, Pakistan's prime minister Shehbaz Sharif, Erdoğan, James Cameron, a goat, a pig and a camel. They delegated the rest of the design, including the celebrity list, so those choices were made without a review round and can be swapped later by editing the roster table and the face sources.

## Rules that do not change

- Every face is a public domain or freely licensed photo on Wikimedia Commons, checked by the face pipeline. The game credits each one in-game.
- Fighters get costumes from the existing catalogue plus a few new items, a finisher style, a gesture and stats with the regular total of 9.
- No speech is attributed to anyone. Finisher names are short move titles, as for the existing roster.
- Netanyahu and Khamenei are regular Politicians. They are never paired against each other in Rivalry Battles (piece 4).
- No references to wars or violence beyond the slapstick of the game itself.

## Roster changes

- **Story categories** need a boss and at least 10 regulars: 9 ladder opponents plus the player's own pick. They no longer need exactly 11. The ladder already draws 9 regulars at random.
- **`Category.Celebrities`** joins the story categories, with a new arena, The Studio.
- **`Category.Specials`** is not a story category. It has no boss and no ladder. Its fighters show up in Brawl, after the story categories, and in Random picks.

| Fighter | Category | Nickname | Finisher | Stats (P,S,T) | Kit | Signature |
|---|---|---|---|---|---|---|
| Benjamin Netanyahu | Politicians | Bibi | The Comeback | 3,3,3 | Average, Suit, Tie | Smash, Point |
| Ali Khamenei | Politicians | The Ayatollah | Final Word | 3,2,4 | Average, Robe (the photo shows his turban) | Quake, Wave |
| Xi Jinping | Politicians | The Chairman | Great Wall | 3,2,4 | Average, Suit, Tie | Quake, Wave |
| Shehbaz Sharif | Politicians | Shehbaz Speed | Speed Run | 3,4,2 | Average, Suit, Tie | Rush, Point |
| Recep Tayyip Erdoğan | Politicians | The Reis | One Minute | 4,2,3 | Tall, Suit, Tie | Smash, Wave |
| Thomas Edison | Legends | Wizard of Menlo Park | Bright Idea | 3,3,3 | Average, Suit, BowTie | Throw Light bulb, Thinker |
| Taylor Swift | Celebrities | The Eras | Shake It Off | 3,4,2 | Tall, Gown, Microphone | Rush, Cheer |
| Beyoncé | Celebrities | Queen Bey | Halo | 4,3,2 | Average, Gown, Microphone | Quake, Flex |
| Cristiano Ronaldo | Celebrities | CR7 | Bicycle Kick | 4,4,1 | Tall, Jersey | Rush, Flex |
| Lionel Messi | Celebrities | La Pulga | Golden Left | 3,5,1 | Short, Jersey | Throw Football, Point |
| Dwayne Johnson | Celebrities | The Rock | People's Elbow | 5,1,3 | Stocky, Casual | Smash, Flex |
| Snoop Dogg | Celebrities | The Doggfather | Drop It | 3,3,3 | Lanky, Hoodie | Quake, Point |
| Lady Gaga | Celebrities | Mother Monster | Bad Romance | 3,4,2 | Average, Gown | Throw Note, Bow |
| Gordon Ramsay | Celebrities | The Chef | Kitchen Nightmare | 4,3,2 | Average, Lab coat | Throw Frying pan, Point |
| Keanu Reeves | Celebrities | The One | Matrix Rush | 3,4,2 | Lanky, Frock coat, Aviators | Rush, Bow |
| James Cameron | Celebrities | The Director | Deep Dive | 3,3,3 | Tall, Casual | Rush, Point |
| Kim Kardashian | Celebrities | The Influencer | Break the Internet | 2,4,3 | Average, Gown, Phone | Quake, Wave |
| Arnold Schwarzenegger (boss) | Celebrities | The Governator | Judgment Day | 5,3,3 | Stocky, Leather jacket, Aviators | Smash, Flex |
| Goat | Specials | The G.O.A.T. | Headbutt Supreme | 4,3,2 | Short, Fur | Rush, Cheer |
| Pig | Specials | Hamlet | Mud Slam | 3,2,4 | Round, Fur | Quake, Cheer |
| Camel | Specials | Desert Express | Hump Day | 3,3,3 | Lanky, Fur | Smash, Bow |

## New catalogue items

- **Outfits:**
  - Jersey: a sports shirt in the main colour with an accent stripe, plus shorts with bare legs.
  - Fur: the whole body in the hair colour, with no clothes, for the animals.
- **Props:** Phone.
- **Projectiles:** Football, LightBulb and FryingPan.

## Animals

- Animal faces come from frontal Commons photos. The macOS Vision subject mask lifts the animal from the background.
- Face landmarks are not detected on animals. Their crops are set by hand (`manual: true`) and they use the default landmarks, as the Leonardo sketch does, so the expressions still warp the face.
- Animals stand upright in the cartoon style and reuse the body, moves and animations.

## Arena

**The Studio** is a talk-show and red-carpet set:
- a dark floor with a red carpet strip, stage lights and a backdrop with light panels
- added to `ArenaKind`, the arena order and `ARENA_FOR_CATEGORY`.

## Testing

- **Roster:**
  - The story categories have a boss and at least 10 regulars; Specials has no boss.
  - Every new fighter has a credit with a free licence, a silhouette and a tone.
  - Brawl lists Specials.
  - Random can pick animals.
  - Story categories exclude Specials.
- **Part lists:** the new items yield valid parts.
- **Rig:** all 57 fighters build. They stay above the floor standing and knocked out, and the marker sits above the head.
- **In-game:** lineup screenshots of every category, and a Celebrities story fight in The Studio.

## Out of scope

Rivalry Battles and Special Edition matchups, including Erdoğan vs the camel, are piece 4.
