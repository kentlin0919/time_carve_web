#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<'EOF'
用法:
  ./scripts/restore-supabase-remote-to-local.sh <REMOTE_DB_PASSWORD>

或使用環境變數:
  SUPABASE_DB_PASSWORD='<password>' ./scripts/restore-supabase-remote-to-local.sh

說明:
  1. 從 linked Supabase 遠端專案匯出 schema 與 data
  2. 重建本地 Supabase 資料庫
  3. 將遠端 data 匯入本地資料庫
  4. 驗證主要資料表筆數
EOF
}

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

fail() {
  printf '\nError: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "找不到指令: $1"
}

REMOTE_DB_PASSWORD="${1:-${SUPABASE_DB_PASSWORD:-}}"
[[ -n "$REMOTE_DB_PASSWORD" ]] || {
  usage
  fail "請提供遠端資料庫密碼。"
}

require_command supabase
require_command docker
require_command sed
require_command grep
require_command wc

[[ -f "supabase/config.toml" ]] || fail "找不到 supabase/config.toml"
[[ -f "supabase/.temp/project-ref" ]] || fail "找不到 supabase/.temp/project-ref，請先確認專案已 link 到遠端。"

PROJECT_ID="$(sed -n 's/^project_id = "\(.*\)"/\1/p' supabase/config.toml | head -n 1)"
[[ -n "$PROJECT_ID" ]] || fail "無法從 supabase/config.toml 解析 project_id"

PROJECT_REF="$(tr -d '\n' < supabase/.temp/project-ref)"
[[ -n "$PROJECT_REF" ]] || fail "無法讀取 supabase/.temp/project-ref"

DB_CONTAINER="supabase_db_${PROJECT_ID}"
BACKUP_DIR="$ROOT_DIR/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
SCHEMA_FILE="$BACKUP_DIR/remote-schema-$STAMP.sql"
DATA_FILE="$BACKUP_DIR/remote-data-$STAMP.sql"
LOCAL_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

mkdir -p "$BACKUP_DIR"

log "確認本地 Supabase 狀態"
supabase status >/dev/null

docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER" || fail "找不到本地資料庫容器: $DB_CONTAINER"

log "開始匯出遠端 schema ($PROJECT_REF)"
supabase db dump --linked -p "$REMOTE_DB_PASSWORD" --file "$SCHEMA_FILE"

log "開始匯出遠端 data ($PROJECT_REF)"
supabase db dump --linked -p "$REMOTE_DB_PASSWORD" --data-only --use-copy --file "$DATA_FILE"

[[ -s "$SCHEMA_FILE" ]] || fail "schema 備份檔為空: $SCHEMA_FILE"
[[ -s "$DATA_FILE" ]] || fail "data 備份檔為空: $DATA_FILE"

log "重建本地資料庫"
supabase db reset --local --no-seed --yes

log "匯入遠端 data 到本地資料庫"
docker exec -i "$DB_CONTAINER" psql -v ON_ERROR_STOP=0 -U postgres -d postgres < "$DATA_FILE"

log "驗證主要資料表筆數"
docker exec "$DB_CONTAINER" psql -U postgres -d postgres -c "
select 'auth.users' as table_name, count(*) from auth.users
union all select 'public.user_info', count(*) from public.user_info
union all select 'public.teacher_info', count(*) from public.teacher_info
union all select 'public.student_info', count(*) from public.student_info
union all select 'public.courses', count(*) from public.courses
union all select 'public.bookings', count(*) from public.bookings
union all select 'public.student_course_progress', count(*) from public.student_course_progress
union all select 'public.notifications', count(*) from public.notifications
order by table_name;
"

log "完成"
printf 'Schema backup: %s\n' "$SCHEMA_FILE"
printf 'Data backup:   %s\n' "$DATA_FILE"
printf 'Local DB URL:  %s\n' "$LOCAL_DB_URL"
