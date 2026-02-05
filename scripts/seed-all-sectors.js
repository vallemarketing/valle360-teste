import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sectors = [
  { role: 'designer', name: 'Designer Valle', email: 'designer@valle360.com', area: 'Design' },
  { role: 'web_designer', name: 'Web Designer Valle', email: 'web@valle360.com', area: 'Web Design' },
  { role: 'head_marketing', name: 'Head Marketing Valle', email: 'head@valle360.com', area: 'Head de Marketing' },
  { role: 'rh', name: 'RH Valle', email: 'rh@valle360.com', area: 'RH' },
  { role: 'financeiro', name: 'Financeiro Valle', email: 'financeiro@valle360.com', area: 'Financeiro' },
  { role: 'video_maker', name: 'Video Maker Valle', email: 'video@valle360.com', area: 'Video Maker' },
  { role: 'social_media', name: 'Social Media Valle', email: 'social@valle360.com', area: 'Social Media' },
  { role: 'trafego', name: 'Gestor Tráfego Valle', email: 'trafego@valle360.com', area: 'Tráfego' },
  { role: 'comercial', name: 'Comercial Valle', email: 'comercial@valle360.com', area: 'Comercial' }
];

async function seedSectors() {
  console.log('🌱 Iniciando Seed de Usuários por Setor...');

  for (const sector of sectors) {
    console.log(`\n🔹 Processando: ${sector.area} (${sector.email})`);

    // 1. Criar Usuário Auth (SignUp)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sector.email,
      password: 'Valle@2024',
      options: {
        data: { full_name: sector.name }
      }
    });

    let userId = authData.user?.id;

    if (authError) {
      console.log(`   ℹ️  Auth: Usuário já existe ou erro: ${authError.message}`);
      // Tentar login para pegar ID se já existir
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: sector.email,
        password: 'Valle@2024'
      });
      userId = loginData.user?.id;
    } else {
      console.log(`   ✅ Auth: Usuário criado.`);
    }

    if (!userId) {
      console.error(`   ❌ Falha crítica: Não foi possível obter ID para ${sector.email}`);
      continue;
    }

    // 2. Atualizar Tabela Pública: employees
    const employeeData = {
      user_id: userId,
      full_name: sector.name,
      email: sector.email,
      department: sector.area,
      position: sector.role, // Usando role como cargo simplificado
      area_of_expertise: sector.area,
      is_active: true
    };

    const { error: empError } = await supabase
      .from('employees')
      .upsert(employeeData, { onConflict: 'user_id' });

    if (empError) console.error(`   ❌ Erro employees: ${empError.message}`);
    else console.log(`   ✅ Tabela employees atualizada.`);

    // 3. Atualizar Tabela Pública: user_profiles
    const profileData = {
      user_id: userId,
      full_name: sector.name,
      email: sector.email,
      user_type: 'employee', // Todos são colaboradores
      role: 'employee',      // Role do sistema (não cargo)
      is_active: true
    };

    const { error: profError } = await supabase
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'user_id' });

    if (profError) console.error(`   ❌ Erro user_profiles: ${profError.message}`);
    else console.log(`   ✅ Tabela user_profiles atualizada.`);
  }

  console.log('\n🎉 Seed Completo! Todos os setores criados com senha "Valle@2024".');
}

seedSectors();

