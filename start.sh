#!/bin/bash

echo "==================================="
echo "员工管理系统启动脚本"
echo "==================================="

echo ""
echo "1. 安装后端依赖..."
cd server
npm install

echo ""
echo "2. 启动后端服务 (端口 3000)..."
npm start &
SERVER_PID=$!

echo ""
echo "3. 安装前端依赖..."
cd ../client
npm install

echo ""
echo "4. 启动前端服务 (端口 8080)..."
npm run dev &
CLIENT_PID=$!

echo ""
echo "==================================="
echo "服务启动完成!"
echo "- 后端API: http://localhost:3000"
echo "- 前端界面: http://localhost:8080"
echo "==================================="
echo ""
echo "按 Ctrl+C 停止所有服务"

trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT TERM

wait
