import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { createKanbanTaskFromHub, getOrCreateSuperAdminBoardId } from '@/lib/kanban/hub';

export const dynamic = 'force-dynamic';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

function getPriorityFromRisk(riskLevel: string): Priority {
  switch (riskLevel?.toLowerCase()) {
    case 'critical':
      return 'urgent';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    default:
      return 'low';
  }
}

/**
 * POST /api/admin/predictions/actions/create
 * Cria uma tarefa no Kanban para ações de retenção de cliente
 * body: { client_id, prediction_id, selected_actions[], risk_level, churn_probability, etc. }
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const admin = getSupabaseAdmin();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const {
    client_id,
    prediction_id,
    selected_actions = [],
    risk_level,
    churn_probability,
    days_until_churn,
    company_name,
    monthly_value,
  } = body;

  // Validações
  if (!client_id) {
    return NextResponse.json({ error: 'client_id é obrigatório' }, { status: 400 });
  }

  if (!selected_actions || selected_actions.length === 0) {
    return NextResponse.json({ error: 'Selecione pelo menos uma ação' }, { status: 400 });
  }

  try {
    // Verificar se o cliente existe
    const { data: client, error: clientError } = await admin
      .from('clients')
      .select('id, company_name, contact_name, contact_email, monthly_value')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Idempotência: verificar se já existe uma tarefa recente para este cliente
    const { data: existingTask } = await admin
      .from('kanban_tasks')
      .select('id, board_id')
      .eq('reference_links->>source', 'churn_prediction')
      .eq('reference_links->>client_id', client_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // últimas 24h
      .limit(1)
      .maybeSingle();

    if (existingTask?.id && existingTask?.board_id) {
      return NextResponse.json({
        success: true,
        already_executed: true,
        task_id: existingTask.id,
        board_id: existingTask.board_id,
        kanban_url: `/admin/meu-kanban?boardId=${encodeURIComponent(String(existingTask.board_id))}&taskId=${encodeURIComponent(String(existingTask.id))}`,
      });
    }

    // Obter ou criar board do super admin
    const boardId = await getOrCreateSuperAdminBoardId(admin as any, gate.userId);

    // Construir título e descrição da tarefa
    const taskTitle = `🚨 Retenção: ${company_name || client.company_name || 'Cliente'}`;
    
    const riskEmoji = risk_level === 'critical' ? '🔴' : risk_level === 'high' ? '🟠' : '🟡';
    
    const descriptionParts = [
      `${riskEmoji} **AÇÃO DE RETENÇÃO DE CLIENTE**`,
      '',
      `**Cliente:** ${company_name || client.company_name}`,
      `**Probabilidade de Churn:** ${churn_probability || 0}%`,
      `**Dias até Churn Estimado:** ${days_until_churn || 'N/A'}`,
      `**Valor Mensal em Risco:** R$ ${(monthly_value || client.monthly_value || 0).toLocaleString('pt-BR')}`,
      `**Nível de Risco:** ${risk_level?.toUpperCase() || 'N/A'}`,
      '',
      '---',
      '',
      '**📋 AÇÕES A EXECUTAR:**',
      '',
      ...selected_actions.map((action: string, idx: number) => `${idx + 1}. ${action}`),
      '',
      '---',
      '',
      `**Contato:**`,
      `- Nome: ${client.contact_name || 'N/A'}`,
      `- Email: ${client.contact_email || 'N/A'}`,
      '',
      `**⏰ Prazo:** ${days_until_churn ? `${days_until_churn} dias` : 'Urgente'}`,
      '',
      `Criado automaticamente pelo sistema de predição de churn.`,
      `Criado por: ${gate.userId}`,
      `Criado em: ${new Date().toLocaleString('pt-BR')}`,
    ];

    const description = descriptionParts.join('\n');

    // Determinar prioridade baseada no risco
    const priority = getPriorityFromRisk(risk_level);

    // Criar tarefa no Kanban
    const task = await createKanbanTaskFromHub(admin as any, {
      boardId,
      clientId: client_id,
      title: taskTitle,
      description,
      status: 'todo',
      priority,
      area: 'admin',
      createdBy: gate.userId,
      referenceLinks: {
        source: 'churn_prediction',
        client_id,
        prediction_id: prediction_id || null,
        risk_level,
        churn_probability,
        created_via: 'churn_action_modal',
      },
    });

    // Se houver prediction_id, atualizar status da predição (opcional)
    if (prediction_id) {
      try {
        const { error: updateError } = await admin
          .from('client_churn_predictions')
          .update({
            intervention_status: 'in_progress',
            intervention_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', prediction_id);
        
        if (updateError) {
          console.warn('⚠️ Failed to update prediction status:', updateError);
        } else {
          console.log('✅ Prediction updated with intervention status');
        }
      } catch (err) {
        console.warn('⚠️ Failed to update prediction status:', err);
      }
    }

    return NextResponse.json({
      success: true,
      already_executed: false,
      task_id: task.id,
      board_id: task.board_id,
      kanban_url: `/admin/meu-kanban?boardId=${encodeURIComponent(String(task.board_id))}&taskId=${encodeURIComponent(String(task.id))}`,
      task,
    });
  } catch (e: any) {
    console.error('Error creating retention task:', e);
    return NextResponse.json({ error: e?.message || 'Erro ao criar tarefa' }, { status: 500 });
  }
}
