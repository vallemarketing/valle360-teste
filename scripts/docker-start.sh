#!/bin/bash

# ==================================
# Script de inicialização Docker
# Valle 360 System
# ==================================

set -e

echo "🐳 Valle 360 - Docker Startup Script"
echo "===================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se .env.local existe
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Erro: Arquivo .env.local não encontrado!${NC}"
    echo ""
    echo "Por favor, crie o arquivo .env.local com as credenciais:"
    echo "  cp .env.example .env.local"
    echo "  nano .env.local"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Arquivo .env.local encontrado${NC}"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Erro: Docker não está rodando!${NC}"
    echo "Por favor, inicie o Docker Desktop e tente novamente."
    exit 1
fi

echo -e "${GREEN}✅ Docker está rodando${NC}"

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Erro: Docker Compose não está instalado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose está instalado${NC}"
echo ""

# Perguntar modo
echo "Escolha o modo de execução:"
echo "  1) Produção (docker-compose.yml)"
echo "  2) Desenvolvimento (docker-compose.dev.yml)"
echo ""
read -p "Modo (1 ou 2): " modo

if [ "$modo" == "2" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    echo -e "${YELLOW}🛠️  Iniciando em modo DESENVOLVIMENTO${NC}"
else
    COMPOSE_FILE="docker-compose.yml"
    echo -e "${GREEN}🚀 Iniciando em modo PRODUÇÃO${NC}"
fi

echo ""
echo "🏗️  Building containers..."
docker-compose -f $COMPOSE_FILE build

echo ""
echo "🚀 Starting containers..."
docker-compose -f $COMPOSE_FILE up -d

echo ""
echo "⏳ Aguardando containers iniciarem..."
sleep 5

echo ""
echo "📊 Status dos containers:"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo -e "${GREEN}✅ Valle 360 está rodando!${NC}"
echo ""
echo "🌐 Acessos:"
if [ "$modo" == "2" ]; then
    echo "  - Aplicação: http://localhost:3000"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Mailhog: http://localhost:8025"
    echo "  - Redis: localhost:6379"
else
    echo "  - Aplicação: http://localhost:3000"
    echo "  - Health Check: http://localhost:3000/api/health"
fi

echo ""
echo "📝 Ver logs:"
echo "  docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🛑 Parar sistema:"
echo "  docker-compose -f $COMPOSE_FILE down"
echo ""








