#!/bin/bash
# 爆款情报站 - 快速启动脚本

set -e

echo "🔥 欢迎使用爆款情报站！"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker Desktop"
    exit 1
fi

# 检查 Docker 是否运行
if ! docker info &> /dev/null; then
    echo "❌ Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

# 检查 docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose 未安装"
    exit 1
fi

echo "✅ Docker 环境检查通过"

# 复制环境变量文件
if [ ! -f "backend/.env" ]; then
    echo "📝 创建环境变量配置文件..."
    cp backend/.env.example backend/.env
    echo "⚠️  请编辑 backend/.env 填写必要的配置（特别是 ANTHROPIC_API_KEY）"
fi

# 启动服务
echo "🚀 启动服务..."
cd docker
docker-compose up -d

echo ""
echo "✅ 服务启动完成！"
echo ""
echo "📍 访问地址："
echo "   前端：http://localhost:3000"
echo "   后端：http://localhost:3001"
echo ""
echo "📝 常用命令："
echo "   查看日志：docker-compose logs -f"
echo "   停止服务：docker-compose down"
echo "   重启服务：docker-compose restart"
echo ""
