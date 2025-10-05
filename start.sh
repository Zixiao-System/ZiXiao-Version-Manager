#!/bin/bash

echo "🚀 启动 ZiXiao Version Manager..."
echo ""

# 清理之前的进程
pkill -f "vite|electron.*ZiXiao" 2>/dev/null
sleep 1

# 启动 Vite
echo "📦 启动 Vite 开发服务器..."
npm run dev > /tmp/vite-zixiao.log 2>&1 &
VITE_PID=$!

# 等待 Vite 启动
echo "⏳ 等待 Vite 启动..."
sleep 3

# 检查 Vite 是否成功启动
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Vite 已启动"
else
    echo "⚠️  Vite 启动可能有问题，但继续尝试启动 Electron..."
fi

# 启动 Electron
echo "🖥️  启动 Electron 应用..."
NODE_ENV=development npx electron . 2>&1 | tee /tmp/electron-zixiao.log

# 清理
echo ""
echo "🛑 应用已关闭，清理进程..."
kill $VITE_PID 2>/dev/null
pkill -f "vite|electron.*ZiXiao" 2>/dev/null

echo "✅ 完成"
