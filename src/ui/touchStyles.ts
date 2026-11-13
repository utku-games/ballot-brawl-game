/**
 * Stylesheet for the on-screen touch controls: the floating joystick and the Punch, Kick, Defend, Finisher and Swap buttons.
 * Buttons are large, thumb-reachable and sit inside the safe area on notched phones.
 * The Finisher button glows only while the power meter is full.
 */
import { THEME } from './theme';

export const TOUCH_CSS = `
.touch { position: fixed; inset: 0; touch-action: none; -webkit-user-select: none; user-select: none; }
.touch-stick { position: absolute; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.08); display: none; pointer-events: none; }
.touch-stick.on { display: block; }
.touch-knob { position: absolute; left: 50%; top: 50%; width: 54px; height: 54px; margin: -27px 0 0 -27px; border-radius: 50%;
  background: rgba(255,255,255,0.55); }
.touch-hint { position: absolute; left: max(18px, env(safe-area-inset-left)); bottom: max(18px, env(safe-area-inset-bottom));
  font: 700 12px ${THEME.bodyFont}; color: rgba(255,255,255,0.5); pointer-events: none; }
.touch-pad { position: absolute; right: max(14px, env(safe-area-inset-right)); bottom: max(14px, env(safe-area-inset-bottom));
  display: grid; grid-template-columns: repeat(2, 76px); grid-auto-rows: 76px; gap: 10px; }
.touch-btn { border-radius: 50%; border: 2px solid rgba(255,255,255,0.5); color: #fff; font: 800 13px ${THEME.bodyFont};
  display: flex; align-items: center; justify-content: center; text-align: center; background: rgba(20,18,50,0.55);
  text-shadow: 0 1px 2px #000; touch-action: none; }
.touch-btn.down { transform: scale(0.92); background: rgba(255,255,255,0.3); }
.touch-btn.punch { background: rgba(255,90,60,0.55); }
.touch-btn.kick { background: rgba(255,170,40,0.55); }
.touch-btn.defend { background: rgba(70,150,255,0.55); }
.touch-btn.finisher { background: rgba(80,80,80,0.5); opacity: 0.5; }
.touch-btn.finisher.ready { background: rgba(255,210,58,0.85); color: #3a2a00; opacity: 1; box-shadow: 0 0 18px ${THEME.gold};
  animation: hud-pulse 0.6s ease-in-out infinite alternate; }
.touch-small { position: absolute; width: 56px; height: 56px; }
.touch-swap { right: calc(max(14px, env(safe-area-inset-right)) + 172px); bottom: max(24px, env(safe-area-inset-bottom)); }
.touch-pause { right: max(12px, env(safe-area-inset-right)); top: calc(max(8px, env(safe-area-inset-top)) + 64px);
  width: 44px; height: 44px; font-size: 16px; }
`;
