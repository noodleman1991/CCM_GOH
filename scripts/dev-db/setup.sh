#!/usr/bin/env bash
# Local dev databases (docker-compose.dev.yml): start Postgres, wait for its
# first-start setup, then create the tables — Prisma (members) and Payload (CMS).
# Safe to re-run: both migration tools skip what is already applied.
set -euo pipefail
cd "$(dirname "$0")/../.."
val() { grep -E "^$1=" .env.local | tail -1 | cut -d= -f2- | tr -d '"'; }

docker compose -f docker-compose.dev.yml up -d --wait
# pg_isready answers during the first-start setup too; wait for the real server.
for _ in $(seq 1 60); do
  docker exec ccm-dev-postgres psql -U ccm -d payload_cms -tAc "select 1" >/dev/null 2>&1 && break
  sleep 2
done

export DATABASE_URL="$(val DATABASE_URL)" PAYLOAD_DATABASE_URL="$(val PAYLOAD_DATABASE_URL)" PAYLOAD_SECRET="$(val PAYLOAD_SECRET)"
case "$DATABASE_URL$PAYLOAD_DATABASE_URL" in
  *localhost:5433*localhost:5433*) ;;
  *) echo "Refusing: .env.local's DATABASE_URL and PAYLOAD_DATABASE_URL must both point at localhost:5433."; exit 1 ;;
esac

pnpm exec prisma migrate deploy
pnpm exec payload migrate
echo "Local databases ready."
