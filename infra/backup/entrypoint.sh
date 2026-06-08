#!/bin/sh
# backup 容器入口：配置 crontab 并启动 crond
# - 默认每天 03:17 触发一次 pg_dump（避开 GHA 部署高峰）
# - 通过环境变量 BACKUP_CRON 可覆盖调度表达式
set -eu

: "${BACKUP_CRON:=17 3 * * *}"

mkdir -p /etc/crontabs /var/log
echo "${BACKUP_CRON} sh /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

# 启动时立即输出一次 schedule，便于 docker logs 排查
echo "[$(date '+%F %T')] whispers-backup started. cron: ${BACKUP_CRON}"
echo "[$(date '+%F %T')] retention: ${BACKUP_RETENTION_DAYS:-14} days, max count: ${BACKUP_MAX_COUNT:-14}"

# busybox crond：-f 前台运行，-d 8 输出调度日志到 stderr，便于 docker logs 观察
# 同时 tail backup.log 让 dump 输出也走 docker logs
touch /var/log/backup.log
tail -F /var/log/backup.log &

exec crond -f -d 8
