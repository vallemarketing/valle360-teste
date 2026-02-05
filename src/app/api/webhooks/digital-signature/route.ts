import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Webhook for Digital Signature Platforms
 * Supports: DocuSign, ClickSign, Autentique
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = request.headers.get('x-signature-provider') || detectProvider(body);

    console.log(`[WEBHOOK] Digital signature event from ${provider}:`, body);

    let eventData: {
      eventType: string;
      contractId: string;
      signedBy?: string;
      signedAt?: string;
      signatureIp?: string;
      documentUrl?: string;
    } | null = null;

    // Parse event based on provider
    switch (provider) {
      case 'docusign':
        eventData = parseDocuSignEvent(body);
        break;
      case 'clicksign':
        eventData = parseClickSignEvent(body);
        break;
      case 'autentique':
        eventData = parseAutentiqueEvent(body);
        break;
      case 'internal':
        eventData = parseInternalEvent(body);
        break;
      default:
        console.warn('Unknown signature provider:', provider);
        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    if (!eventData) {
      return NextResponse.json({ error: 'Could not parse event' }, { status: 400 });
    }

    // Handle the event
    if (eventData.eventType === 'completed' || eventData.eventType === 'signed') {
      await handleContractSigned(eventData);
    } else if (eventData.eventType === 'declined' || eventData.eventType === 'voided') {
      await handleContractDeclined(eventData);
    } else if (eventData.eventType === 'viewed') {
      await handleContractViewed(eventData);
    }

    // Log the webhook (best-effort)
    try {
      await supabase.from('webhook_logs').insert({
        provider,
        event_type: eventData.eventType,
        contract_id: eventData.contractId,
        payload: body,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Best effort logging
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Detect provider from payload
function detectProvider(body: any): string {
  if (body.event && body.apiVersion) return 'docusign';
  if (body.document && body.document.key) return 'clicksign';
  if (body.document_token) return 'autentique';
  if (body.internal_event) return 'internal';
  return 'unknown';
}

// Parse DocuSign event
function parseDocuSignEvent(body: any) {
  const envelopeStatus = body.envelopeSummary?.status;
  const contractId = body.envelopeSummary?.customFields?.textCustomFields?.find(
    (f: any) => f.name === 'contractId'
  )?.value;

  return {
    eventType: envelopeStatus === 'completed' ? 'completed' : envelopeStatus,
    contractId,
    signedBy: body.envelopeSummary?.recipients?.signers?.[0]?.email,
    signedAt: body.envelopeSummary?.completedDateTime,
    documentUrl: body.envelopeSummary?.documentsCombinedUri,
  };
}

// Parse ClickSign event
function parseClickSignEvent(body: any) {
  const event = body.event?.name;
  const contractId = body.document?.external_id;

  return {
    eventType: event === 'close' ? 'completed' : event,
    contractId,
    signedBy: body.signer?.email,
    signedAt: body.event?.occurred_at,
    documentUrl: body.document?.downloads?.original_file_url,
  };
}

// Parse Autentique event
function parseAutentiqueEvent(body: any) {
  const status = body.status;
  const contractId = body.metadata?.contract_id;

  return {
    eventType: status === 'signed' ? 'completed' : status,
    contractId,
    signedBy: body.signatories?.[0]?.email,
    signedAt: body.signed_at,
    documentUrl: body.file_url,
  };
}

// Parse internal magic link event
function parseInternalEvent(body: any) {
  return {
    eventType: body.event_type,
    contractId: body.contract_id,
    signedBy: body.signed_by,
    signedAt: body.signed_at,
    signatureIp: body.signature_ip,
    documentUrl: undefined,
  };
}

// Handle contract signed
async function handleContractSigned(eventData: any) {
  const { contractId, signedBy, signedAt, signatureIp, documentUrl } = eventData;

  if (!contractId) {
    console.error('No contract ID in signed event');
    return;
  }

  // Update contract status
  const { data: contract, error } = await supabase
    .from('contracts')
    .update({
      status: 'signed',
      signed_at: signedAt || new Date().toISOString(),
      signed_by: signedBy,
      signature_ip: signatureIp,
      signed_document_url: documentUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update contract:', error);
    return;
  }

  console.log(`[CONTRACT SIGNED] ${contractId} by ${signedBy}`);

  // Dispatch contract.signed event
  await dispatchContractSignedEvent(contract);
}

// Handle contract declined
async function handleContractDeclined(eventData: any) {
  const { contractId, signedBy } = eventData;

  await supabase
    .from('contracts')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: `Declined by ${signedBy}`,
    })
    .eq('id', contractId);

  // Notify team
  await notifyTeam(contractId, 'contract_declined', `Contrato recusado por ${signedBy}`);
}

// Handle contract viewed
async function handleContractViewed(eventData: any) {
  const { contractId, signedBy } = eventData;

  try {
    await supabase.from('contract_events').insert({
      contract_id: contractId,
      event_type: 'viewed',
      event_by: signedBy,
      event_at: new Date().toISOString(),
    });
  } catch {
    // Ignore logging errors
  }
}

// Dispatch contract.signed event for automation
async function dispatchContractSignedEvent(contract: any) {
  // 1. Activate contract
  await supabase
    .from('contracts')
    .update({ status: 'active', activated_at: new Date().toISOString() })
    .eq('id', contract.id);

  // 2. Create initial invoice
  const monthlyValue = contract.total_value / contract.duration_months;
  const dueDate = new Date();
  dueDate.setDate(parseInt(contract.payment_terms?.match(/\d+/)?.[0] || '10'));
  if (dueDate < new Date()) {
    dueDate.setMonth(dueDate.getMonth() + 1);
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      contract_id: contract.id,
      client_id: contract.client_id,
      amount: monthlyValue,
      due_date: dueDate.toISOString(),
      status: 'pending',
      description: `Mensalidade - ${contract.services?.[0]?.name || 'Serviços'}`,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  console.log(`[INVOICE CREATED] ${invoice?.id} for contract ${contract.id}`);

  // 3. Schedule recurring invoices (best-effort)
  try {
    await supabase.from('recurring_invoice_schedules').insert({
      contract_id: contract.id,
      client_id: contract.client_id,
      amount: monthlyValue,
      frequency: 'monthly',
      day_of_month: parseInt(contract.payment_terms?.match(/\d+/)?.[0] || '10'),
      next_run: new Date(dueDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: contract.end_date,
      is_active: true,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Ignore scheduling errors
  }

  // 4. Create production tasks from contract services
  if (contract.services && contract.services.length > 0) {
    await createProductionTasks(contract);
  }

  // 5. Create workflow transition to Operations (best-effort)
  try {
    await supabase.from('workflow_transitions').insert({
      from_area: 'juridico',
      to_area: 'financeiro',
      resource_type: 'contract',
      resource_id: contract.id,
      client_id: contract.client_id,
      status: 'completed',
      transitioned_at: new Date().toISOString(),
    });
  } catch {
    // Ignore transition errors
  }

  try {
    await supabase.from('workflow_transitions').insert({
      from_area: 'juridico',
      to_area: 'operacoes',
      resource_type: 'contract',
      resource_id: contract.id,
      client_id: contract.client_id,
      status: 'completed',
      transitioned_at: new Date().toISOString(),
    });
  } catch {
    // Ignore transition errors
  }

  // 6. Notify teams
  await notifyTeam(contract.id, 'contract_signed', `Contrato de ${contract.client_company} assinado! Iniciar produção.`);
  await notifyTeam(contract.id, 'invoice_created', `Fatura criada para ${contract.client_company} - R$ ${monthlyValue.toLocaleString('pt-BR')}`);
}

// Create production tasks from contract services
async function createProductionTasks(contract: any) {
  const { data: client } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('email', contract.client_email)
    .single();

  const clientId = client?.id || contract.client_id;
  if (!clientId) return;

  // Map services to Kanban areas
  const serviceAreaMapping: Record<string, string> = {
    'Gestão de Redes Sociais': 'social_media',
    'Tráfego Pago (Meta Ads)': 'trafego_pago',
    'Tráfego Pago (Google Ads)': 'trafego_pago',
    'Design Gráfico': 'design',
    'Criação de Conteúdo': 'social_media',
    'Desenvolvimento Web': 'desenvolvimento',
    'SEO': 'desenvolvimento',
    'Branding': 'design',
  };

  for (const service of contract.services) {
    const area = serviceAreaMapping[service.name] || 'operacoes';
    
    try {
      await supabase.from('kanban_cards').insert({
        title: `[NOVO CLIENTE] ${service.name} - ${contract.client_company}`,
        description: `Iniciar serviço de ${service.name} conforme contrato.\n\nEntregas: ${service.deliverables?.join(', ') || 'Conforme briefing'}\n\nValor mensal: R$ ${service.monthly_value?.toLocaleString('pt-BR') || 'N/A'}`,
        client_id: clientId,
        area: area,
        column: 'backlog',
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        metadata: {
          contract_id: contract.id,
          service_name: service.name,
          auto_created: true,
        },
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  }

  console.log(`[TASKS CREATED] ${contract.services.length} tasks for contract ${contract.id}`);
}

// Notify team
async function notifyTeam(contractId: string, type: string, message: string) {
  const { data: admins } = await supabase
    .from('user_profiles')
    .select('user_id')
    .in('user_type', ['super_admin', 'admin', 'finance', 'operations']);

  if (admins && admins.length > 0) {
    const notifications = admins.map((admin: any) => ({
      user_id: admin.user_id,
      type,
      title: type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      message,
      link: '/admin/contratos',
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    try {
      await supabase.from('notifications').insert(notifications);
    } catch {
      // Ignore notification errors
    }
  }
}
