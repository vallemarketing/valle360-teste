#!/bin/bash

# Script de Fix de Permissões macOS - Valle 360
# Resolve problemas EPERM e EMFILE

set -e

echo "🔧 Valle 360 - Fix de Permissões macOS"
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detectar diretório do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "📁 Diretório do projeto: $PROJECT_DIR"
cd "$PROJECT_DIR"

# 1. Aumentar limite de arquivos abertos
echo ""
echo "${YELLOW}[1/6] Aumentando limite de arquivos abertos...${NC}"
ulimit -n 10240
echo "${GREEN}✓ Limite de arquivos: $(ulimit -n)${NC}"

# 2. Parar processos Node e Next.js
echo ""
echo "${YELLOW}[2/6] Parando processos Node.js e Next.js...${NC}"
pkill -9 -f "next" 2>/dev/null || true
pkill -9 -f "node" 2>/dev/null || true
sleep 2
echo "${GREEN}✓ Processos finalizados${NC}"

# 3. Corrigir permissões de arquivos
echo ""
echo "${YELLOW}[3/6] Corrigindo permissões de arquivos...${NC}"
chmod -R u+rw . 2>/dev/null || true
chmod 644 .env.local 2>/dev/null || true
chmod 644 .env 2>/dev/null || true
chmod 644 package.json 2>/dev/null || true
chmod 644 tsconfig.json 2>/dev/null || true
chmod 644 next.config.js 2>/dev/null || true
echo "${GREEN}✓ Permissões corrigidas${NC}"

# 4. Limpar cache
echo ""
echo "${YELLOW}[4/6] Limpando cache...${NC}"
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
echo "${GREEN}✓ Cache limpo${NC}"

# 5. Remover e reinstalar node_modules (opcional)
echo ""
read -p "Deseja reinstalar node_modules? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "${YELLOW}[5/6] Removendo node_modules...${NC}"
    rm -rf node_modules 2>/dev/null || true
    echo "${GREEN}✓ node_modules removido${NC}"
    
    echo ""
    echo "${YELLOW}[6/6] Instalando dependências...${NC}"
    npm install --legacy-peer-deps
    echo "${GREEN}✓ Dependências instaladas${NC}"
else
    echo "${YELLOW}[5/6] Pulando reinstalação do node_modules${NC}"
    echo "${YELLOW}[6/6] Validando instalação existente...${NC}"
    npm list --depth=0 2>/dev/null || true
fi

# Instruções finais
echo ""
echo "${GREEN}========================================"
echo "✅ Fix de Permissões Concluído!"
echo "========================================${NC}"
echo ""
echo "Para iniciar o servidor:"
echo "  ${YELLOW}npm run dev${NC}"
echo ""
echo "Se ainda tiver problemas:"
echo "  1. Reinicie o terminal"
echo "  2. Execute: ${YELLOW}ulimit -n 10240 && npm run dev${NC}"
echo "  3. Verifique permissões do macOS em:"
echo "     Preferências do Sistema > Privacidade e Segurança"
echo ""


