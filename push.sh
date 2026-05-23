#!/usr/bin/env bash
# IronGame push helper — parallels kameir.com/push.sh
# Usage: bash push.sh "feat: short description"
set -e

MSG="${1:-update}"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

# Clear any stale locks (NTFS / Obsidian Sync can leave these behind)
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

# Use a temp index so concurrent operations on the real index don't collide
TMP_INDEX="/tmp/gi_irongame_$$"
cp .git/index "$TMP_INDEX" 2>/dev/null || true

GIT_INDEX_FILE="$TMP_INDEX" git add -A
GIT_INDEX_FILE="$TMP_INDEX" git commit -m "$MSG" || { echo "Nothing to commit."; rm -f "$TMP_INDEX"; exit 0; }
mv "$TMP_INDEX" .git/index

git push origin main

echo ""
echo "✓ Pushed. Netlify will auto-deploy in ~30s."
