#!/bin/bash

# 数据库迁移脚本
# 用法: ./scripts/db-migrate.sh [dev|prod|status|push|reset]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
API_DIR="$PROJECT_ROOT/apps/api"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 加载环境变量
load_env() {
    local env_type="${1:-development}"
    local env_file="$PROJECT_ROOT/configs/env.$env_type"

    if [ -f "$env_file" ]; then
        log_info "加载环境变量: $env_file"
        set -a
        source "$env_file"
        set +a

        # 开发环境时，将 postgres 主机名替换为 localhost
        if [ "$env_type" = "development" ]; then
            export DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/@postgres:/@localhost:/g')
            log_info "开发模式: 已将数据库主机替换为 localhost"
        fi

        log_success "DATABASE_URL 已设置"
    else
        log_error "环境文件不存在: $env_file"
        exit 1
    fi
}

# 执行 Prisma 命令
run_prisma() {
    cd "$API_DIR"
    npx prisma "$@"
}

# 显示帮助
show_help() {
    echo ""
    echo "数据库迁移工具"
    echo ""
    echo "用法: pnpm db:migrate [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  dev [name]     创建开发迁移 (默认使用 development 环境)"
    echo "  prod [name]    创建生产迁移 (使用 production 环境)"
    echo "  status         查看迁移状态"
    echo "  push           同步 schema 到数据库 (不创建迁移文件)"
    echo "  reset          重置数据库 (危险操作)"
    echo "  generate       生成 Prisma Client"
    echo "  studio         打开 Prisma Studio"
    echo ""
    echo "选项:"
    echo "  --env=ENV      指定环境 (development/production), 默认 development"
    echo ""
    echo "示例:"
    echo "  pnpm db:migrate dev add_duration_field"
    echo "  pnpm db:migrate push --env=production"
    echo "  pnpm db:migrate status"
    echo ""
}

# 主函数
main() {
    local command="${1:-help}"
    local env_type="development"
    local migration_name=""

    # 解析参数
    for arg in "$@"; do
        case $arg in
            --env=*)
                env_type="${arg#*=}"
                ;;
            dev|prod|status|push|reset|generate|studio|help)
                command="$arg"
                ;;
            *)
                if [ -z "$migration_name" ] && [ "$arg" != "$command" ]; then
                    migration_name="$arg"
                fi
                ;;
        esac
    done

    # prod 命令自动使用 production 环境
    if [ "$command" = "prod" ]; then
        env_type="production"
        command="dev"  # prisma migrate dev
    fi

    case $command in
        dev)
            load_env "$env_type"
            log_info "执行数据库迁移..."
            if [ -n "$migration_name" ]; then
                run_prisma migrate dev --name "$migration_name"
            else
                run_prisma migrate dev
            fi
            log_success "迁移完成"
            ;;
        status)
            load_env "$env_type"
            log_info "检查迁移状态..."
            run_prisma migrate status
            ;;
        push)
            load_env "$env_type"
            log_warn "直接同步 schema 到数据库 (不创建迁移文件)"
            run_prisma db push
            log_success "同步完成"
            ;;
        reset)
            load_env "$env_type"
            log_warn "即将重置数据库，所有数据将被删除!"
            read -p "确认继续? (y/N): " confirm
            if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                run_prisma migrate reset
                log_success "数据库已重置"
            else
                log_info "操作已取消"
            fi
            ;;
        generate)
            load_env "$env_type"
            log_info "生成 Prisma Client..."
            run_prisma generate
            log_success "生成完成"
            ;;
        studio)
            load_env "$env_type"
            log_info "启动 Prisma Studio..."
            run_prisma studio
            ;;
        help|*)
            show_help
            ;;
    esac
}

main "$@"
