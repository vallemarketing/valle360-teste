@echo off
chcp 65001 >nul
echo.
echo ════════════════════════════════════════════════════════════════════════════
echo 🔧 CORRIGIR ERROS - Shane Santiago
echo ════════════════════════════════════════════════════════════════════════════
echo.
echo 📋 O que este script faz:
echo    ✅ Adiciona o usuário na tabela public.users
echo    ✅ Corrige o perfil em user_profiles
echo    ✅ Remove os erros 400 do console
echo.
echo ════════════════════════════════════════════════════════════════════════════
echo.
echo 🚀 EXECUTANDO SQL NO SUPABASE...
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
    echo         supabase/criar_shane_na_tabela_users.sql
    echo.
    pause
    exit /b 1
)

REM Executar o SQL
echo 📤 Enviando SQL para o Supabase...
echo.
supabase db execute -f supabase/criar_shane_na_tabela_users.sql

if %errorlevel% equ 0 (
    echo.
    echo ════════════════════════════════════════════════════════════════════════════
    echo ✅ SUCESSO!
    echo ════════════════════════════════════════════════════════════════════════════
    echo.
    echo 🎉 Usuário Shane Santiago corrigido!
    echo.
    echo 📋 Próximos passos:
    echo    1. Faça logout do sistema
    echo    2. Acesse: http://localhost:3000/login
    echo    3. Email: shane.santiago.12@gmail.com
    echo    4. Senha: @Shane5799
    echo    5. Os erros não devem mais aparecer!
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
    echo    4. Copie o conteúdo de: supabase/criar_shane_na_tabela_users.sql
    echo    5. Cole e execute
    echo.
)

echo.
pause
