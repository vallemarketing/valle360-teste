@echo off
chcp 65001 >nul
echo.
echo ════════════════════════════════════════════════════════════════════════════
echo 🔧 CORRIGIR ERRO: Could not find 'plan_id' column
echo ════════════════════════════════════════════════════════════════════════════
echo.
echo 📋 O que este script faz:
echo    ✅ Adiciona colunas faltantes na tabela clients
echo    ✅ Corrige o erro 500 ao criar cliente
echo    ✅ Adiciona: plan_id, email, company_name, status, etc
echo.
echo ════════════════════════════════════════════════════════════════════════════
echo.
echo 🚀 EXECUTANDO MIGRATION NO SUPABASE...
echo.

REM Verificar se o Supabase CLI está instalado
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI não encontrado!
    echo.
    echo 📦 Você tem 2 opções:
    echo.
    echo    1. INSTALAR O SUPABASE CLI:
    echo       npm install -g supabase
    echo.
    echo    2. EXECUTAR MANUALMENTE:
    echo       - Acesse: https://supabase.com/dashboard
    echo       - Vá em SQL Editor
    echo       - Cole o conteúdo do arquivo:
    echo         supabase/migrations/20260123000001_add_missing_columns_to_clients.sql
    echo.
    pause
    exit /b 1
)

REM Executar o SQL
echo 📤 Enviando SQL para o Supabase...
echo.
supabase db execute -f supabase/migrations/20260123000001_add_missing_columns_to_clients.sql

if %errorlevel% equ 0 (
    echo.
    echo ════════════════════════════════════════════════════════════════════════════
    echo ✅ SUCESSO!
    echo ════════════════════════════════════════════════════════════════════════════
    echo.
    echo 🎉 Colunas adicionadas à tabela clients!
    echo.
    echo 📋 Próximos passos:
    echo    1. Recarregue a página do admin
    echo    2. Tente criar o cliente novamente
    echo    3. Deve funcionar sem erros!
    echo.
    echo 💡 Colunas adicionadas:
    echo    • plan_id
    echo    • email
    echo    • company_name
    echo    • contact_name
    echo    • contact_email
    echo    • contact_phone
    echo    • industry
    echo    • website
    echo    • address
    echo    • status
    echo    • monthly_value
    echo    • segment
    echo    • competitors
    echo    • is_active
    echo    • onboarding_completed
    echo.
    echo ════════════════════════════════════════════════════════════════════════════
) else (
    echo.
    echo ════════════════════════════════════════════════════════════════════════════
    echo ❌ ERRO AO EXECUTAR SQL
    echo ════════════════════════════════════════════════════════════════════════════
    echo.
    echo 💡 Solução alternativa:
    echo    1. Acesse: https://supabase.com/dashboard
    echo    2. Selecione o projeto Valle 360
    echo    3. Vá em SQL Editor
    echo    4. Copie o conteúdo de:
    echo       supabase/migrations/20260123000001_add_missing_columns_to_clients.sql
    echo    5. Cole e execute
    echo.
)

echo.
pause
