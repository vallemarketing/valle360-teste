import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tenta carregar .env.local da raiz
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos.');
    console.log('   Verifique seu arquivo .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function resetAndSeed() {
    console.log('🔄 Iniciando Reset Remoto e Seed...');
    
    try {
        // 1. Limpar dados existentes (Lógica do reset_and_seed_designer.sql)
        console.log('🗑️  Limpando usuário designer@valle360.com...');
        
        // Buscar ID do usuário pelo email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        const designerUser = users?.find(u => u.email === 'designer@valle360.com');
        
        if (designerUser) {
             // Delete from employees first (FK constraint)
             const { error: empDelError } = await supabase.from('employees').delete().eq('user_id', designerUser.id);
             if (empDelError) console.log('   ⚠️  Erro ao deletar employees (pode não existir):', empDelError.message);
             
             const { error: profDelError } = await supabase.from('user_profiles').delete().eq('user_id', designerUser.id);
             if (profDelError) console.log('   ⚠️  Erro ao deletar user_profiles (pode não existir):', profDelError.message);
             
             // Delete from auth.users
             const { error: deleteError } = await supabase.auth.admin.deleteUser(designerUser.id);
             if (deleteError) console.error('   ⚠️  Erro ao deletar Auth:', deleteError.message);
             else console.log('   ✅ Usuário Auth deletado.');
        } else {
            console.log('   ℹ️  Usuário não encontrado, prosseguindo para criação.');
        }

        // 2. Recriar Usuário
        console.log('🌱 Recriando usuário designer@valle360.com...');
        
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: 'designer@valle360.com',
            password: 'Valle@2024',
            email_confirm: true,
            user_metadata: { full_name: 'Designer Valle' }
        });

        if (createError) {
            console.error('❌ Erro ao criar usuário:', createError.message);
            return;
        }
        
        const userId = newUser.user.id;
        console.log(`   ✅ Usuário criado com ID: ${userId}`);

        // 3. Inserir em employees
        console.log('   Inserindo em employees...');
        const { error: empError } = await supabase.from('employees').upsert({
            user_id: userId,
            full_name: 'Designer Valle',
            email: 'designer@valle360.com',
            role: 'colaborador',
            area_of_expertise: 'Design',
            department: 'Design',
            is_active: true,
            admission_date: new Date().toISOString()
        });
        if (empError) console.error('   ❌ Erro employees:', empError.message);
        else console.log('   ✅ employees atualizado.');

        // 4. Inserir em user_profiles
        console.log('   Inserindo em user_profiles...');
        const { error: profError } = await supabase.from('user_profiles').upsert({
            user_id: userId,
            full_name: 'Designer Valle',
            email: 'designer@valle360.com',
            user_type: 'employee',
            avatar_url: 'https://ui-avatars.com/api/?name=Designer+Valle&background=random'
        });
        if (profError) console.error('   ❌ Erro user_profiles:', profError.message);
        else console.log('   ✅ user_profiles atualizado.');

        console.log('\n🎉 Reset e Seed concluídos com sucesso!');
        console.log('🔑 Credenciais: designer@valle360.com / Valle@2024');

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

resetAndSeed();
