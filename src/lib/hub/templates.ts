export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type WorkflowTransitionTaskTemplate = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  area: string;
  templateId: string;
};

function pickArea(transition: any) {
  return (transition?.to_area || transition?.from_area || 'Operacao') as string;
}

function pickPriority(triggerEvent: string) {
  const t = (triggerEvent || '').toLowerCase();
  if (t.includes('payment_failed') || t.includes('failed')) return 'urgent';
  if (t.includes('paid')) return 'high';
  if (t.includes('created')) return 'medium';
  return 'medium';
}

export function buildKanbanTaskTemplateFromWorkflowTransition(
  transition: any,
  payload: any
): WorkflowTransitionTaskTemplate {
  const trigger = String(transition?.trigger_event || '').toLowerCase();
  const from = transition?.from_area || '';
  const to = transition?.to_area || '';

  const ids = {
    client_id: payload?.client_id || payload?.clientId || null,
    proposal_id: payload?.proposal_id || null,
    contract_id: payload?.contract_id || null,
    invoice_id: payload?.invoice_id || null,
    correlation_id: payload?.correlation_id || null,
  };

  const baseHeader = [
    `Origem: ${from} → ${to}`,
    `Evento: ${transition?.trigger_event}`,
    ids.client_id ? `Cliente: ${ids.client_id}` : null,
    ids.proposal_id ? `Proposta: ${ids.proposal_id}` : null,
    ids.contract_id ? `Contrato: ${ids.contract_id}` : null,
    ids.invoice_id ? `Fatura: ${ids.invoice_id}` : null,
    ids.correlation_id ? `Correlation: ${ids.correlation_id}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const payloadJson = (() => {
    try {
      return JSON.stringify(payload || {}, null, 2);
    } catch {
      return '';
    }
  })();

  // Defaults
  let title = `${from} → ${to}: ${transition?.trigger_event}`;
  let area = pickArea(transition);
  let priority: TaskPriority = pickPriority(String(transition?.trigger_event || '')) as TaskPriority;
  let templateId = 'generic.workflow_transition';
  const status: TaskStatus = 'todo';
  let checklist: string[] = [];

  if (trigger === 'proposal.sent') {
    title = 'Revisar proposta e preparar documentação (Jurídico)';
    area = 'Jurídico';
    priority = 'high';
    templateId = 'juridico.proposal_review';
    checklist = [
      'Revisar escopo, prazos e cláusulas críticas',
      'Validar dados do cliente e CNPJ/CPF (se aplicável)',
      'Preparar minuta/termos do contrato',
      'Devolver para Contratos/Comercial com ajustes e riscos',
    ];
  } else if (trigger === 'proposal.accepted') {
    title = 'Gerar contrato e preparar assinatura (Contratos)';
    area = 'Contratos';
    priority = 'high';
    templateId = 'contratos.contract_generation';
    checklist = [
      'Gerar contrato a partir da proposta aceita',
      'Conferir valores, datas, vencimento e escopo',
      'Enviar para assinatura (DocuSign/Clicksign/etc.)',
      'Atualizar status e anexos no sistema',
    ];
  } else if (trigger === 'contract.created') {
    title = 'Configurar cobrança inicial e acompanhar pagamento (Financeiro)';
    area = 'Financeiro';
    priority = 'medium';
    templateId = 'financeiro.invoice_setup';
    checklist = [
      'Confirmar contrato ativo e dados de cobrança',
      'Validar fatura gerada / método de pagamento',
      'Enviar comunicação de cobrança ao cliente (se necessário)',
      'Registrar pendência/risco (se houver)',
    ];
  } else if (trigger === 'invoice.created') {
    title = 'Iniciar onboarding operacional (Operação)';
    area = 'Operacao';
    priority = 'high';
    templateId = 'operacao.onboarding_start';
    checklist = [
      'Agendar kickoff com cliente',
      'Coletar acessos e briefing',
      'Conectar integrações (Google/Meta/Pixel/WhatsApp)',
      'Criar plano inicial e responsabilidades',
    ];
  } else if (trigger === 'invoice.paid') {
    title = 'Pagamento confirmado — iniciar execução (Operação)';
    area = 'Operacao';
    priority = 'high';
    templateId = 'operacao.payment_confirmed';
    checklist = ['Confirmar liberação de execução (pagamento OK)', 'Priorizar setup e kickoff', 'Registrar início de operação e próximos marcos'];
  } else if (trigger === 'invoice.payment_failed') {
    title = 'Falha no pagamento — acionar Financeiro/Comercial';
    area = 'Financeiro';
    priority = 'urgent';
    templateId = 'financeiro.payment_failed';
    checklist = ['Verificar motivo da falha no Stripe', 'Contatar cliente e oferecer alternativa', 'Atualizar status e próximos passos'];
  } else if (trigger === 'notifications.required') {
    title = 'Disparar notificações e registrar confirmação (Notificações)';
    area = 'Notificacoes';
    priority = 'medium';
    templateId = 'notificacoes.dispatch_required';
    checklist = [
      'Confirmar público-alvo (cliente / time interno) e canal (in-app / email / WhatsApp)',
      'Enviar mensagem padrão com link e IDs (cliente/proposta/contrato/fatura)',
      'Registrar evidência e horário do envio',
    ];
  }

  const checklistBlock = checklist.length ? `\n\nChecklist:\n${checklist.map((c) => `- [ ] ${c}`).join('\n')}` : '';

  const description = `${baseHeader}` + checklistBlock + `\n\nPayload:\n${payloadJson}`;

  return { title, description, status, priority, area, templateId };
}


