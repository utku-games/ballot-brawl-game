/**
 * Browser entry point of Ballot Brawl: finds the app container and starts the game.
 * It is the only module that touches the page at startup; everything else is wired from here.
 * A missing container is reported through the engine PlatformError.
 */
import { PlatformError } from './core/errors';
import { startArenaPreview } from './view/arenaPreview';

const APP_ELEMENT_ID = 'app';

const container = document.getElementById(APP_ELEMENT_ID);
if (!container) throw new PlatformError(`Missing #${APP_ELEMENT_ID} element`);
startArenaPreview(container);
