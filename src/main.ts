/**
 * Browser entry point of Ballot Brawl: creates the renderer, input hub, audio and touch controls, then starts the game app.
 * Audio is unlocked on the first tap or key press, as browsers require, and the canvas follows window resizes.
 * It is the only module that touches the page at startup, including reading and clearing a shared link's query.
 */
import { createGameRenderer } from '@utku/engine';
import { GameAudio } from './audio/gameAudio';
import { PlatformError } from './core/errors';
import { GameApp } from './game/gameApp';
import { InputHub } from './input/inputHub';
import { parseShareTarget } from './share/shareLink';
import { TouchControls } from './ui/touchControls';

const APP_ELEMENT_ID = 'app';
const MS_PER_SECOND = 1000;
const MAX_FRAME_SECONDS = 0.1;

const container = document.getElementById(APP_ELEMENT_ID);
if (!container) throw new PlatformError(`Missing #${APP_ELEMENT_ID} element`);
const renderer = createGameRenderer(container);
const hub = new InputHub(window);
const audio = new GameAudio();
const touch = new TouchControls(container);
hub.setTouch(touch);
const unlock = (): void => audio.unlock();
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);
window.addEventListener('resize', () => renderer.resize());

const app = new GameApp({ container, renderer, hub, audio, touch });
const shared = parseShareTarget(location.search);
if (location.search) history.replaceState(null, '', location.pathname);
app.start(shared);
let last = performance.now();
const frame = (now: number): void => {
  app.frame(Math.min(MAX_FRAME_SECONDS, (now - last) / MS_PER_SECOND));
  last = now;
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
