# Shared helpers: a throwaway PostgreSQL + pgvector cluster with Supabase stubs
# and every migration applied. Source this file, then call pg_start.
# Requires PostgreSQL 15+ server binaries and the pgvector extension.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PG_PORT="${PGTEST_PORT:-54329}"
PG_WORK="$(mktemp -d)"
RUN_AS=()
if [ "$(id -u)" = "0" ]; then
  # initdb refuses to run as root.
  chown postgres "$PG_WORK"
  RUN_AS=(runuser -u postgres --)
fi
PSQL=(psql -X -q -t -A -v ON_ERROR_STOP=1 -h "$PG_WORK" -p "$PG_PORT" -U postgres -d postgres)

pg_stop() {
  "${RUN_AS[@]}" "$PG_BIN/pg_ctl" -D "$PG_WORK/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$PG_WORK"
}

pg_start() {
  "${RUN_AS[@]}" "$PG_BIN/initdb" -D "$PG_WORK/data" -U postgres -A trust >/dev/null
  "${RUN_AS[@]}" "$PG_BIN/pg_ctl" -D "$PG_WORK/data" \
    -o "-p $PG_PORT -k $PG_WORK -c listen_addresses=localhost" -l "$PG_WORK/log" -w start >/dev/null
  "${PSQL[@]}" -c "set client_min_messages = warning" -f "$ROOT/supabase/tests/supabase_stubs.sql" 2>&1 \
    | grep -v -e wal_level -e "^HINT" || true
  for migration in "$ROOT"/supabase/migrations/*.sql; do
    echo "→ applying $(basename "$migration")"
    "${PSQL[@]}" -f "$migration"
  done
}
