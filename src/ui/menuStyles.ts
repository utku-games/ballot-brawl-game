/**
 * Stylesheet for every menu screen: the title, selection grids, team setup, ladder, results, pause and credits.
 * Screens are full-viewport overlays above the 3D backdrop, scroll vertically on small phones and respect safe areas;
 * short landscape phones get a compact two-column menu.
 * Buttons are real button elements so keyboard focus, Enter and screen readers work without extra code.
 */
import { THEME } from './theme';

export const MENU_CSS = `
.screen { position: fixed; inset: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y;
  display: flex; flex-direction: column; align-items: center; gap: 14px; color: ${THEME.ink}; font-family: ${THEME.bodyFont};
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background: radial-gradient(ellipse at center, rgba(20,18,43,0.35), rgba(20,18,43,0.88)); box-sizing: border-box; }
.screen.overlay { background: rgba(10,8,30,0.72); }
.screen.overlay > :first-child { margin-top: auto; }
.screen.overlay > :last-child { margin-bottom: auto; }
.screen h1 { font-family: ${THEME.font}; font-size: clamp(44px, 11vw, 120px); margin: 2vh 0 0; line-height: 0.95; text-align: center;
  color: ${THEME.gold}; text-shadow: 0 6px 0 #6a2a00, 0 12px 30px rgba(0,0,0,0.6); letter-spacing: 1px; }
.screen h2 { font-family: ${THEME.font}; font-size: clamp(24px, 5vw, 44px); margin: 4px 0; text-align: center; text-shadow: 0 4px 0 #000; }
.screen p { margin: 0; text-align: center; color: ${THEME.inkSoft}; max-width: 680px; }
.tagline { font-weight: 700; font-size: clamp(14px, 2.4vw, 20px); }
.disclaimer { font-size: 12px; opacity: 0.75; }
.menu-col { display: flex; flex-direction: column; gap: 10px; width: min(360px, 100%); }
.menu-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.menu-btn { font-family: ${THEME.font}; font-size: clamp(16px, 2.6vw, 22px); color: ${THEME.ink}; background: ${THEME.panel};
  border: 2px solid ${THEME.panelEdge}; border-radius: 14px; padding: 12px 18px; cursor: pointer; touch-action: manipulation; }
.menu-btn:hover, .menu-btn:focus-visible { border-color: ${THEME.gold}; outline: none; transform: translateY(-1px); }
.menu-btn.primary { background: ${THEME.gold}; color: #2a1a00; border-color: #fff3c0; }
.menu-btn.small { font-size: 14px; padding: 8px 12px; border-radius: 10px; }
.menu-btn.on { border-color: ${THEME.gold}; background: rgba(255,210,58,0.25); }
.menu-btn:disabled { opacity: 0.4; cursor: default; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 10px; width: min(980px, 100%); }
.card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; font-family: ${THEME.bodyFont}; }
.card img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.4); background: #222; }
.card .card-name { font-weight: 800; font-size: 14px; text-align: center; }
.card .card-nick { font-size: 12px; color: ${THEME.inkSoft}; text-align: center; }
.card .card-best { font-size: 12px; color: ${THEME.gold}; }
.card.boss img { border-color: ${THEME.gold}; }
.card.locked { opacity: 0.55; } .card.locked img { filter: grayscale(1); }
.grid.wide { grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
.card.rivalry .pair { display: flex; align-items: center; gap: 8px; font-family: ${THEME.font}; font-size: 16px; }
.card.rivalry .pair img { width: 64px; height: 64px; }
.stats { display: grid; grid-template-columns: auto 1fr; gap: 2px 6px; width: 100%; font-size: 10px; color: ${THEME.inkSoft}; }
.stat-bar { height: 6px; align-self: center; background: rgba(255,255,255,0.15); border-radius: 3px; overflow: hidden; }
.stat-bar > div { height: 100%; background: ${THEME.gold}; }
.teams { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; width: min(980px, 100%); }
.team { flex: 1 1 280px; background: ${THEME.panel}; border: 2px solid var(--team); border-radius: 16px; padding: 10px;
  display: flex; flex-direction: column; gap: 8px; }
.team-head { display: flex; align-items: center; justify-content: space-between; font-family: ${THEME.font}; }
.slot { display: flex; align-items: center; gap: 8px; }
.slot .menu-btn { flex: 1; display: flex; align-items: center; gap: 8px; font-size: 14px; text-align: left; }
.slot img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; background: #222; }
.slot .who { flex: none; width: 64px; }
.ladder { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; width: min(980px, 100%); }
.rung { display: flex; flex-direction: column; align-items: center; gap: 3px; width: 82px; font-size: 11px; text-align: center; opacity: 0.55; }
.rung img { width: 58px; height: 58px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.3); }
.rung.beaten { opacity: 0.35; filter: grayscale(1); }
.rung.current { opacity: 1; transform: scale(1.12); }
.rung.current img { border-color: ${THEME.gold}; box-shadow: 0 0 16px ${THEME.gold}; }
.rung.boss img { border-color: ${THEME.teamB}; }
.versus { display: flex; align-items: center; gap: 18px; font-family: ${THEME.font}; font-size: 28px; }
.versus img { width: clamp(80px, 18vw, 140px); height: clamp(80px, 18vw, 140px); border-radius: 50%; object-fit: cover; border: 4px solid #fff; }
.score-table { border-collapse: collapse; font-size: 16px; }
.score-table td { padding: 4px 12px; }
.score-table td:last-child { text-align: right; font-weight: 800; }
.rank { font-family: ${THEME.font}; font-size: 72px; color: ${THEME.gold}; text-shadow: 0 6px 0 #6a2a00; line-height: 1; }
.credits { width: min(900px, 100%); display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.credit { display: flex; gap: 10px; align-items: center; background: ${THEME.panel}; border-radius: 10px; padding: 6px 10px; }
.credit img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex: none; }
.credit a { color: ${THEME.guard}; }
@media (max-height: 500px) { .screen h1 { font-size: 40px; margin: 0; } .screen { gap: 8px; } .menu-btn { padding: 8px 14px; }
  .card img { width: 52px; height: 52px; } .versus img { width: 72px; height: 72px; } .rank { font-size: 48px; } }
@media (max-height: 500px) and (orientation: landscape) {
  .screen { padding-top: max(8px, env(safe-area-inset-top)); padding-bottom: max(8px, env(safe-area-inset-bottom)); gap: 6px; }
  .screen h1 { font-size: 30px; text-shadow: 0 3px 0 #6a2a00; } .screen h2 { font-size: 22px; } .tagline { font-size: 13px; }
  .menu-col { display: grid; grid-template-columns: 1fr 1fr; width: min(620px, 100%); gap: 6px; }
  .menu-btn { font-size: 15px; padding: 7px 12px; } .controls-hint, .disclaimer { font-size: 10px; } }
.controls-hint { font-size: 12px; color: ${THEME.inkSoft}; text-align: center; }
`;
