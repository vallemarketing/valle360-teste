const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  try {
    console.log('Criando usuário super admin...');

    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@valle360.com',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        full_name: 'Super Admin Valle 360'
      }
    });

    if (error) {
      console.error('Erro ao criar super admin:', error);
      return;
    }

    console.log('✅ Super Admin criado com sucesso!');
    console.log('📧 Email: admin@valle360.com');
    console.log('🔒 Senha: Admin123!');
    console.log('🔗 Acesse: http://localhost:3000/admin/login');
    console.log('\nUser ID:', data.user.id);

    // Registrar no audit log
    await supabase.rpc('log_audit_event', {
      p_action_type: 'INSERT',
      p_table_name: 'auth.users',
      p_record_id: data.user.id,
      p_new_data: { email: 'admin@valle360.com', role: 'super_admin' }
    });

    console.log('✅ Registro de auditoria criado');

  } catch (err) {
    console.error('Erro:', err);
  }
}

createSuperAdmin();
