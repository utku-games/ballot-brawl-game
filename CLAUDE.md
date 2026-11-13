# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                  # Vite dev server on :5175 (also on the LAN, for testing on a phone)
npm run build                # tsc --noEmit, then vite build
npm test                     # all vitest tests
npx vitest run src/fight     # one subsystem
npm run faces                # download, licence-check and crop the face photos (needs network)
npm run deploy:preview       # build and publish a Vercel preview (after `npx vercel login`)
```

## Architecture

`ARCHITECTURE.md` is the binding contract between subsystems and lists the allowed import directions.
Generic code lives in the shared engine `@utku/engine` (private repo `UttyWotty/utku-engine`, pinned by
tag); never copy engine code into this repo.

## Conventions

- Y up, meters, seconds; the fight simulation ticks at 60 Hz and frame data is in ticks.
- Pure logic (fight, ai, story, roster, core) has no DOM or Three.js imports, no `Math.random`, and has
  colocated tests.
- Every file starts with a three-sentence summary, stays under 500 lines, uses named constants and the
  error classes in `src/core/errors.ts`, and contains no emojis.
- Parody rules: slapstick only (no gore, blood or sexual content), unofficial and no endorsement, and
  every face image must be public domain or freely licensed with a credits entry.
- Automated browsers use software WebGL; judge performance on a real device with the FPS counter (F3).
