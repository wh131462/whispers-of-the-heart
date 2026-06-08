#!/bin/sh
# PostgreSQL 定时备份脚本
# - 每次运行执行一次 pg_dump，压缩为 .sql.gz
# - 双重清理策略：保留 N 天 + 最多 M 个文件
set -eu

: "${POSTGRES_HOST:=postgres}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_USER:?POSTGRES_USER required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD required}"
: "${POSTGRES_DB:?POSTGRES_DB required}"
: "${BACKUP_DIR:=/backups}"
: "${BACKUP_RETENTION_DAYS:=14}"
: "${BACKUP_MAX_COUNT:=14}"

TS=$(date +%Y%m%d_%H%M%S)
FILE="${BACKUP_DIR}/whispers_db_${TS}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%F %T')] Starting backup -> $FILE"

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    --no-owner --no-acl --clean --if-exists \
    | gzip > "$FILE"

SIZE=$(stat -c %s "$FILE" 2>/dev/null || wc -c < "$FILE")
echo "[$(date '+%F %T')] Backup completed: ${SIZE} bytes"

# 清理策略 1：按时间删除超过 N 天的备份
find "$BACKUP_DIR" -maxdepth 1 -name 'whispers_db_*.sql.gz' \
    -type f -mtime "+${BACKUP_RETENTION_DAYS}" -print -delete || true

# 清理策略 2：按数量保留最新 M 个（防止短时间高频备份打爆磁盘）
ls -1t "$BACKUP_DIR"/whispers_db_*.sql.gz 2>/dev/null \
    | tail -n "+$((BACKUP_MAX_COUNT + 1))" \
    | while IFS= read -r old; do
        echo "[$(date '+%F %T')] Pruning excess: $old"
        rm -f "$old"
    done

REMAINING=$(ls -1 "$BACKUP_DIR"/whispers_db_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date '+%F %T')] Done. ${REMAINING} backup(s) retained."
