# Sharing: Design

The user asked for sharing as the next piece and delegated the design ("go without waiting"), so the choices below
were made without a review round.

## Decisions

- **Share button on every result:**
  - It appears on the Rivalry Battles result, the Brawl and Party results and the end of a Story run.
  - It shares a message, a link and a 1200 by 630 result card image.
- **Channels, best first:**
  1. The system share sheet with the image, where the device can share files (most phones).
  2. The share sheet with text and link.
  3. Copying the message and link to the clipboard and downloading the card image (most desktops).
- **Card image:** the game name, every fighter's face (the winners ringed in gold, the others dimmed), the headline,
  a subtitle and "Unofficial parody. Nobody depicted endorses it."
- **Challenge links:**
  - `?rivalry=<id>` opens that rivalry's side picker.
  - `?duel=<a>~<b>` opens Brawl setup with fighter a (Player 1) against fighter b (CPU).
  - Links never open bosses, so the unlocks keep their meaning. Unknown ids, a repeated fighter and malformed values
    fall back to the title. The query is removed from the address bar once read.
- **Where links come from:** the rivalry side picker's Share challenge button, rivalry results, and one-on-one
  Brawl results without bosses. Team Brawls, Parties and Story runs share the plain game address.

## Architecture

| File | Responsibility |
|---|---|
| `share/shareLink.ts` | pure: `ShareTarget`, `shareUrl`, `parseShareTarget` |
| `share/shareCards.ts` | pure: `ShareCard` and the rivalry, brawl and story card builders |
| `share/cardImage.ts` | DOM: paints a card to a PNG |
| `share/shareAction.ts` | DOM: share sheet, clipboard and download; returns a `ShareOutcome` |
| `ui/shareButtons.ts` | the Share and Share challenge buttons; the image is rendered when the button appears |

The image is prepared before the tap because share sheets reject calls that come too long after it.

## Testing

- **Links:** round trips; rejection of unknown, repeated, boss and malformed values; the rivalry parameter wins.
- **Cards:** wording, winners and link targets for rivalry wins and losses, duels, team brawls, parties, draws and
  Story runs.
- **In-game:** both links on desktop and phone sizes, the challenge button and a result Share with the clipboard
  fallback, and the card images.
