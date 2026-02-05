#!/bin/bash

# ==================================
# Script para executar migrações via API do Supabase
# ==================================

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [[ -z "$SUPABASE_URL" || -z "$SERVICE_ROLE_KEY" ]]; then
  echo "❌ Variáveis obrigatórias ausentes."
  echo "   Defina antes de rodar:"
  echo "   export NEXT_PUBLIC_SUPABASE_URL='https://<PROJECT_REF>.supabase.co'"
  echo "   export SUPABASE_SERVICE_ROLE_KEY='<SUA_SERVICE_ROLE_KEY>'"
  exit 1
fi

echo "🚀 Executando migrações no Supabase..."
echo ""

# Ler o script SQL
SQL_SCRIPT=$(cat supabase/⚡_SCRIPT_COMPLETO_EXECUTAR_TUDO.sql)

# Executar via API REST
echo "📊 Executando script consolidado..."
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_SCRIPT" | jq -Rs .)}"

echo ""
echo "✅ Script executado!"
echo ""
echo "Agora executando criar_admin_guilherme.sql..."

# Executar script de admin
ADMIN_SCRIPT=$(cat supabase/criar_admin_guilherme.sql)

curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$ADMIN_SCRIPT" | jq -Rs .)}"

echo ""
echo "✅ Admin criado!"
echo ""
echo "🎉 Tudo pronto! Faça login em http://localhost:3000/login"
echo "   Email: guilherme@vallegroup.com.br"
echo "   Senha: <SENHA_DEFINIDA_NO_AMBIENTE>"







