#!/bin/bash

# ==================================
# Script para parar containers
# Valle 360 System
# ==================================

set -e

echo "🛑 Valle 360 - Parando containers..."
echo "===================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar qual docker-compose está rodando
if docker-compose ps | grep -q "valle360"; then
    echo "Parando modo PRODUÇÃO..."
    docker-compose down
elif docker-compose -f docker-compose.dev.yml ps | grep -q "valle360"; then
    echo "Parando modo DESENVOLVIMENTO..."
    docker-compose -f docker-compose.dev.yml down
else
    echo "Nenhum container Valle 360 está rodando."
    exit 0
fi

echo ""
echo -e "${GREEN}✅ Containers parados com sucesso!${NC}"








