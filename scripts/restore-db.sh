#!/bin/bash

# 数据库恢复脚本
set -e

# 检查参数
if [ $# -eq 0 ]; then
    echo "使用方法: $0 <backup_file.sql.gz>"
    echo "可用备份文件:"
    ls -la ./backups/whispers_backup_*.sql.gz 2>/dev/null || echo "没有找到备份文件"
    exit 1
fi

BACKUP_FILE=$1

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "错误: 备份文件 $BACKUP_FILE 不存在"
    exit 1
fi

# 检查环境
if [ -f ".env" ]; then
    source .env
else
    echo "错误: .env 文件不存在"
    exit 1
fi

# 确认恢复操作
echo "⚠️  警告: 此操作将覆盖当前数据库数据!"
echo "备份文件: $BACKUP_FILE"
read -p "确定要继续吗? (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "操作已取消"
    exit 0
fi

# 解压备份文件
echo "🔄 解压备份文件..."
TEMP_FILE="/tmp/restore_$(basename $BACKUP_FILE .gz)"
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

# 恢复数据库
echo "🔄 开始恢复数据库..."

if [ "$NODE_ENV" = "production" ]; then
    # 生产环境恢复
    docker exec -i whispers-postgres-prod psql -U ${POSTGRES_USERNAME} -d ${POSTGRES_DATABASE} < "$TEMP_FILE"
else
    # 开发环境恢复
    docker exec -i whispers-postgres-dev psql -U whispers_user -d whispers_db < "$TEMP_FILE"
fi

# 清理临时文件
rm "$TEMP_FILE"

echo "✅ 数据库恢复完成"
