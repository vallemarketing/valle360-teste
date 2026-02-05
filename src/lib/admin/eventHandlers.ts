import { getSupabaseAdmin } from './supabaseAdmin';
import type { DomainEventRow } from './eventBus';
import { goalEngine } from '@/lib/goals/goal-engine';
import { notifyAdmins as notifyAdminUsers } from '@/lib/admin/notifyAdmins';
import { notifyAreaUsers } from '@/lib/admin/notifyArea';

type HandlerResult = { ok: true } | { ok: false; error: string };

function mapAreaToSector(area?: string | null): string {
  const a = (area || '').toLowerCase();
  if (a.includes('social')) return 'social_media';
  if (a.includes('tráfego') || a.includes('trafego')) return 'trafego';
  if (a.includes('video') || a.includes('vídeo')) return 'video_maker';
  if (a.includes('comercial') || a.includes('vendas')) return 'comercial';
  if (a.includes('rh') || a.includes('people')) return 'rh';
  if (a.includes('web')) return 'designer';
  if (a.includes('design')) return 'designer';
  return 'designer';
}

async function insertWorkflowTransition(params: {
  fromArea: string;
  toArea: string;
  triggerEvent: string;
  payload?: Record<string, unknown>;
  createdBy?: string | null;
  sourceEventId?: string | null;
  correlationId?: string | null;
}): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const enrichedPayload = {
    ...(params.payload || {}),
    source_event_id: params.sourceEventId || null,
    correlation_id: params.correlationId || null,
  };

  // Idempotência: evita duplicar transições caso o mesmo evento seja processado mais de uma vez.
  if (params.sourceEventId) {
    const { data: existing } = await supabase
      .from('workflow_transitions')
      .select('id')
      .eq('from_area', params.fromArea)
      .eq('to_area', params.toArea)
      .eq('trigger_event', params.triggerEvent)
      .eq('data_payload->>source_event_id', String(params.sourceEventId))
      .limit(1)
      .maybeSingle();

    if (existing?.id) return String(existing.id);
  }

  const { data: inserted } = await supabase
    .from('workflow_transitions')
    .insert({
    from_area: params.fromArea,
    to_area: params.toArea,
    status: 'pending',
    trigger_event: params.triggerEvent,
    data_payload: enrichedPayload,
    created_by: params.createdBy || null,
    })
    .select('id')
    .single();

  const transitionId = inserted?.id ? String(inserted.id) : null;

  // Conectar a "área de colaboradores": avisar quem atua na área de destino.
  // Link: envia para o Kanban do colaborador (onde ele executa trabalho), mantendo rastreabilidade via metadata.
  try {
    await notifyAreaUsers({
      area: params.toArea,
      title: `Nova demanda (${params.toArea})`,
      message: `Há uma nova transição pendente para a sua área. Evento: ${params.triggerEvent}.`,
      link: '/colaborador/kanban',
      metadata: {
        workflow_transition_id: transitionId,
        trigger_event: params.triggerEvent,
        from_area: params.fromArea,
        to_area: params.toArea,
        correlation_id: params.correlationId || null,
        source_event_id: params.sourceEventId || null,
      },
      type: 'workflow',
    });
  } catch {
    // best-effort
  }

  return transitionId;
}

async function notifyAdmins(
  title: string,
  message: string,
  payload?: Record<string, unknown>,
  link?: string | null
) {
  const supabase = getSupabaseAdmin();
  await notifyAdminUsers(supabase as any, {
    title,
    message,
    type: 'system',
    is_read: false,
    link: link ?? null,
    metadata: payload || {},
  });
}

function hubLinkFor(params: { tab?: 'events' | 'transitions'; status?: string; q?: string }) {
  const usp = new URLSearchParams();
  if (params.tab) usp.set('tab', params.tab);
  if (params.status) usp.set('status', params.status);
  if (params.q) usp.set('q', params.q);
  const qs = usp.toString();
  return `/admin/fluxos${qs ? `?${qs}` : ''}`;
}

async function ensureClientFromProposal(clientName: string, clientEmail: string) {
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .or(`email.eq.${clientEmail},contact_email.eq.${clientEmail}`)
    .limit(1);

  if (existing && existing.length > 0) return existing[0].id as string;

  const { data: inserted, error } = await supabase
    .from('clients')
    .insert({
      company_name: clientName,
      contact_name: clientName,
      contact_email: clientEmail,
      email: clientEmail, // compat
      status: 'active',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return inserted.id as string;
}

async function createDefaultOnboardingKanban(clientId: string, createdBy?: string | null) {
  const supabase = getSupabaseAdmin();

  const { data: board, error: boardError } = await supabase
    .from('kanban_boards')
    .insert({
      name: 'Onboarding',
      description: 'Fluxo inicial automático',
      client_id: clientId,
      is_active: true,
      created_by: createdBy || null,
    })
    .select('id')
    .single();

  if (boardError) throw boardError;

  const columns = [
    { name: 'Backlog', position: 1, color: '#64748b' },
    { name: 'A Fazer', position: 2, color: '#3b82f6' },
    { name: 'Em Progresso', position: 3, color: '#f59e0b' },
    { name: 'Concluído', position: 4, color: '#22c55e' },
  ];

  const { data: insertedColumns, error: colErr } = await supabase
    .from('kanban_columns')
    .insert(columns.map((c) => ({ ...c, board_id: board.id })))
    .select('id, position');

  if (colErr) throw colErr;

  const firstCol = (insertedColumns || []).slice().sort((a: any, b: any) => a.position - b.position)[0];
  if (!firstCol) return;

  const tasks = [
    { title: 'Reunião de kickoff', description: 'Agendar kickoff com o cliente', priority: 'high' },
    { title: 'Conectar integrações', description: 'Google/Meta/WhatsApp/Pixel etc.', priority: 'high' },
    { title: 'Coletar acessos e briefing', description: 'Documentos, contas, ativos', priority: 'medium' },
  ];

  await supabase.from('kanban_tasks').insert(
    tasks.map((t, idx) => ({
      board_id: board.id,
      column_id: firstCol.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      position: idx + 1,
      client_id: clientId,
      status: 'todo',
      created_by: createdBy || null,
    }))
  );

  return board.id as string;
}

async function getOrCreateOnboardingBoardId(clientId: string, createdBy?: string | null) {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from('kanban_boards')
    .select('id')
    .eq('client_id', clientId)
    .eq('name', 'Onboarding')
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id as string;
  return await createDefaultOnboardingKanban(clientId, createdBy);
}

function mapStatusToOnboardingColumnName(status: string) {
  switch (status) {
    case 'backlog':
      return 'Backlog';
    case 'in_progress':
      return 'Em Progresso';
    case 'done':
      return 'Concluído';
    case 'in_review':
      return 'Em Progresso';
    case 'todo':
    default:
      return 'A Fazer';
  }
}

async function addOnboardingKanbanTask(params: {
  clientId: string;
  title: string;
  description?: string;
  status?: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  area?: string | null;
  createdBy?: string | null;
  referenceLinks?: any;
}) {
  const supabase = getSupabaseAdmin();
  const boardId = await getOrCreateOnboardingBoardId(params.clientId, params.createdBy);
  const status = params.status || 'todo';
  const priority = params.priority || 'medium';
  const desiredColumnName = mapStatusToOnboardingColumnName(status);

  const { data: col } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('board_id', boardId)
    .eq('name', desiredColumnName)
    .limit(1)
    .maybeSingle();

  // fallback: primeira coluna
  const columnId = col?.id
    ? (col.id as string)
    : (
        (
          await supabase
            .from('kanban_columns')
            .select('id')
            .eq('board_id', boardId)
            .order('position', { ascending: true })
            .limit(1)
            .maybeSingle()
        ).data?.id as string | undefined
      );

  if (!columnId) return;

  const { data: last } = await supabase
    .from('kanban_tasks')
    .select('position')
    .eq('board_id', boardId)
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = Number(last?.position || 0) + 1;

  await supabase.from('kanban_tasks').insert({
    board_id: boardId,
    column_id: columnId,
    title: params.title,
    description: params.description || null,
    priority,
    status,
    position,
    client_id: params.clientId,
    area: params.area || 'Operacao',
    created_by: params.createdBy || null,
    reference_links: params.referenceLinks || null,
  });
}

export async function handleEvent(event: DomainEventRow): Promise<HandlerResult> {
  try {
    switch (event.event_type) {
      case 'client.created': {
        await insertWorkflowTransition({
          fromArea: 'Admin',
          toArea: 'Operacao',
          triggerEvent: 'client.created',
          payload: event.payload,
          createdBy: event.actor_user_id,
          sourceEventId: event.id,
          correlationId: event.correlation_id,
        });
        if (event.entity_id) {
          await getOrCreateOnboardingBoardId(event.entity_id, event.actor_user_id);
        }
        await notifyAdmins(
          'Novo cliente cadastrado',
          'Cliente criado e onboarding iniciado.',
          {
          client_id: event.entity_id,
          correlation_id: event.correlation_id,
          },
          hubLinkFor({ tab: 'transitions', status: 'pending', q: event.entity_id || event.correlation_id || 'client.created' })
        );
        return { ok: true };
      }

      case 'employee.created': {
        await insertWorkflowTransition({
          fromArea: 'Admin',
          toArea: 'RH',
          triggerEvent: 'employee.created',
          payload: event.payload,
          createdBy: event.actor_user_id,
          sourceEventId: event.id,
          correlationId: event.correlation_id,
        });

        // Auto: gerar primeira meta mensal para o colaborador (para o sistema já começar “rodando”)
        try {
          const supabase = getSupabaseAdmin();
          const employeeId = event.entity_id;
          const { data: emp } = await supabase
            .from('employees')
            .select('user_id, full_name, department, areas')
            .eq('id', employeeId)
            .single();

          const userId = emp?.user_id as string | undefined;
          if (userId) {
            const firstArea = Array.isArray(emp?.areas) ? emp.areas[0] : emp?.department;
            const sector = mapAreaToSector(firstArea);
            await goalEngine.createGoal(userId, emp?.full_name || 'Colaborador', sector as any, 'monthly');
          }
        } catch {
          // best-effort: não bloquear fluxo
        }

        await notifyAdmins(
          'Novo colaborador cadastrado',
          'Colaborador criado e pronto para receber metas/fluxos.',
          {
          employee_id: event.entity_id,
          correlation_id: event.correlation_id,
          },
          hubLinkFor({ tab: 'transitions', status: 'pending', q: event.entity_id || event.correlation_id || 'employee.created' })
        );
        return { ok: true };
      }

      case 'proposal.sent': {
        await insertWorkflowTransition({
          fromArea: 'Comercial',
          toArea: 'Jurídico',
          triggerEvent: 'proposal.sent',
          payload: { ...(event.payload || {}), proposal_id: event.entity_id },
          createdBy: event.actor_user_id,
          sourceEventId: event.id,
          correlationId: event.correlation_id,
        });
        await notifyAdmins(
          'Proposta enviada',
          'Proposta enviada ao cliente. Aguardando aceite.',
          {
          proposal_id: event.entity_id,
          correlation_id: event.correlation_id,
          },
          hubLinkFor({ tab: 'transitions', status: 'pending', q: event.entity_id || event.correlation_id || 'proposal.sent' })
        );
        return { ok: true };
      }

      case 'proposal.rejected': {
        await insertWorkflowTransition({
          fromArea: 'Comercial',
          toArea: 'Comercial',
          triggerEvent: 'proposal.rejected',
          payload: { ...(event.payload || {}), proposal_id: event.entity_id },
          createdBy: event.actor_user_id,
          sourceEventId: event.id,
          correlationId: event.correlation_id,
        });
        await notifyAdmins(
          'Proposta rejeitada',
          'O cliente rejeitou a proposta. Revisar abordagem e condições.',
          {
          proposal_id: event.entity_id,
          correlation_id: event.correlation_id,
          ...(event.payload || {}),
          },
          hubLinkFor({ tab: 'transitions', status: 'pending', q: event.entity_id || event.correlation_id || 'proposal.rejected' })
        );
        return { ok: true };
      }

      case 'proposal.accepted': {
        // Comercial -> Jurídico -> Contratos -> Financeiro -> Operacao
        const proposalId = event.entity_id;

        // Se existir transição "proposal.sent" pendente para essa proposta, marcar como concluída (cadeia visível no Hub)
        if (proposalId) {
          await getSupabaseAdmin()
            .from('workflow_transitions')
            .update({ status: 'completed', completed_at: new Date().toISOString(), error_message: null })
            .eq('trigger_event', 'proposal.sent')
            .eq('status', 'pending')
            .eq('data_payload->>proposal_id', String(proposalId));
        }

        // Próximo passo explícito: Jurídico -> Contratos
        await insertWorkflowTransition({
          fromArea: 'Jurídico',
          toArea: 'Contratos',
          triggerEvent: 'proposal.accepted',
          payload: { ...(event.payload || {}), proposal_id: proposalId },
          createdBy: event.actor_user_id,
          sourceEventId: event.id,
          correlationId: event.correlation_id,
        });

        const supabase = getSupabaseAdmin();
        if (proposalId) {
          const { data: proposal } = await supabase
            .from('proposals')
            .select('id, client_name, client_email, total_value, status')
            .eq('id', proposalId)
            .single();

          if (proposal?.client_email) {
            const clientId = await ensureClientFromProposal(proposal.client_name || proposal.client_email, proposal.client_email);
            // garantir onboarding (idempotente)
            await getOrCreateOnboardingBoardId(clientId, event.actor_user_id);
            // Criar contrato básico (idempotente por proposal_id)
            const { data: existingContract } = await supabase
              .from('contracts')
              .select('id, client_id, monthly_value, due_day, start_date')
              .eq('proposal_id', proposalId)
              .limit(1)
              .maybeSingle();

            const contract =
              existingContract?.id
                ? existingContract
                : (
                    await supabase
                      .from('contracts')
                      .insert({
                        client_id: clientId,
                        proposal_id: proposalId,
                        status: 'active',
                        active: true,
                        start_date: new Date().toISOString().slice(0, 10),
                        end_date: null,
                        monthly_value: proposal.total_value || 0,
                        due_day: 5,
                        created_at: new Date().toISOString(),
                      })
                      .select('id, client_id, monthly_value, due_day, start_date')
                      .single()
                  ).data;

            if (!contract?.id) throw new Error('Falha ao obter/criar contrato');

            // Criar fatura inicial (Financeiro)
            const today = new Date();
            const issueDate = today.toISOString().slice(0, 10);
            const dueDay = Number(contract?.due_day || 5);
            const dueDateObj = new Date(today.getFullYear(), today.getMonth(), dueDay);
            const dueDate = dueDateObj.toISOString().slice(0, 10);

            // Fatura idempotente (por contract_id + issue_date)
            const { data: existingInvoice } = await supabase
              .from('invoices')
              .select('id, invoice_number')
              .eq('contract_id', contract.id)
              .eq('issue_date', issueDate)
              .limit(1)
              .maybeSingle();

            const invoiceNumber =
              existingInvoice?.invoice_number ||
              `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-${String(
                Math.floor(Math.random() * 9000) + 1000
              )}`;

            const invoice =
              existingInvoice?.id
                ? existingInvoice
                : (
                    await supabase
                      .from('invoices')
                      .insert({
                        contract_id: contract.id,
                        client_id: contract.client_id,
                        invoice_number: invoiceNumber,
                        amount: contract.monthly_value || 0,
                        issue_date: issueDate,
                        due_date: dueDate,
                        status: 'pending',
                        notes: 'Fatura inicial gerada automaticamente a partir do aceite da proposta.',
                        created_at: new Date().toISOString(),
                      })
                      .select('id, invoice_number')
                      .single()
                  ).data;

            if (!invoice?.id) throw new Error('Falha ao obter/criar fatura');

            // Registrar transação prevista
            const { data: existingTx } = await supabase
              .from('financial_transactions')
              .select('id')
              .eq('invoice_id', invoice.id)
              .limit(1)
              .maybeSingle();

            if (!existingTx?.id) {
              await supabase.from('financial_transactions').insert({
                transaction_type: 'income',
                category: 'subscription',
                amount: contract.monthly_value || 0,
                description: 'Receita prevista - contrato ativo',
                transaction_date: issueDate,
                invoice_id: invoice.id,
                client_id: contract.client_id,
                payment_method: null,
                reference_number: invoiceNumber,
                status: 'pending',
                created_by: event.actor_user_id,
                created_at: new Date().toISOString(),
              });
            }

            // Workflow: Contratos -> Financeiro -> Operacao
            await insertWorkflowTransition({
              fromArea: 'Contratos',
              toArea: 'Financeiro',
              triggerEvent: 'contract.created',
              payload: { proposal_id: proposalId, contract_id: contract.id, invoice_id: invoice.id, client_id: contract.client_id },
              createdBy: event.actor_user_id,
              sourceEventId: event.id,
              correlationId: event.correlation_id,
            });
            await insertWorkflowTransition({
              fromArea: 'Financeiro',
              toArea: 'Operacao',
              triggerEvent: 'invoice.created',
              payload: { proposal_id: proposalId, contract_id: contract.id, invoice_id: invoice.id, client_id: contract.client_id },
              createdBy: event.actor_user_id,
              sourceEventId: event.id,
              correlationId: event.correlation_id,
            });
            // Passo de Notificações (rastreamento no Hub): avisos ao time/cliente com links e IDs
            await insertWorkflowTransition({
              fromArea: 'Operacao',
              toArea: 'Notificacoes',
              triggerEvent: 'notifications.required',
              payload: { proposal_id: proposalId, contract_id: contract.id, invoice_id: invoice.id, client_id: contract.client_id },
              createdBy: event.actor_user_id,
              sourceEventId: event.id,
              correlationId: event.correlation_id,
            });
          }
        }

        await notifyAdmins(
          'Proposta aceita',
          'Aceite confirmado. Próximo passo: Jurídico → Contratos (e geração automática de contrato/fatura quando possível).',
          {
            proposal_id: proposalId,
            correlation_id: event.correlation_id,
          },
          hubLinkFor({ tab: 'transitions', status: 'pending', q: proposalId || event.correlation_id || 'proposal.accepted' })
        );
        return { ok: true };
      }

      case 'invoice.paid': {
        const supabase = getSupabaseAdmin();
        const invoiceId = event.entity_id;
        const payload = (event.payload || {}) as Record<string, any>;

        if (invoiceId) {
          await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', invoiceId);

          await supabase
            .from('financial_transactions')
            .update({
              status: 'completed',
              payment_method: payload.payment_method || payload.collection_method || null,
              reference_number: payload.stripe_invoice_id || payload.invoice_number || null,
              updated_at: new Date().toISOString(),
            })
            .eq('invoice_id', invoiceId);
        }

        await insertWorkflowTransition({
          fromArea: 'Financeiro',
          toArea: 'Operacao',
          triggerEvent: 'invoice.paid',
          payload,
          createdBy: event.actor_user_id,
          sourceEventId: event.id,
          correlationId: event.correlation_id,
        });
        await insertWorkflowTransition({
          fromArea: 'Operacao',
          toArea: 'Notificacoes',
          triggerEvent: 'notifications.required',
          payload,
          createdBy: event.actor_user_id,
          sourceEventId: event.id,
          correlationId: event.correlation_id,
        });

        await notifyAdmins(
          'Fatura paga (Stripe)',
          'Pagamento confirmado. Fluxo enviado para Operação.',
          {
          invoice_id: invoiceId,
          client_id: payload.client_id,
          stripe_invoice_id: payload.stripe_invoice_id,
          correlation_id: event.correlation_id,
          },
          hubLinkFor({ tab: 'transitions', status: 'pending', q: invoiceId || String(payload.stripe_invoice_id || '') || event.correlation_id || 'invoice.paid' })
        );

        if (payload.client_id) {
          await addOnboardingKanbanTask({
            clientId: payload.client_id,
            title: 'Pagamento confirmado — iniciar operação',
            description:
              'Stripe confirmou o pagamento. Iniciar onboarding operacional (integrações, kickoff, setup de campanhas).',
            status: 'todo',
            priority: 'high',
            area: 'Operacao',
            referenceLinks: {
              type: 'stripe',
              stripe_invoice_id: payload.stripe_invoice_id,
              invoice_id: invoiceId,
              amount: payload.amount,
              currency: payload.currency,
            },
            createdBy: event.actor_user_id,
          });
        }

        return { ok: true };
      }

      case 'invoice.payment_failed': {
        const supabase = getSupabaseAdmin();
        const invoiceId = event.entity_id;
        const payload = (event.payload || {}) as Record<string, any>;

        if (invoiceId) {
          await supabase
            .from('invoices')
            .update({
              status: 'payment_failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', invoiceId);

          await supabase
            .from('financial_transactions')
            .update({
              status: 'failed',
              reference_number: payload.stripe_invoice_id || payload.invoice_number || null,
              updated_at: new Date().toISOString(),
            })
            .eq('invoice_id', invoiceId);
        }

        await insertWorkflowTransition({
          fromArea: 'Financeiro',
          toArea: 'Comercial',
          triggerEvent: 'invoice.payment_failed',
          payload,
          createdBy: event.actor_user_id,
          sourceEventId: event.id,
          correlationId: event.correlation_id,
        });
        await insertWorkflowTransition({
          fromArea: 'Comercial',
          toArea: 'Notificacoes',
          triggerEvent: 'notifications.required',
          payload,
          createdBy: event.actor_user_id,
          sourceEventId: event.id,
          correlationId: event.correlation_id,
        });

        await notifyAdmins(
          'Falha de pagamento (Stripe)',
          'Pagamento falhou. Ação necessária do Financeiro/Comercial.',
          {
          invoice_id: invoiceId,
          client_id: payload.client_id,
          stripe_invoice_id: payload.stripe_invoice_id,
          correlation_id: event.correlation_id,
          },
          hubLinkFor({
            tab: 'transitions',
            status: 'pending',
            q: invoiceId || String(payload.stripe_invoice_id || '') || event.correlation_id || 'invoice.payment_failed',
          })
        );

        if (payload.client_id) {
          await addOnboardingKanbanTask({
            clientId: payload.client_id,
            title: 'Falha no pagamento — acionar Financeiro/Comercial',
            description:
              'Stripe informou falha no pagamento. Verificar motivo, contatar cliente e definir próximo passo.',
            status: 'todo',
            priority: 'urgent',
            area: 'Financeiro',
            referenceLinks: {
              type: 'stripe',
              stripe_invoice_id: payload.stripe_invoice_id,
              invoice_id: invoiceId,
              amount: payload.amount,
              currency: payload.currency,
            },
            createdBy: event.actor_user_id,
          });
        }

        return { ok: true };
      }

      case 'contract.signed': {
        // Contract has been digitally signed - activate and start production
        const supabase = getSupabaseAdmin();
        const contractId = event.entity_id;
        const payload = (event.payload || {}) as Record<string, any>;

        if (!contractId) {
          return { ok: false, error: 'Missing contract_id' };
        }

        // 1. Activate contract
        await supabase
          .from('contracts')
          .update({
            status: 'active',
            active: true,
            activated_at: new Date().toISOString(),
            signed_at: payload.signed_at || new Date().toISOString(),
            signed_by: payload.signed_by || null,
            signature_ip: payload.signature_ip || null,
          })
          .eq('id', contractId);

        // 2. Get contract details
        const { data: contract } = await supabase
          .from('contracts')
          .select('*, clients(id, company_name, email, contact_name)')
          .eq('id', contractId)
          .single();

        if (!contract) {
          return { ok: false, error: 'Contract not found' };
        }

        const clientId = contract.client_id;
        const monthlyValue = contract.monthly_value || contract.total_value / (contract.duration_months || 12) || 0;

        // 3. Create/update first invoice
        const today = new Date();
        const dueDay = Number(contract.due_day || 10);
        const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
        if (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        await supabase
          .from('invoices')
          .insert({
            contract_id: contractId,
            client_id: clientId,
            amount: monthlyValue,
            due_date: dueDate.toISOString(),
            issue_date: today.toISOString(),
            status: 'pending',
            description: 'Primeira mensalidade',
            notes: 'Gerada automaticamente após assinatura do contrato.',
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        // 4. Schedule recurring invoices
        const endDate = contract.end_date ? new Date(contract.end_date) : null;
        const nextRun = new Date(dueDate);
        nextRun.setMonth(nextRun.getMonth() + 1);

        await supabase.from('recurring_invoice_schedules').insert({
          contract_id: contractId,
          client_id: clientId,
          amount: monthlyValue,
          frequency: 'monthly',
          day_of_month: dueDay,
          next_run: nextRun.toISOString(),
          end_date: endDate?.toISOString() || null,
          is_active: true,
          created_at: new Date().toISOString(),
        });

        // 5. Create production tasks from contract services
        const services = contract.services || [];
        for (const service of services) {
          const serviceName = typeof service === 'string' ? service : service.name;
          const area = mapServiceToArea(serviceName);

          await addOnboardingKanbanTask({
            clientId,
            title: `[NOVO] ${serviceName} - ${contract.clients?.company_name || 'Cliente'}`,
            description: `Iniciar produção do serviço conforme contrato assinado.\n\nCliente: ${contract.clients?.company_name}\nContrato ID: ${contractId}`,
            status: 'todo',
            priority: 'high',
            area,
            createdBy: event.actor_user_id,
            referenceLinks: {
              type: 'contract',
              contract_id: contractId,
              service_name: serviceName,
            },
          });
        }

        // 6. Workflow transitions
        await insertWorkflowTransition({
          fromArea: 'Jurídico',
          toArea: 'Financeiro',
          triggerEvent: 'contract.signed',
          payload: { contract_id: contractId, client_id: clientId },
          createdBy: event.actor_user_id,
          sourceEventId: event.id,
          correlationId: event.correlation_id,
        });

        await insertWorkflowTransition({
          fromArea: 'Jurídico',
          toArea: 'Operacao',
          triggerEvent: 'contract.signed',
          payload: { contract_id: contractId, client_id: clientId, services },
          createdBy: event.actor_user_id,
          sourceEventId: event.id,
          correlationId: event.correlation_id,
        });

        // 7. Notify team
        await notifyAdmins(
          'Contrato Assinado',
          `Contrato de ${contract.clients?.company_name || 'cliente'} foi assinado digitalmente. Produção iniciada.`,
          {
            contract_id: contractId,
            client_id: clientId,
            signed_by: payload.signed_by,
            correlation_id: event.correlation_id,
          },
          hubLinkFor({ tab: 'transitions', status: 'pending', q: contractId || event.correlation_id || 'contract.signed' })
        );

        return { ok: true };
      }

      default:
        return { ok: true };
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Falha ao processar evento' };
  }
}

// Helper to map service names to areas
function mapServiceToArea(serviceName: string): string {
  const name = serviceName.toLowerCase();
  if (name.includes('social') || name.includes('redes')) return 'Social Media';
  if (name.includes('tráfego') || name.includes('trafego') || name.includes('ads')) return 'Tráfego';
  if (name.includes('design') || name.includes('visual')) return 'Design';
  if (name.includes('video') || name.includes('vídeo')) return 'Video';
  if (name.includes('web') || name.includes('site') || name.includes('desenvolvimento')) return 'Desenvolvimento';
  if (name.includes('seo')) return 'SEO';
  if (name.includes('conteúdo') || name.includes('conteudo')) return 'Conteúdo';
  return 'Operacao';
}


