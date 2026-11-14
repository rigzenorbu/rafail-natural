#!/bin/sh
# Builds a browse-only copy of the shop for GitHub Pages into the folder given as $1.
# The real shop (cart, checkout, admin) needs a server; this copy is for showing the design.
set -e
OUT="${1:?usage: scripts/build-pages.sh <output-folder>}"
BASE="/rafail-natural"
PORT=3987
export PAGES_BASE_PATH="$BASE"

npx next build
npx next start -p "$PORT" &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
until curl -s -o /dev/null "http://localhost:$PORT$BASE"; do sleep 1; done

rm -rf "$OUT"; mkdir -p "$OUT/_next"
cp -R .next-pages/static "$OUT/_next/static"
cp -R public/. "$OUT/"
mkdir -p "$OUT/uploads"; cp uploads/* "$OUT/uploads/" 2>/dev/null || true
touch "$OUT/.nojekyll"

PAGES="/ /products /about /contact /track /cart /checkout /login /register /policies/privacy /policies/terms /policies/refund /policies/shipping"
for slug in $(sqlite3 prisma/dev.db "select slug from Product where isActive=1"); do PAGES="$PAGES /products/$slug"; done
for p in $PAGES; do
  mkdir -p "$OUT$p"
  curl -sL "http://localhost:$PORT$BASE${p%/}" -o "$OUT$p/index.html"
done
curl -s "http://localhost:$PORT$BASE/this-page-does-not-exist" -o "$OUT/404.html"

# Images are stored with site-root addresses; point them at the Pages sub-folder.
find "$OUT" -name '*.html' -exec perl -pi -e "s{(\\\\?\")/(uploads|showcase|promo)/}{\$1$BASE/\$2/}g" {} +
echo "Built $(find "$OUT" -name '*.html' | wc -l) pages in $OUT"
