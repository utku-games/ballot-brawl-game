/**
 * Browser entry point of Ballot Brawl: creates the renderer, input, audio and touch controls, then runs matches.
 * Until the menus land it plays endless 2 versus 2 demo brawls with Player 1 on the left team.
 * It is the only module that touches the page at startup; a missing container is reported through PlatformError.
 */
import { createGameRenderer, createRng } from '@utku/engine';
import { GameAudio } from './audio/gameAudio';
import { PlatformError } from './core/errors';
import { demoPlan } from './game/demoPlan';
import { MatchSession } from './game/matchSession';
import { InputHub } from './input/inputHub';
import { TouchControls } from './ui/touchControls';

const APP_ELEMENT_ID = 'app';
const MS_PER_SECOND = 1000;
const MAX_FRAME_SECONDS = 0.1;
const COARSE_POINTER = '(pointer: coarse)';

const container = document.getElementById(APP_ELEMENT_ID);
if (!container) throw new PlatformError(`Missing #${APP_ELEMENT_ID} element`);
const renderer = createGameRenderer(container);
const hub = new InputHub(window);
const audio = new GameAudio();
const touch = window.matchMedia(COARSE_POINTER).matches ? new TouchControls(container) : null;
hub.setTouch(touch);
const unlock = (): void => audio.unlock();
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);
window.addEventListener('resize', () => renderer.resize());
const rng = createRng(Date.now());
let session: MatchSession;

function startMatch(): void {
  session = new MatchSession(demoPlan(rng), { renderer, hudParent: container as HTMLElement, audio, touch }, () => {
    session.dispose();
    startMatch();
  }, () => session.resume());
}

startMatch();
let last = performance.now();
const frame = (now: number): void => {
  const dt = Math.min(MAX_FRAME_SECONDS, (now - last) / MS_PER_SECOND);
  last = now;
  session.frame(dt, hub.poll());
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
