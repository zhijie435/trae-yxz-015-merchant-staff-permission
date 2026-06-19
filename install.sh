#!/bin/bash

echo "==================================="
echo "员工管理系统安装脚本"
echo "==================================="

echo ""
echo "1. 安装后端依赖..."
cd server
npm install
cd ..

echo ""
echo "2. 安装前端依赖..."
cd client
npm install
cd ..

echo ""
echo "==================================="
echo "安装完成!"
echo "==================================="
