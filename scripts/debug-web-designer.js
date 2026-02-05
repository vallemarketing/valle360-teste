import { createClient } from '@supabase/supabase-js';

// Sem hardcode de chaves (use variáveis de ambiente)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente antes de rodar este script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWebDesigner() {
  const email = process.env.TARGET_EMAIL || 'web@valle360.com';
  console.log(`🔍 Diagnóstico para: ${email}`);

  // 1. Auth
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('❌ Usuário não encontrado no Auth.');
    return;
  }
  console.log('✅ ID:', user.id);

  // 2. Employee Table (onde a role "Web Designer" pode estar escrita de várias formas)
  const { data: emp } = await supabase.from('employees').select('*').eq('user_id', user.id).single();
  console.log('📋 Tabela employees:');
  console.log('   - Department:', emp?.department);
  console.log('   - Position:', emp?.position);
  console.log('   - Area of Expertise:', emp?.area_of_expertise);

  // 3. User Profile
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();
  console.log('👤 Tabela user_profiles:', profile);
}

checkWebDesigner();












