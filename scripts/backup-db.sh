#!/bin/bash

# 数据库备份脚本
set -e

# 配置
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="whispers_backup_${DATE}.sql"

# 创建备份目录
mkdir -p ${BACKUP_DIR}

# 检查环境
if [ -f ".env" ]; then
    source .env
else
    echo "错误: .env 文件不存在"
    exit 1
fi

# 备份数据库
echo "🔄 开始备份数据库..."

if [ "$NODE_ENV" = "production" ]; then
    # 生产环境备份
    docker exec whispers-postgres-prod pg_dump -U ${POSTGRES_USERNAME} -d ${POSTGRES_DATABASE} > ${BACKUP_DIR}/${BACKUP_FILE}
else
    # 开发环境备份
    docker exec whispers-postgres-dev pg_dump -U whispers_user -d whispers_db > ${BACKUP_DIR}/${BACKUP_FILE}
fi

# 压缩备份文件
gzip ${BACKUP_DIR}/${BACKUP_FILE}

echo "✅ 数据库备份完成: ${BACKUP_DIR}/${BACKUP_FILE}.gz"

# 清理旧备份（保留最近30天）
find ${BACKUP_DIR} -name "whispers_backup_*.sql.gz" -mtime +30 -delete

echo "🧹 清理旧备份文件完成"
