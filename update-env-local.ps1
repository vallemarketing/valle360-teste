# ========================================
# Script para atualizar .env.local
# Valle 360 - Ambiente Local
# ========================================

Write-Host "🔑 Configurando variáveis de ambiente locais..." -ForegroundColor Cyan
Write-Host ""

# Solicitar as credenciais do Vercel
Write-Host "📋 Cole as variáveis do Vercel Dashboard:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣  NEXT_PUBLIC_SUPABASE_URL (ex: https://xxx.supabase.co):" -ForegroundColor Green
$supabaseUrl = Read-Host "URL"

Write-Host ""
Write-Host "2️⃣  NEXT_PUBLIC_SUPABASE_ANON_KEY (chave pública):" -ForegroundColor Green
$anonKey = Read-Host "Anon Key"

Write-Host ""
Write-Host "3️⃣  SUPABASE_SERVICE_ROLE_KEY (chave secreta):" -ForegroundColor Green
$serviceKey = Read-Host "Service Role Key"

# Criar arquivo .env.local
$envContent = @"
# ==================================
# ENVIRONMENT VARIABLES - Valle 360
# Atualizado: $(Get-Date -Format "dd/MM/yyyy HH:mm")
# ==================================

# ==========================================
# Supabase Configuration (do Vercel)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey

# Service Role Key (Backend/Admin apenas)
SUPABASE_SERVICE_ROLE_KEY=$serviceKey

# ==========================================
# Application
# ==========================================
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
PORT=3000

# ==========================================
# Setup Routes (permite criar admin)
# ==========================================
ENABLE_SETUP_ROUTES=1
"@

# Salvar arquivo
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "✅ Arquivo .env.local criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Agora reinicie o servidor Next.js:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
