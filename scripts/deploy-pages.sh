#!/usr/bin/env bash
# out/ を gh-pages ブランチへ配信する。npm run deploy から呼ばれる。
set -euo pipefail
REPO=$(git config --get remote.origin.url)
TMP=$(mktemp -d)
cp -R out/. "$TMP"/
touch "$TMP/.nojekyll"
cd "$TMP"
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.email=noreply@example.com -c user.name=deploy commit -q -m "Deploy $(date +%F\ %T)"
git push -q -f "$REPO" gh-pages
cd - >/dev/null
rm -rf "$TMP"
echo "gh-pages へ配信しました"
