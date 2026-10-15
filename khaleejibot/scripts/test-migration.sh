#!/usr/bin/env bash
# Applies supabase/migrations to a throwaway PostgreSQL + pgvector cluster
# (with Supabase stubs) and runs the RLS / RPC assertions in supabase/tests.
set -euo pipefail
source "$(dirname "$0")/pg-harness.sh"
trap pg_stop EXIT

pg_start
echo "→ running supabase/tests/rls_test.sql"
if ! "${PSQL[@]}" -c "set client_min_messages = notice" -f "$ROOT/supabase/tests/rls_test.sql" >"$PG_WORK/test.log" 2>&1; then
  sed -n "s/^psql:.*NOTICE:  /  /p" "$PG_WORK/test.log"
  echo "✗ RLS tests failed:"
  grep -E "ERROR|FAILED" "$PG_WORK/test.log" | sed "s/^/  /"
  exit 1
fi
sed -n "s/^psql:.*NOTICE:  /  /p" "$PG_WORK/test.log"
echo "✓ migration and RLS tests passed"
