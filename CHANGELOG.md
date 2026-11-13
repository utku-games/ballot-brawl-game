# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses semantic versioning.

## [Unreleased]

### Added
- Project scaffold: Vite, TypeScript and Three.js on the shared `@utku/engine` v0.2.0.
- Placeholder arena scene rendered through the engine renderer.
- Arena bounds with a tested clamp shared by the simulation and the view.
- Vercel deploy script, harness config, architecture contract and roadmap.
- Deterministic team fight simulation for 1v1 up to 4v4: punch, kick, defend (no damage, drains guard),
  guard breaks, combo knockdowns, a power meter and a finisher, knockouts and time over.
- CPU brain with skill levels from easy to boss, seeded so matches replay identically.
- Roster of 36 caricatures in three categories (Politicians, Tycoons, Legends), each with a boss.
- Story ladder of ten rising-difficulty opponents ending with the boss, continues, and a score based on
  the damage taken across the run.
