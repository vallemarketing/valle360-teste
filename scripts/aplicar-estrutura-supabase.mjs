#!/usr/bin/env node

/**
 * Script para aplicar estrutura do banco automaticamente no Supabase
 * Usa o Management API do Supabase com Service Role Key
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar credenciais do .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const env = {};
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

// Executar SQL via API do Supabase (usando postgREST)
async function executarSQL(projectRef, serviceRoleKey, sql) {
  // Extrair project ref da URL
  const url = `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql })
    });

    const text = await response.text();
    
    if (!response.ok) {
      return { success: false, error: `${response.status}: ${text}` };
    }

    return { success: true, data: text };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Dividir SQL em statements individuais
function dividirSQL(sql) {
  // Remove comments
  sql = sql.replace(/--.*$/gm, '');
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Split by semicolon but keep in same string if inside quotes or function
  const statements = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];
    
    // Handle quotes
    if ((char === "'" || char === '"') && (i === 0 || sql[i - 1] !== '\\')) {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
    }
    
    current += char;
    
    // Split on semicolon if not in quote
    if (char === ';' && !inQuote) {
      const trimmed = current.trim();
      if (trimmed && trimmed !== ';') {
        statements.push(trimmed);
      }
      current = '';
    }
  }
  
  // Add remaining
  const trimmed = current.trim();
  if (trimmed && trimmed !== ';') {
    statements.push(trimmed);
  }
  
  return statements.filter(s => s.length > 0);
}

// Main
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║     🚀  APLICANDO ESTRUTURA NO SUPABASE                   ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // 1. Carregar credenciais
  console.log('📋 Passo 1/4: Carregando credenciais...');
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Credenciais não encontradas no .env.local');
    process.exit(1);
  }

  // Extrair project ref da URL
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
  console.log(`✅ Project: ${projectRef}\n`);

  // 2. Ler script SQL completo
  console.log('📋 Passo 2/4: Lendo script SQL completo...');
  const sqlPath = path.join(__dirname, '..', 'supabase', '⚡_SCRIPT_COMPLETO_EXECUTAR_TUDO.sql');
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Arquivo não encontrado: ${sqlPath}`);
    process.exit(1);
  }
  
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  console.log(`✅ Script carregado (${(sqlContent.length / 1024).toFixed(2)} KB)\n`);

  // 3. Informar usuário
  console.log('⚠️  IMPORTANTE:');
  console.log('   O Supabase não permite execução de DDL via API REST.');
  console.log('   Você precisa executar manualmente no SQL Editor.\n');

  console.log('📋 Passo 3/4: Copie e execute no SQL Editor\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🔗 LINK DO SQL EDITOR:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📝 INSTRUÇÕES:\n');
  console.log('1. Clique no link acima');
  console.log('2. Abra o arquivo: valle-360/supabase/⚡_SCRIPT_COMPLETO_EXECUTAR_TUDO.sql');
  console.log('3. Copie TODO o conteúdo (Cmd+A → Cmd+C)');
  console.log('4. Cole no SQL Editor do Supabase (Cmd+V)');
  console.log('5. Clique em "Run" ou pressione Cmd+Enter');
  console.log('6. Aguarde 10-30 segundos\n');

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📋 Passo 4/4: Depois, crie o admin\n');
  console.log('🔗 MESMO SQL EDITOR (nova query):');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  console.log('📝 ARQUIVO:');
  console.log('   valle-360/supabase/criar_admin_novo_v2.sql\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('✅ Quando terminar, me avise para testarmos o login!\n');
}

main().catch(console.error);

