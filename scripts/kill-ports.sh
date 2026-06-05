#!/usr/bin/env bash

set -u

PORTS=("${@:-7777 8888}")
PORTS=(${PORTS[@]})

kill_port() {
  local port=$1
  local pids

  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)

  if [ -z "$pids" ]; then
    echo "[port $port] 未发现占用进程"
    return 0
  fi

  echo "[port $port] 占用进程: $pids"
  echo "$pids" | xargs kill -9 2>/dev/null || true

  sleep 0.2
  if lsof -ti tcp:"$port" >/dev/null 2>&1; then
    echo "[port $port] 释放失败，请手动检查"
    return 1
  fi

  echo "[port $port] 已释放"
}

exit_code=0
for port in "${PORTS[@]}"; do
  kill_port "$port" || exit_code=1
done

exit $exit_code
