/**
 * Vite configuration for Ballot Brawl: serves index.html and bundles the TypeScript game from src.
 * Vitest reuses this file and runs the colocated *.test.ts files under src and scripts.
 * three.js and the engine ship as a separate vendor chunk so a game update does not re-download them.
 */
import { defineConfig } from 'vitest/config';

const DEV_SERVER_PORT = 5175;
/** three.js and the engine go in one long-lived vendor chunk; PeerJS stays in its own chunk, loaded only for online play. */
const VENDOR_CHUNK = { name: 'vendor', test: /node_modules[\\/](three|@utku)[\\/]/ };
/** three.js alone is about 700 kB minified, so the vendor chunk exceeds Vite's 500 kB warning; limit in kB. */
const CHUNK_SIZE_WARNING_KB = 900;

export default defineConfig({
  server: { port: DEV_SERVER_PORT, host: true },
  build: {
    chunkSizeWarningLimit: CHUNK_SIZE_WARNING_KB,
    rolldownOptions: { output: { codeSplitting: { groups: [VENDOR_CHUNK] } } },
  },
  test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'], environment: 'node' },
});
