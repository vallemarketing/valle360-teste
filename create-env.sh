#!/bin/bash
cat > .env.local << 'ENVEOF'
# ==================================
# ENVIRONMENT VARIABLES - Valle 360
# CONFIGURADO EM: 14/11/2025
# ==================================

# ==========================================
# Supabase Configuration
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://enzazswaehuawcugexbr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

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
HOSTNAME=0.0.0.0

# ==========================================
# Redis (Docker)
# ==========================================
REDIS_URL=redis://redis:6379
ENVEOF

echo "✅ Arquivo .env.local criado com sucesso!"







