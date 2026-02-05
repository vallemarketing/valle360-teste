#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (sem hardcode de chaves)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente antes de rodar este script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executarSQL(arquivo, descricao) {
  console.log(`\n📋 Executando: ${descricao}...`);
  
  try {
    const sql = fs.readFileSync(arquivo, 'utf8');
    
    // Dividir em statements individuais (separados por ponto-e-vírgula)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   📊 Total de comandos: ${statements.length}`);
    
    let sucesso = 0;
    let erros = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          query: statement 
        });
        
        if (error) {
          // Alguns erros podem ser normais (ex: "já existe")
          if (error.message.includes('already exists') || 
              error.message.includes('já existe')) {
            console.log(`   ⚠️  Comando ${i + 1}: Já existe (ignorando)`);
          } else {
            console.log(`   ❌ Comando ${i + 1}: ${error.message.substring(0, 100)}`);
            erros++;
          }
        } else {
          sucesso++;
          if ((i + 1) % 10 === 0) {
            console.log(`   ✅ Processados ${i + 1}/${statements.length}...`);
          }
        }
      } catch (e) {
        console.log(`   ❌ Erro no comando ${i + 1}: ${e.message}`);
        erros++;
      }
    }
    
    console.log(`\n   ✅ Sucesso: ${sucesso}`);
    if (erros > 0) {
      console.log(`   ⚠️  Erros: ${erros} (alguns podem ser normais)`);
    }
    
    return true;
  } catch (error) {
    console.error(`   ❌ Erro ao ler arquivo: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 INICIANDO APLICAÇÃO DA ESTRUTURA DO BANCO\n');
  console.log('📡 Conectando ao Supabase...');
  console.log(`   URL: ${SUPABASE_URL}\n`);
  
  // 1. Aplicar estrutura do banco
  const arquivoEstrutura = path.join(__dirname, '..', 'Downloads', 'supabase_database_structure.sql');
  
  if (!fs.existsSync(arquivoEstrutura)) {
    console.error('❌ Arquivo não encontrado: supabase_database_structure.sql');
    console.log('\n📍 Procure em: /Users/imac/Desktop/N8N/Downloads/');
    process.exit(1);
  }
  
  await executarSQL(arquivoEstrutura, 'Estrutura do Banco (30+ tabelas)');
  
  console.log('\n' + '='.repeat(60));
  
  // 2. Criar admin
  const arquivoAdmin = path.join(__dirname, 'supabase', 'criar_admin_novo.sql');
  
  if (!fs.existsSync(arquivoAdmin)) {
    console.error('❌ Arquivo não encontrado: criar_admin_novo.sql');
    process.exit(1);
  }
  
  await executarSQL(arquivoAdmin, 'Usuário Admin (Guilherme)');
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 CONCLUÍDO!\n');
  console.log('📊 Banco de dados configurado');
  console.log('👤 Admin criado: guilherme@vallegroup.com.br');
  console.log('🔐 Senha: <SENHA_DEFINIDA_NO_AMBIENTE>');
  console.log('\n🚀 Acesse: http://localhost:3000/login\n');
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});







