#!/bin/bash
cat > .env.local << 'ENVEOF'
# ==================================
# ENVIRONMENT VARIABLES - Valle 360
# ATUALIZADO: 14/11/2025
# ==================================

# ==========================================
# Supabase Configuration (NOVO PROJETO)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://ojlcvpqhbfnehuferyci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Service Role Key (Backend/Admin apenas)
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Database Connection
DATABASE_URL=YOUR_DATABASE_CONNECTION_STRING

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
ENVEOF

echo "✅ Arquivo .env.local atualizado com novas credenciais!"
echo ""
echo "Novo projeto Supabase: ojlcvpqhbfnehuferyci"







