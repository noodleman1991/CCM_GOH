#!/usr/bin/env bash
# Runs ONE command with the production Payload database from .env (never .env.local).
#
#   scripts/with-prod-env.sh pnpm exec payload migrate:status
#   scripts/with-prod-env.sh pnpm exec tsx scripts/homepage/move-to-sections.ts --orgs --production
#
# Prints only the database host it is using — never the password — and refuses
# unless that host is the production endpoint (misty-dawn).
set -euo pipefail
cd "$(dirname "$0")/.."

value() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"; }

PAYLOAD_DATABASE_URL="$(value PAYLOAD_DATABASE_URL)"
PAYLOAD_SECRET="$(value PAYLOAD_SECRET)"
host="$(printf '%s' "$PAYLOAD_DATABASE_URL" | sed -E 's#^[a-z]+://[^@]*@([^/:?]+).*#\1#')"

if [[ -z "$PAYLOAD_DATABASE_URL" || -z "$PAYLOAD_SECRET" ]]; then
  echo "PAYLOAD_DATABASE_URL or PAYLOAD_SECRET is missing from .env — nothing was run." >&2
  exit 1
fi
if [[ "$host" != *misty-dawn* ]]; then
  echo "Refusing: .env points at \"$host\", which is not the production database (misty-dawn)." >&2
  exit 1
fi

echo "Using the PRODUCTION database: $host"
export PAYLOAD_DATABASE_URL PAYLOAD_SECRET
exec "$@"
