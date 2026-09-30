#!/usr/bin/env bash
# Clears the live site's content cache (after a move script or a bulk change).
#
#   scripts/clear-prod-cache.sh
#
# Reads ADMIN_API_KEY from Vercel's production settings into a temporary file
# that is deleted straight away; the key is never printed.
set -euo pipefail
SITE="${SITE:-https://hub.connectingclimateminds.org}"
tmp="$(mktemp -t ccm-prod-env)"
trap 'rm -f "$tmp"' EXIT

vercel env pull "$tmp" --environment=production --yes >/dev/null 2>&1
key="$(grep -E '^ADMIN_API_KEY=' "$tmp" | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')"
if [[ -z "$key" ]]; then
  echo "Couldn't read ADMIN_API_KEY from Vercel's production settings — is this folder linked (vercel link) and are you logged in?" >&2
  exit 1
fi

echo "Clearing the cache on $SITE …"
curl -s -X POST "$SITE/api/cache/revalidate" \
  -H "Authorization: Bearer $key" \
  -H 'content-type: application/json' \
  -d '{"all":true}' | head -c 300
echo
