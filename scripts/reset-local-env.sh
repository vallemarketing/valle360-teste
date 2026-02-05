#!/bin/bash

echo "🚀 Iniciando Reset do Ambiente Local..."

# 1. Matar processos na porta 3000
echo "🔪 Matando processos na porta 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 2. Escrever .env.local (sem hardcode de chaves)
echo "📝 Escrevendo .env.local..."
if [[ -z "$NEXT_PUBLIC_SUPABASE_URL" || -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]]; then
  echo "❌ Variáveis obrigatórias ausentes."
  echo "   Defina antes de rodar:"
  echo "   export NEXT_PUBLIC_SUPABASE_URL='https://<PROJECT_REF>.supabase.co'"
  echo "   export NEXT_PUBLIC_SUPABASE_ANON_KEY='<SUA_ANON_KEY>'"
  exit 1
fi

cat > .env.local << EOL
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
EOL

# 3. Limpar caches
echo "🧹 Limpando caches..."
rm -rf .next

# 4. Reinstalar dependências
echo "📦 Reinstalando dependências..."
npm install --legacy-peer-deps

echo "✅ Pronto! Agora execute: npm run dev"

