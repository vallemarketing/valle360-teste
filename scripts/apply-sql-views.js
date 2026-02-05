import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sem hardcode de chaves (use variáveis de ambiente)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente antes de rodar este script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyViews() {
  console.log('🚀 Aplicando Views SQL...');
  
  const sqlPath = path.resolve(__dirname, '../supabase/migrations/analytics_views.sql');
  
  try {
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Supabase JS client não executa SQL raw diretamente sem RPC ou extensão.
    // Mas podemos usar a API REST pg_execute se habilitada, ou simular via query.
    // Para este ambiente, vamos tentar via RPC se existir, ou logar para aplicação manual.
    // Como não temos um RPC genérico 'exec_sql', vamos assumir que o usuário aplicará manualmente
    // OU, se tivermos permissão direta de postgrest (raro).
    
    console.log('⚠️  ATENÇÃO: O cliente JS não suporta execução direta de DDL (CREATE VIEW).');
    console.log('📋 Por favor, execute o conteúdo de "supabase/migrations/analytics_views.sql" no SQL Editor do Supabase.');
    console.log('\nConteúdo do Arquivo:');
    console.log(sqlContent);

  } catch (error) {
    console.error('❌ Erro ao ler arquivo SQL:', error);
  }
}

applyViews();












