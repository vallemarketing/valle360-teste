require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('URL:', supabaseUrl);
  process.exit(1);
}

console.log('🔧 Conectando ao Supabase...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const demoUsers = [
  { email: 'admin@valle360.com', password: 'Admin123!', full_name: 'Carlos Admin', user_type: 'admin', phone: '5511999999001' },
  { email: 'designer@valle360.com', password: 'Demo123!', full_name: 'Ana Designer', user_type: 'collaborator', phone: '5511999999002' },
  { email: 'social@valle360.com', password: 'Demo123!', full_name: 'Bruno Social Media', user_type: 'collaborator', phone: '5511999999003' },
  { email: 'trafego@valle360.com', password: 'Demo123!', full_name: 'Carla Tráfego', user_type: 'collaborator', phone: '5511999999004' },
  { email: 'cliente1@empresa.com', password: 'Demo123!', full_name: 'João Silva', user_type: 'client', phone: '5511988888001' },
  { email: 'cliente2@empresa.com', password: 'Demo123!', full_name: 'Maria Santos', user_type: 'client', phone: '5511988888002' },
];

async function setupDemoData() {
  console.log('🚀 Configurando dados de demonstração...\n');

  const createdUsers = [];

  // 1. Criar usuários
  console.log('👥 Criando usuários...');
  for (const user of demoUsers) {
    try {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (existing) {
        console.log(`   ⏭️  ${user.full_name} já existe`);
        createdUsers.push({ ...user, id: existing.id });
        continue;
      }

      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.user_type
        }
      });

      if (authError) {
        console.error(`   ❌ Erro ao criar ${user.full_name}:`, authError.message);
        continue;
      }

      // Criar profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: user.email,
          full_name: user.full_name,
          user_type: user.user_type,
          phone_number: user.phone,
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error(`   ❌ Erro ao criar perfil:`, profileError.message);
        continue;
      }

      createdUsers.push({ ...user, id: authData.user.id });
      console.log(`   ✅ ${user.full_name} (${user.user_type})`);
    } catch (error) {
      console.error(`   ❌ Erro:`, error.message);
    }
  }

  if (createdUsers.length === 0) {
    console.error('\n❌ Nenhum usuário foi criado!');
    return;
  }

  console.log(`\n✅ ${createdUsers.length} usuários prontos!\n`);

  const collaborators = createdUsers.filter(u => u.user_type === 'collaborator' || u.user_type === 'admin');
  const clients = createdUsers.filter(u => u.user_type === 'client');

  // 2. Criar grupo geral
  console.log('📁 Criando grupo geral...');
  const { data: generalGroup, error: groupError } = await supabase
    .from('message_groups')
    .upsert({
      name: 'Valle 360 - Equipe Geral',
      description: 'Grupo automático com todos os colaboradores',
      type: 'general',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'name' })
    .select()
    .single();

  if (groupError) {
    console.error('❌ Erro ao criar grupo:', groupError.message);
  } else {
    console.log('✅ Grupo geral criado!');

    // Adicionar colaboradores
    for (const collab of collaborators) {
      await supabase.from('group_participants').upsert({
        group_id: generalGroup.id,
        user_id: collab.id,
        role: collab.user_type === 'admin' ? 'admin' : 'member',
        is_active: true,
        joined_at: new Date().toISOString(),
        unread_count: 0
      }, { onConflict: 'group_id,user_id' });
    }

    // Mensagens no grupo
    const groupMessages = [
      { user: collaborators[0], text: 'Bom dia, equipe! 🌅', delay: 0 },
      { user: collaborators[1], text: 'Bom dia! Como estão os projetos?', delay: 2 },
      { user: collaborators[2], text: 'Tudo certo! Finalizando as artes do cliente novo.', delay: 5 },
      { user: collaborators[0], text: 'Ótimo! Precisamos de uma reunião hoje às 15h.', delay: 8 },
      { user: collaborators[3] || collaborators[1], text: 'Confirmo presença! 👍', delay: 10 },
    ];

    const now = new Date();
    for (const msg of groupMessages) {
      if (msg.user) {
        const timestamp = new Date(now.getTime() - (20 - msg.delay) * 60000);
        await supabase.from('messages').insert({
          group_id: generalGroup.id,
          from_user_id: msg.user.id,
          body: msg.text,
          type: 'text',
          created_at: timestamp.toISOString()
        });
      }
    }

    await supabase.from('message_groups')
      .update({
        last_message_preview: groupMessages[groupMessages.length - 1].text,
        last_message_at: new Date().toISOString()
      })
      .eq('id', generalGroup.id);

    console.log(`✅ ${groupMessages.length} mensagens adicionadas ao grupo\n`);
  }

  // 3. Conversas com clientes
  if (clients.length > 0 && collaborators.length > 0) {
    console.log('💼 Criando conversas com clientes...');

    for (const client of clients) {
      const collab = collaborators[0];

      const { data: conv } = await supabase
        .from('direct_conversations')
        .insert({
          is_client_conversation: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          last_message_at: new Date().toISOString(),
          last_message_preview: 'Obrigado! Qualquer dúvida, estou à disposição.'
        })
        .select()
        .single();

      if (conv) {
        await supabase.from('direct_conversation_participants').insert([
          { conversation_id: conv.id, user_id: collab.id, is_active: true, unread_count: 0 },
          { conversation_id: conv.id, user_id: client.id, is_active: true, unread_count: 3 }
        ]);

        const messages = [
          { from: collab, text: `Olá ${client.full_name}! Tudo bem? 😊`, delay: 120 },
          { from: client, text: 'Oi! Tudo ótimo! Como está o projeto?', delay: 110 },
          { from: collab, text: 'Está indo muito bem! Já estamos na fase final.', delay: 100 },
          { from: client, text: 'Que bom! Quando fica pronto?', delay: 90 },
          { from: collab, text: 'Até sexta-feira você já tem tudo pronto! 🚀', delay: 80 },
          { from: client, text: 'Perfeito! Vocês são incríveis!', delay: 70 },
          { from: collab, text: 'Obrigado! Qualquer dúvida, estou à disposição.', delay: 5 }
        ];

        for (const msg of messages) {
          await supabase.from('direct_messages').insert({
            conversation_id: conv.id,
            from_user_id: msg.from.id,
            body: msg.text,
            message_type: 'text',
            created_at: new Date(Date.now() - msg.delay * 60000).toISOString()
          });
        }

        console.log(`   ✅ Conversa com ${client.full_name} (${messages.length} msgs)`);
      }
    }
  }

  // 4. Conversa entre colaboradores
  if (collaborators.length >= 2) {
    console.log('\n👨‍💼 Criando conversas entre colaboradores...');

    const { data: teamConv } = await supabase
      .from('direct_conversations')
      .insert({
        is_client_conversation: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        last_message_at: new Date(Date.now() - 300000).toISOString(),
        last_message_preview: 'Combinado! Vamos nos falar depois.'
      })
      .select()
      .single();

    if (teamConv) {
      await supabase.from('direct_conversation_participants').insert([
        { conversation_id: teamConv.id, user_id: collaborators[0].id, is_active: true, unread_count: 0 },
        { conversation_id: teamConv.id, user_id: collaborators[1].id, is_active: true, unread_count: 2 }
      ]);

      const messages = [
        { from: collaborators[0], text: 'Oi! Viu o briefing do novo cliente?', delay: 120 },
        { from: collaborators[1], text: 'Vi sim! Parece bem interessante.', delay: 115 },
        { from: collaborators[0], text: 'Vamos precisar reunir a equipe.', delay: 110 },
        { from: collaborators[1], text: 'Boa ideia! Que tal amanhã de manhã?', delay: 5 },
        { from: collaborators[0], text: 'Combinado! Vamos nos falar depois.', delay: 3 }
      ];

      for (const msg of messages) {
        await supabase.from('direct_messages').insert({
          conversation_id: teamConv.id,
          from_user_id: msg.from.id,
          body: msg.text,
          message_type: 'text',
          created_at: new Date(Date.now() - msg.delay * 60000).toISOString()
        });
      }

      console.log(`   ✅ Conversa entre ${collaborators[0].full_name} e ${collaborators[1].full_name}`);
    }
  }

  console.log('\n✨ Configuração concluída com sucesso!\n');
  console.log('📊 Dados criados:');
  console.log(`   👥 ${createdUsers.length} usuários`);
  console.log(`   💬 1 grupo geral com mensagens`);
  console.log(`   💼 ${clients.length} conversas com clientes`);
  console.log(`   👨‍💼 Conversas entre colaboradores`);
  console.log('\n🔐 Credenciais de acesso:');
  console.log('   📧 Email: admin@valle360.com');
  console.log('   🔒 Senha: Admin123!');
  console.log('\n🎯 Acesse: /login e depois /app/mensagens');
}

setupDemoData().catch(console.error);
