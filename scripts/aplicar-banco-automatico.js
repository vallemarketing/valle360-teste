#!/usr/bin/env node

/**
 * Script para aplicar estrutura do banco automaticamente no Supabase
 * Usa o Service Role Key para executar SQL diretamente
 */

const fs = require('fs');
const path = require('path');

// Carregar credenciais do .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const env = {};
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

// Executar SQL no Supabase
async function executarSQL(url, serviceRoleKey, sql) {
  const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    throw new Error(`Erro ao executar SQL: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Main
async function main() {
  console.log('🚀 Iniciando aplicação da estrutura do banco...\n');

  // 1. Carregar credenciais
  console.log('📋 Carregando credenciais...');
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Credenciais não encontradas no .env.local');
    process.exit(1);
  }

  console.log('✅ Credenciais carregadas\n');

  // 2. Ler script SQL completo
  console.log('📋 Lendo script SQL completo...');
  const sqlPath = path.join(__dirname, '..', 'supabase', '⚡_SCRIPT_COMPLETO_EXECUTAR_TUDO.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  console.log(`✅ Script carregado (${sqlContent.length} caracteres)\n`);

  // 3. Executar SQL
  console.log('🔄 Executando SQL no Supabase...');
  console.log('⏳ Isso pode levar alguns minutos...\n');

  try {
    // O Supabase pode não ter endpoint direto, então vamos usar o Management API
    // Alternativamente, podemos criar um arquivo e instruir o usuário
    console.log('⚠️  A API REST do Supabase não permite execução direta de DDL.');
    console.log('📋 Por favor, execute manualmente seguindo os passos:\n');
    console.log('1. Acesse: https://supabase.com/dashboard/project/ikjgsqtykkhqimypacro/sql/new');
    console.log('2. Abra o arquivo: valle-360/supabase/⚡_SCRIPT_COMPLETO_EXECUTAR_TUDO.sql');
    console.log('3. Copie todo o conteúdo');
    console.log('4. Cole no SQL Editor do Supabase');
    console.log('5. Clique em "Run" ou pressione Cmd+Enter\n');
    console.log('💡 Depois, execute o script de criar admin:');
    console.log('   valle-360/supabase/criar_admin_novo_v2.sql\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();

