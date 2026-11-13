# Online 1v1: Design

The last roadmap item. The user chose peer-to-peer hosting (WebRTC through PeerJS and its free public signalling
server) and delegated the rest of the design ("go without waiting").

## Decisions

- **Scope:** a one-on-one duel between two devices. No CPU, no teams, no Story or Rivalry online.
- **Rooms:** the host opens a room under a five-character code (no look-alike characters) and shares it or an
  invite link `?join=CODE`. Later joiners are turned away.
- **Lobby:** both pick a fighter (each from their own unlocked roster); the host picks the arena and items and
  starts when both have picked. After each fight both return to the lobby.
- **Host-authoritative streaming, not lockstep:** the simulation is deterministic, but Math.sin, hypot and atan2
  can differ between browser engines, so a phone (Safari) and a laptop (Chrome) running lockstep could drift apart.
  The host simulates with the guest as Player 2 and sends every tick's state (about 1.5 KB, 60 per second, about
  90 KB/s); the guest sends its controls every frame and shows the states with a three-state jitter buffer.
- **Pause:** the menu opens with Resume and Quit, but the fight goes on underneath.
- **Leaving:** Leave, Quit, closing the page or a dropped connection tell the other side, which returns to the
  online menu with a message. A different protocol version is reported as "reload the page".

## Architecture

| File | Responsibility |
|---|---|
| `net/roomCode.ts` | pure: codes, normalisation, peer ids |
| `net/protocol.ts` | pure: messages and `parseMessage` (NetProtocolError) |
| `net/remoteInput.ts` | pure: guest controls between host ticks |
| `net/snapshotQueue.ts` | pure: guest state buffer with catch-up |
| `net/peerLink.ts` | PeerJS adapter, loaded on demand |
| `game/matchNet.ts` | the interface `MatchSession` uses |
| `game/onlineMatchNet.ts` | MatchNet over a PeerJS connection |
| `game/onlinePlan.ts` | pure: the same plan on both pages, each with its own fighter as Player 1 |
| `game/onlineFlow.ts` | menus, rooms, lobby, matches, results, leaving |
| `ui/screens/onlineScreens.ts` | the screens |

## Testing

- **Pure modules:** codes, protocol round trips and rejections, press merging, buffer catch-up, join links, plans.
- **In-game:** two browser pages over the real signalling server: host and join by code and by link, lobby picks
  and settings, a full fight with both pages showing the same winner, back to lobby, and the host closing the page.
