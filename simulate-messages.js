require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateMessages() {
  console.log('🚀 Iniciando simulação de mensagens...\n');

  // 1. Buscar usuários existentes
  console.log('📋 Buscando usuários...');
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, user_type')
    .limit(10);

  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError);
    return;
  }

  if (!users || users.length === 0) {
    console.error('❌ Nenhum usuário encontrado no banco!');
    return;
  }

  console.log(`✅ ${users.length} usuários encontrados:`);
  users.forEach(u => console.log(`   - ${u.full_name} (${u.user_type})`));
  console.log('');

  const collaborators = users.filter(u => u.user_type === 'collaborator' || u.user_type === 'admin');
  const clients = users.filter(u => u.user_type === 'client');

  if (collaborators.length === 0) {
    console.log('⚠️  Nenhum colaborador encontrado');
    return;
  }

  // 2. Criar grupo geral se não existir
  console.log('📁 Verificando grupo geral...');
  let { data: generalGroup } = await supabase
    .from('message_groups')
    .select('id')
    .eq('type', 'general')
    .eq('name', 'Valle 360 - Equipe Geral')
    .maybeSingle();

  if (!generalGroup) {
    console.log('   Criando grupo geral...');
    const { data: newGroup, error: groupError } = await supabase
      .from('message_groups')
      .insert({
        name: 'Valle 360 - Equipe Geral',
        description: 'Grupo automático com todos os colaboradores',
        type: 'general',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (groupError) {
      console.error('❌ Erro ao criar grupo:', groupError);
      return;
    }
    generalGroup = newGroup;
    console.log('✅ Grupo geral criado!');
  } else {
    console.log('✅ Grupo geral já existe!');
  }

  // 3. Adicionar colaboradores ao grupo
  console.log('\n👥 Adicionando colaboradores ao grupo...');
  for (const collab of collaborators) {
    const { error } = await supabase
      .from('group_participants')
      .upsert({
        group_id: generalGroup.id,
        user_id: collab.id,
        role: collab.user_type === 'admin' ? 'admin' : 'member',
        is_active: true,
        joined_at: new Date().toISOString()
      }, { onConflict: 'group_id,user_id' });

    if (!error) {
      console.log(`   ✅ ${collab.full_name} adicionado`);
    }
  }

  // 4. Criar mensagens no grupo geral
  console.log('\n💬 Criando mensagens no grupo geral...');
  const groupMessages = [
    { text: 'Bom dia, equipe! Como estão os projetos hoje?', delay: 0 },
    { text: 'Tudo certo por aqui! Estou finalizando o design do novo cliente.', delay: 2 },
    { text: 'Pessoal, precisamos de uma reunião para alinhar as entregas da semana', delay: 5 },
    { text: 'Ótima ideia! Que tal hoje às 15h?', delay: 8 },
    { text: 'Perfeito! Já adiciono no calendário.', delay: 10 },
    { text: 'Alguém viu o briefing do cliente novo que chegou ontem?', delay: 15 },
    { text: 'Vi sim! Já estou trabalhando na proposta.', delay: 18 },
    { text: '👍 Excelente trabalho, equipe!', delay: 20 },
  ];

  const now = new Date();
  for (let i = 0; i < groupMessages.length; i++) {
    const msg = groupMessages[i];
    const sender = collaborators[i % collaborators.length];
    const timestamp = new Date(now.getTime() - (30 - msg.delay) * 60000);

    const { error } = await supabase
      .from('messages')
      .insert({
        group_id: generalGroup.id,
        from_user_id: sender.id,
        body: msg.text,
        type: 'text',
        created_at: timestamp.toISOString()
      });

    if (!error) {
      console.log(`   ✅ Mensagem ${i + 1}/${groupMessages.length} criada`);
    }
  }

  // Atualizar preview e timestamp do grupo
  await supabase
    .from('message_groups')
    .update({
      last_message_preview: groupMessages[groupMessages.length - 1].text,
      last_message_at: new Date().toISOString()
    })
    .eq('id', generalGroup.id);

  // 5. Criar conversas diretas com clientes
  if (clients.length > 0 && collaborators.length > 0) {
    console.log('\n💼 Criando conversas com clientes...');

    for (const client of clients.slice(0, 3)) {
      const collab = collaborators[0];

      // Criar conversa direta
      const { data: conversation, error: convError } = await supabase
        .from('direct_conversations')
        .insert({
          is_client_conversation: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          last_message_at: new Date().toISOString(),
          last_message_preview: 'Obrigado pelo retorno!'
        })
        .select()
        .single();

      if (convError) {
        console.log(`   ❌ Erro ao criar conversa com ${client.full_name}`);
        continue;
      }

      // Adicionar participantes
      await supabase.from('direct_conversation_participants').insert([
        {
          conversation_id: conversation.id,
          user_id: collab.id,
          is_active: true,
          unread_count: 0
        },
        {
          conversation_id: conversation.id,
          user_id: client.id,
          is_active: true,
          unread_count: 2
        }
      ]);

      // Criar mensagens
      const clientMessages = [
        { from: collab, text: `Olá ${client.full_name}! Como posso ajudar hoje?`, delay: 60 },
        { from: client, text: 'Oi! Gostaria de saber sobre o andamento do projeto.', delay: 55 },
        { from: collab, text: 'Claro! Estamos na fase final. Deve ficar pronto até sexta.', delay: 50 },
        { from: client, text: 'Perfeito! Vocês são ótimos! 😊', delay: 45 },
        { from: collab, text: 'Obrigado pelo retorno!', delay: 40 }
      ];

      for (const msg of clientMessages) {
        await supabase.from('direct_messages').insert({
          conversation_id: conversation.id,
          from_user_id: msg.from.id,
          body: msg.text,
          message_type: 'text',
          created_at: new Date(Date.now() - msg.delay * 60000).toISOString()
        });
      }

      console.log(`   ✅ Conversa com ${client.full_name} criada (${clientMessages.length} mensagens)`);
    }
  }

  // 6. Criar conversas diretas entre colaboradores
  if (collaborators.length >= 2) {
    console.log('\n👨‍💼 Criando conversas entre colaboradores...');

    const collab1 = collaborators[0];
    const collab2 = collaborators[1];

    const { data: teamConv, error: teamConvError } = await supabase
      .from('direct_conversations')
      .insert({
        is_client_conversation: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        last_message_at: new Date(Date.now() - 300000).toISOString(),
        last_message_preview: 'Combinado! Até mais tarde.'
      })
      .select()
      .single();

    if (!teamConvError) {
      await supabase.from('direct_conversation_participants').insert([
        {
          conversation_id: teamConv.id,
          user_id: collab1.id,
          is_active: true,
          unread_count: 0
        },
        {
          conversation_id: teamConv.id,
          user_id: collab2.id,
          is_active: true,
          unread_count: 1
        }
      ]);

      const teamMessages = [
        { from: collab1, text: 'E aí, tudo bem?', delay: 120 },
        { from: collab2, text: 'Tudo ótimo! E você?', delay: 118 },
        { from: collab1, text: 'Também! Viu aquele projeto novo?', delay: 115 },
        { from: collab2, text: 'Vi sim! Parece desafiador.', delay: 110 },
        { from: collab1, text: 'Vamos precisar se reunir para discutir.', delay: 105 },
        { from: collab2, text: 'Combinado! Até mais tarde.', delay: 5 }
      ];

      for (const msg of teamMessages) {
        await supabase.from('direct_messages').insert({
          conversation_id: teamConv.id,
          from_user_id: msg.from.id,
          body: msg.text,
          message_type: 'text',
          created_at: new Date(Date.now() - msg.delay * 60000).toISOString()
        });
      }

      console.log(`   ✅ Conversa entre ${collab1.full_name} e ${collab2.full_name} criada`);
    }
  }

  // 7. Criar projeto no Kanban com grupo vinculado
  console.log('\n📋 Criando projeto no Kanban com grupo...');
  if (collaborators.length > 0) {
    const creator = collaborators[0];

    const { data: board, error: boardError } = await supabase
      .from('kanban_boards')
      .insert({
        name: 'Campanha Black Friday 2024',
        description: 'Projeto para campanha de Black Friday',
        created_by: creator.id,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (!boardError && board) {
      console.log('   ✅ Board criado:', board.name);

      // O trigger deve criar o grupo automaticamente
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: projectGroup } = await supabase
        .from('message_groups')
        .select('id, name')
        .eq('project_id', board.id)
        .maybeSingle();

      if (projectGroup) {
        console.log('   ✅ Grupo do projeto criado automaticamente!');

        // Adicionar mensagens ao grupo do projeto
        const projectMessages = [
          'Pessoal, vamos começar o planejamento da campanha!',
          'Precisamos definir as peças criativas até amanhã.',
          'Já tenho algumas ideias para compartilhar.',
        ];

        for (const text of projectMessages) {
          await supabase.from('messages').insert({
            group_id: projectGroup.id,
            from_user_id: creator.id,
            body: text,
            type: 'text',
            created_at: new Date().toISOString()
          });
        }

        console.log(`   ✅ ${projectMessages.length} mensagens adicionadas ao grupo do projeto`);
      }
    }
  }

  console.log('\n✨ Simulação concluída com sucesso!\n');
  console.log('📊 Resumo:');
  console.log('   ✅ Grupo geral com colaboradores');
  console.log('   ✅ Mensagens no grupo geral');
  console.log('   ✅ Conversas com clientes (prioritárias)');
  console.log('   ✅ Conversas entre colaboradores');
  console.log('   ✅ Projeto Kanban com grupo vinculado');
  console.log('\n🎯 Acesse /app/mensagens para ver todas as conversas!');
}

simulateMessages().catch(console.error);
