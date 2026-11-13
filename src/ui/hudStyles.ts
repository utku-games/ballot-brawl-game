/**
 * Stylesheet for the in-match HUD: team health panels with face portraits, the round timer, the power and guard bars,
 * and the big centre banner used for "FIGHT!", "K.O.!" and finisher call-outs.
 * Sizes use clamp() and safe-area insets so the HUD fits both phones and desktop screens.
 * Animations are pure CSS keyframes, so the HUD needs no per-frame script work for them.
 */
import { THEME } from './theme';

export const HUD_CSS = `
.hud { position: fixed; inset: 0; pointer-events: none; font-family: ${THEME.bodyFont}; color: ${THEME.ink};
  padding: max(8px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) 0 max(10px, env(safe-area-inset-left)); }
.hud-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.hud-team { display: flex; flex-direction: column; gap: 4px; width: clamp(130px, 34vw, 380px); }
.hud-team.right { align-items: flex-end; }
.hud-row { display: flex; align-items: center; gap: 6px; width: 100%; }
.hud-team.right .hud-row { flex-direction: row-reverse; }
.hud-face { width: clamp(26px, 5vw, 44px); height: clamp(26px, 5vw, 44px); border-radius: 50%; object-fit: cover;
  border: 2px solid var(--team); background: #222; flex: none; }
.hud-info { flex: 1; min-width: 0; }
.hud-name { font-size: clamp(10px, 1.6vw, 14px); font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  text-shadow: 0 1px 3px #000; }
.hud-team.right .hud-name { text-align: right; }
.hud-bar { height: clamp(7px, 1.4vw, 12px); background: rgba(0,0,0,0.55); border: 1px solid ${THEME.panelEdge}; border-radius: 6px; overflow: hidden; }
.hud-team.right .hud-bar { transform: scaleX(-1); }
.hud-fill { height: 100%; width: 100%; background: ${THEME.health}; transform-origin: left; transition: transform 120ms linear; }
.hud-fill.low { background: ${THEME.healthLow}; }
.hud-row.down { opacity: 0.35; filter: grayscale(1); }
.hud.compact .hud-team { gap: 2px; }
.hud.compact .hud-face { width: clamp(20px, 3.6vw, 34px); height: clamp(20px, 3.6vw, 34px); }
.hud.compact .hud-name { font-size: clamp(9px, 1.3vw, 12px); }
.hud.compact .hud-bar { height: clamp(5px, 1vw, 9px); }
.hud-row.player .hud-face { box-shadow: 0 0 0 2px var(--player); }
.hud-timer { font-family: ${THEME.font}; font-size: clamp(26px, 5vw, 48px); text-shadow: 0 3px 8px #000; min-width: 2.4em; text-align: center; }
.hud-power { position: absolute; left: 50%; transform: translateX(-50%); bottom: max(10px, env(safe-area-inset-bottom));
  width: clamp(160px, 30vw, 340px); display: flex; flex-direction: column; gap: 3px; align-items: center; }
.hud-power .hud-bar { width: 100%; }
.hud-power .meter .hud-fill { background: ${THEME.meter}; }
.hud-power .guard .hud-fill { background: ${THEME.guard}; }
.hud-power .hud-bar.guard { height: 5px; }
.hud-ready { font-family: ${THEME.font}; font-size: 13px; color: ${THEME.gold}; text-shadow: 0 0 8px ${THEME.gold}; visibility: hidden; }
.hud-ready.on { visibility: visible; animation: hud-pulse 0.6s ease-in-out infinite alternate; }
.hud-banner { position: absolute; left: 0; right: 0; top: 34%; text-align: center; font-family: ${THEME.font};
  font-size: clamp(36px, 10vw, 110px); color: ${THEME.ink}; text-shadow: 0 6px 0 #000, 0 0 30px ${THEME.gold}; opacity: 0; }
.hud-banner.small { font-size: clamp(22px, 5.5vw, 56px); color: ${THEME.gold}; }
.hud-banner.show { animation: hud-banner 1.4s ease-out forwards; }
.hud-banner.hold { opacity: 1; animation: none; }
@keyframes hud-banner { 0% { opacity: 0; transform: scale(2.2); } 15% { opacity: 1; transform: scale(1); } 80% { opacity: 1; } 100% { opacity: 0; transform: scale(0.9); } }
@keyframes hud-pulse { from { opacity: 0.55; } to { opacity: 1; } }
`;
