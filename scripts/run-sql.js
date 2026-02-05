import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Usar a SERVICE_ROLE_KEY se disponível para operações administrativas, senão ANON_KEY (que pode falhar para DDL)
// Assumindo que o usuário tem acesso ao dashboard, ele deve ter a service key ou usar a anon key com RLS permissivo
// Como não tenho a service key no .env.local padrão, vou tentar com a anon key e torcer para funcionar via RPC ou query direta se permitido
// Se falhar, precisaremos da service role key.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSql() {
  const sqlFilePath = process.argv[2];

  if (!sqlFilePath) {
    console.error('❌ Uso: node scripts/run-sql.js <caminho-do-arquivo-sql>');
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), sqlFilePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Arquivo não encontrado: ${fullPath}`);
    process.exit(1);
  }

  console.log(`📖 Lendo arquivo: ${fullPath}`);
  const sqlContent = fs.readFileSync(fullPath, 'utf8');

  console.log('🚀 Executando SQL...');
  
  // O Supabase JS Client não executa SQL arbitrário diretamente na versão cliente padrão sem uma função RPC específica.
  // Vou tentar usar uma função RPC 'exec_sql' se ela existir (comum em setups admin) ou usar a API de REST se permitido.
  // Como fallback, se falhar, instruirei o usuário a rodar no editor SQL do Supabase.
  
  // Tentativa 1: RPC 'exec_sql' (precisa ser criada no banco previamente)
  // Como não sei se existe, vou tentar criar via SQL Injection em uma query simples? Não, perigoso.
  
  // Melhor abordagem: Tentar rodar via POST direto na API se tiver permissão, ou avisar o usuário.
  // Mas espere, o tool `mcp_supabase_execute_sql` existe! Eu deveria ter usado ele.
  // Vou abortar este script e usar a ferramenta correta `mcp_supabase_execute_sql` se disponível, 
  // ou `mcp_supabase_apply_migration`.
  
  console.log('⚠️ Este script é apenas um wrapper. Recomendo usar as tools do MCP ou o painel do Supabase.');
  console.log('SQL Content Preview:');
  console.log(sqlContent.substring(0, 200) + '...');
}

runSql();

