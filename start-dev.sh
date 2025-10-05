#!/bin/bash

# 启动 Vite 开发服务器
npm run dev &
VITE_PID=$!

# 等待 Vite 启动
echo "等待 Vite 启动..."
sleep 3

# 启动 Electron
echo "启动 Electron..."
NODE_ENV=development npx electron .

# 清理
kill $VITE_PID 2>/dev/null
