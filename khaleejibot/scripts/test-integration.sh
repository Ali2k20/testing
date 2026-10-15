#!/usr/bin/env bash
# Runs the engine and dashboard queries through supabase-js against the real
# schema: PostgreSQL + pgvector (migrations applied) behind PostgREST, the same
# REST layer Supabase uses. Needs a PostgREST binary: POSTGREST_BIN=/path/to/postgrest
set -euo pipefail
source "$(dirname "$0")/pg-harness.sh"

POSTGREST_BIN="${POSTGREST_BIN:-$(command -v postgrest || true)}"
if [ -z "$POSTGREST_BIN" ]; then
  echo "postgrest not found; set POSTGREST_BIN (https://github.com/PostgREST/postgrest/releases)" >&2
  exit 1
fi
REST_PORT="${PGRST_TEST_PORT:-54330}"
JWT_SECRET="integration-test-secret-at-least-32-characters-long"

cleanup() {
  [ -n "${PGRST_PID:-}" ] && kill "$PGRST_PID" 2>/dev/null || true
  pg_stop
}
trap cleanup EXIT

pg_start
"${PSQL[@]}" -c "create role authenticator login noinherit; grant anon, authenticated, service_role to authenticator;"

PGRST_DB_URI="postgres://authenticator@localhost:$PG_PORT/postgres" \
PGRST_DB_SCHEMAS=public \
PGRST_DB_ANON_ROLE=anon \
PGRST_JWT_SECRET="$JWT_SECRET" \
PGRST_SERVER_PORT="$REST_PORT" \
PGRST_LOG_LEVEL=crit \
  "$POSTGREST_BIN" >"$PG_WORK/postgrest.log" 2>&1 &
PGRST_PID=$!

for _ in $(seq 1 50); do
  curl -sf "http://localhost:$REST_PORT/" >/dev/null 2>&1 && break
  sleep 0.2
done
curl -sf "http://localhost:$REST_PORT/" >/dev/null || { cat "$PG_WORK/postgrest.log"; exit 1; }

echo "→ running integration tests"
INTEGRATION_REST_URL="http://localhost:$REST_PORT" \
INTEGRATION_JWT_SECRET="$JWT_SECRET" \
INTEGRATION_PSQL="psql -X -q -t -A -h $PG_WORK -p $PG_PORT -U postgres -d postgres" \
  npx vitest run --config vitest.integration.config.mts
