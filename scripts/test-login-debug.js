const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontradas.');
  console.log('Verifique o arquivo .env.local na raiz do projeto.');
  process.exit(1);
}

console.log(`🔌 Conectando ao Supabase: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  const email = 'designer@valle360.com';
  const password = 'Valle@2024';

  console.log(`\n🔑 Tentando login com: ${email}`);

  // 1. Tentar Login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('❌ FALHA NO LOGIN (Auth):');
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Status: ${error.status}`);
    console.log('\n💡 Possíveis causas:');
    console.log('   1. Usuário não existe na tabela auth.users.');
    console.log('   2. Senha incorreta (hash no banco diferente).');
    console.log('   3. Você está conectado ao projeto Supabase errado.');
    return;
  }

  console.log('✅ LOGIN (Auth) SUCESSO!');
  console.log(`   User ID: ${data.user.id}`);

  // 2. Verificar Tabela Employees
  console.log('\n🔍 Verificando tabela employees...');
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', data.user.id)
    .single();

  if (empError) {
    console.error('❌ ERRO AO BUSCAR EMPLOYEE:');
    console.error(`   ${empError.message}`);
  } else if (!employee) {
    console.warn('⚠️  ATENÇÃO: Usuário logado, mas NÃO encontrado na tabela employees.');
  } else {
    console.log('✅ EMPLOYEE ENCONTRADO!');
    console.log(`   Nome: ${employee.first_name} ${employee.last_name}`);
    console.log(`   Cargo: ${employee.role}`);
    console.log(`   Área: ${employee.area}`);
  }

  // 3. Verificar Tabela User Profiles
  console.log('\n🔍 Verificando tabela user_profiles...');
  const { data: profile, error: profError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', data.user.id)
    .single();
  
  if (profError) {
    console.warn(`⚠️  User Profile não encontrado ou erro: ${profError.message}`);
  } else {
    console.log('✅ USER PROFILE ENCONTRADO!');
    console.log(`   Tipo: ${profile.user_type}`);
  }
}

testLogin();

