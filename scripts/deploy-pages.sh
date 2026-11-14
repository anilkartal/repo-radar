#!/usr/bin/env bash
# Build and publish dist/ to the gh-pages branch of the `origin` remote.
# Usage: npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."

remote_url="$(git remote get-url origin)"
source_sha="$(git rev-parse --short HEAD)"
if [ -n "$(git status --porcelain)" ]; then
  echo "Note: working tree has uncommitted changes; deploying them anyway." >&2
fi

npm run build
touch dist/.nojekyll   # serve files as-is (no Jekyll processing)
find dist -name .DS_Store -delete   # macOS Finder metadata copied from public/

# Publish dist/ as a single fresh commit on gh-pages (history isn't needed there).
git -C dist init -q -b gh-pages
git -C dist add -A
git -C dist \
  -c user.name="$(git config user.name)" \
  -c user.email="$(git config user.email)" \
  commit -q -m "Deploy ${source_sha}"
# dist/ is its own throwaway repo, so pass along this repo's GitHub credential helper.
helper="$(git config --get credential.https://github.com.helper || true)"
git -C dist ${helper:+-c credential.https://github.com.helper=} ${helper:+-c "credential.https://github.com.helper=$helper"} \
  push -f "$remote_url" gh-pages
rm -rf dist/.git

echo "Deployed ${source_sha} to gh-pages."
