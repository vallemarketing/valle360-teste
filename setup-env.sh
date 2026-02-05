#!/bin/bash

# ==================================
# Script para criar .env.local
# Valle 360 System
# ==================================

echo "🔑 Criando arquivo .env.local..."

cat > .env.local << 'EOF'
# ==================================
# ENVIRONMENT VARIABLES - Valle 360
# CONFIGURADO EM: 14/11/2025
# ==================================

# ==========================================
# Supabase Configuration
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://enzazswaehuawcugexbr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PRECISA_BUSCAR_ANON_KEY

# Service Role Key (Backend/Admin apenas)
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# ==========================================
# OpenAI Configuration (Para Val - IA)
# ==========================================
OPENAI_API_KEY=YOUR_OPENAI_API_KEY

# ==========================================
# Application
# ==========================================
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000

# ==========================================
# Redis
# ==========================================
REDIS_URL=redis://redis:6379
EOF

echo "✅ Arquivo .env.local criado!"
echo ""
echo "⚠️  ATENÇÃO: Você precisa buscar a ANON KEY no Supabase:"
echo "   1. Acesse: https://supabase.com/dashboard/project/enzazswaehuawcugexbr/settings/api"
echo "   2. Copie a 'anon public' key"
echo "   3. Edite .env.local e substitua PRECISA_BUSCAR_ANON_KEY"
echo ""
echo "Depois execute: ./setup-env.sh"







