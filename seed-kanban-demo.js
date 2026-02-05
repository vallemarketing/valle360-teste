require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedKanbanDemo() {
  console.log('🌱 Iniciando seed de dados demo do Kanban...\n');

  try {
    // 1. Buscar usuários existentes
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, full_name, user_type')
      .limit(10);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      console.log('❌ Nenhum usuário encontrado. Crie usuários primeiro.');
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuários`);

    // 2. Criar projeto Kanban
    const { data: project, error: projectError } = await supabase
      .from('kanban_projects')
      .insert({
        name: 'Projeto Valle 360 - Q4 2025',
        description: 'Projeto principal de desenvolvimento e marketing para o último trimestre',
        created_by: users[0].id,
      })
      .select()
      .single();

    if (projectError) throw projectError;
    console.log(`✅ Projeto criado: ${project.name}`);

    // 3. Adicionar membros ao projeto
    const members = users.slice(0, 5).map(user => ({
      project_id: project.id,
      user_id: user.id,
      role: user.user_type === 'super_admin' ? 'admin' : 'member',
    }));

    const { error: membersError } = await supabase
      .from('kanban_project_members')
      .insert(members);

    if (membersError) throw membersError;
    console.log(`✅ ${members.length} membros adicionados ao projeto`);

    // 4. Criar colunas
    const columns = [
      { title: 'Backlog', color: '#6B7280', position: 0 },
      { title: 'A Fazer', color: '#3B82F6', position: 1 },
      { title: 'Em Progresso', color: '#F59E0B', position: 2 },
      { title: 'Em Revisão', color: '#8B5CF6', position: 3 },
      { title: 'Concluído', color: '#10B981', position: 4 },
    ];

    const insertedColumns = [];
    for (const col of columns) {
      const { data: column, error: colError } = await supabase
        .from('kanban_columns')
        .insert({
          project_id: project.id,
          ...col,
        })
        .select()
        .single();

      if (colError) throw colError;
      insertedColumns.push(column);
    }

    console.log(`✅ ${insertedColumns.length} colunas criadas`);

    // 5. Criar cards
    const tasks = [
      {
        column_id: insertedColumns[0].id, // Backlog
        title: 'Implementar autenticação biométrica',
        description: 'Adicionar suporte para login com impressão digital e reconhecimento facial no app mobile',
        priority: 'high',
        tags: ['mobile', 'segurança', 'autenticação'],
        assigned_to: users[1]?.id,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        position: 0,
      },
      {
        column_id: insertedColumns[1].id, // A Fazer
        title: 'Redesign da página de dashboard',
        description: 'Modernizar a interface do dashboard principal com novos gráficos e KPIs',
        priority: 'medium',
        tags: ['design', 'frontend', 'ui/ux'],
        assigned_to: users[2]?.id,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        position: 0,
      },
      {
        column_id: insertedColumns[1].id,
        title: 'Otimizar queries do banco de dados',
        description: 'Identificar e otimizar queries lentas, adicionar índices necessários',
        priority: 'high',
        tags: ['backend', 'performance', 'database'],
        assigned_to: users[3]?.id,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        position: 1,
      },
      {
        column_id: insertedColumns[2].id, // Em Progresso
        title: 'Integração com API do WhatsApp Business',
        description: 'Implementar envio e recebimento de mensagens via WhatsApp Business API',
        priority: 'high',
        tags: ['integração', 'backend', 'whatsapp'],
        assigned_to: users[1]?.id,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        position: 0,
      },
      {
        column_id: insertedColumns[2].id,
        title: 'Criar módulo de relatórios personalizados',
        description: 'Permitir que usuários criem seus próprios relatórios com filtros customizados',
        priority: 'medium',
        tags: ['frontend', 'backend', 'relatórios'],
        assigned_to: users[4]?.id,
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        position: 1,
      },
      {
        column_id: insertedColumns[3].id, // Em Revisão
        title: 'Sistema de notificações em tempo real',
        description: 'Implementar notificações push e in-app para eventos importantes',
        priority: 'medium',
        tags: ['backend', 'frontend', 'notificações'],
        assigned_to: users[2]?.id,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        position: 0,
      },
      {
        column_id: insertedColumns[4].id, // Concluído
        title: 'Migração para Next.js 14',
        description: 'Atualizar projeto de Next.js 13 para 14, aproveitar novos recursos do App Router',
        priority: 'low',
        tags: ['frontend', 'infraestrutura', 'atualização'],
        assigned_to: users[1]?.id,
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        position: 0,
      },
      {
        column_id: insertedColumns[4].id,
        title: 'Documentação da API REST',
        description: 'Criar documentação completa da API usando Swagger/OpenAPI',
        priority: 'low',
        tags: ['documentação', 'backend', 'api'],
        assigned_to: users[3]?.id,
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        position: 1,
      },
      {
        column_id: insertedColumns[0].id,
        title: 'Implementar modo escuro (dark mode)',
        description: 'Adicionar tema escuro em toda a aplicação com toggle no perfil do usuário',
        priority: 'low',
        tags: ['frontend', 'ui/ux', 'acessibilidade'],
        assigned_to: users[4]?.id,
        due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        position: 1,
      },
      {
        column_id: insertedColumns[1].id,
        title: 'Testes automatizados E2E',
        description: 'Configurar Playwright e criar suite de testes end-to-end para fluxos críticos',
        priority: 'medium',
        tags: ['testes', 'qa', 'automação'],
        assigned_to: users[2]?.id,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        position: 2,
      },
    ];

    const insertedTasks = [];
    for (const task of tasks) {
      const { data: insertedTask, error: taskError } = await supabase
        .from('kanban_tasks')
        .insert({
          ...task,
          created_by: users[0].id,
          updated_by: users[0].id,
        })
        .select()
        .single();

      if (taskError) throw taskError;
      insertedTasks.push(insertedTask);
    }

    console.log(`✅ ${insertedTasks.length} cards criados`);

    // 6. Criar comentários de exemplo
    const comments = [
      {
        task_id: insertedTasks[3].id, // WhatsApp
        user_id: users[0].id,
        comment: 'Ótimo progresso! Lembre-se de documentar os endpoints da API.',
      },
      {
        task_id: insertedTasks[3].id,
        user_id: users[1].id,
        comment: 'Já implementei o envio de mensagens de texto. Próximo passo: mídia.',
      },
      {
        task_id: insertedTasks[5].id, // Notificações
        user_id: users[2].id,
        comment: 'Pronto para revisão! Implementei notificações push e in-app.',
      },
      {
        task_id: insertedTasks[6].id, // Next.js
        user_id: users[1].id,
        comment: 'Migração concluída com sucesso! Todos os testes passando.',
      },
    ];

    const { error: commentsError } = await supabase
      .from('kanban_comments')
      .insert(comments);

    if (commentsError) throw commentsError;
    console.log(`✅ ${comments.length} comentários criados`);

    // 7. Criar histórico de movimentações
    const historyEntries = [
      {
        task_id: insertedTasks[6].id,
        user_id: users[1].id,
        action_type: 'moved',
        field_changed: 'column',
        old_value: 'Em Revisão',
        new_value: 'Concluído',
      },
      {
        task_id: insertedTasks[5].id,
        user_id: users[2].id,
        action_type: 'moved',
        field_changed: 'column',
        old_value: 'Em Progresso',
        new_value: 'Em Revisão',
      },
    ];

    const { error: historyError } = await supabase
      .from('kanban_history')
      .insert(historyEntries);

    if (historyError) throw historyError;
    console.log(`✅ ${historyEntries.length} entradas de histórico criadas`);

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log(`\n📊 Resumo:`);
    console.log(`   - 1 projeto criado`);
    console.log(`   - ${members.length} membros adicionados`);
    console.log(`   - ${insertedColumns.length} colunas criadas`);
    console.log(`   - ${insertedTasks.length} cards criados`);
    console.log(`   - ${comments.length} comentários criados`);
    console.log(`   - ${historyEntries.length} entradas de histórico`);

  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error);
    process.exit(1);
  }
}

seedKanbanDemo();
