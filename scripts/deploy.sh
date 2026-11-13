#!/usr/bin/env bash
# Builds Ballot Brawl and uploads the static build to Vercel as the "ballot-brawl" project.
# The build runs locally so Vercel never needs access to the private engine repository, and it is staged
# outside the repository so Vercel sees no git commit author (GitHub merge commits would block the deploy).
# Requires a one-time `npx vercel login`; pass --preview to deploy a preview instead of production.
set -euo pipefail

STAGE_ROOT="$(mktemp -d)"
PROJECT_DIR="$STAGE_ROOT/ballot-brawl"
trap 'rm -rf "$STAGE_ROOT"' EXIT
TARGET_FLAG="--prod"
if [[ "${1:-}" == "--preview" ]]; then TARGET_FLAG=""; fi

npm run build
mkdir -p "$PROJECT_DIR"
cp -R dist/. "$PROJECT_DIR/"
npx -y vercel@latest deploy "$PROJECT_DIR" $TARGET_FLAG --yes
