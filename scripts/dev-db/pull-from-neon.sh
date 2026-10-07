#!/usr/bin/env bash
# Copy the Neon DEV databases (members + CMS) into the local Postgres, replacing
# what is there. Reads Neon (pg_dump, read-only); writes only to localhost:5433.
#
#   scripts/dev-db/pull-from-neon.sh
#
# The Neon dev URLs come from the commented "# DATABASE_URL=" / "# PAYLOAD_DATABASE_URL="
# lines .env.local keeps for this; override with NEON_DATABASE_URL / NEON_PAYLOAD_DATABASE_URL.
# Refuses anything that looks like production (misty-dawn).
set -euo pipefail
cd "$(dirname "$0")/../.."
commented() { grep -E "^# $1=" .env.local | tail -1 | sed -E "s/^# $1=//" | tr -d '"'; }
SRC_MEMBERS="${NEON_DATABASE_URL:-$(commented DATABASE_URL)}"
SRC_PAYLOAD="${NEON_PAYLOAD_DATABASE_URL:-$(commented PAYLOAD_DATABASE_URL)}"

for src in "$SRC_MEMBERS" "$SRC_PAYLOAD"; do
  [[ -n "$src" ]] || { echo "Missing a Neon dev URL (see the header)."; exit 1; }
  [[ "$src" == *misty-dawn* ]] && { echo "Refusing: that is the production database."; exit 1; }
done

pull() { # $1 = Neon URL, $2 = local database name
  echo "Copying into local $2…"
  docker exec -i ccm-dev-postgres pg_dump --no-owner --no-acl --clean --if-exists --exclude-schema='neon_*' "$1" \
    | docker exec -i ccm-dev-postgres psql -q -v ON_ERROR_STOP=0 -U ccm -d "$2" >/dev/null
}

docker compose -f docker-compose.dev.yml up -d --wait
pull "$SRC_MEMBERS" ccm_members
pull "$SRC_PAYLOAD" payload_cms
echo "Done. Restart the dev server (and clear its cache: rm -rf .next) to see the copied content."
