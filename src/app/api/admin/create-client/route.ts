import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { emitEvent, markEventError, markEventProcessed } from '@/lib/admin/eventBus';
import { handleEvent } from '@/lib/admin/eventHandlers';
import { notifyAdmins } from '@/lib/admin/notifyAdmins';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/create-client
 * Cria um usuário (auth) + registros em users/clients/user_profiles.
 * Usa service role para bypass RLS; exige que o chamador esteja autenticado.
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: authData } = await supabaseAuth.auth.getUser();
  const actorUserId = authData.user?.id;
  if (!actorUserId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Somente admin pode criar clientes (hub)
  const { data: isAdmin, error: isAdminError } = await supabaseAuth.rpc('is_admin');
  if (isAdminError || !isAdmin) {
    return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      // básicos
      email,
      password,
      full_name,
      phone,

      // empresa
      company_name,
      nome_fantasia,
      razao_social,
      tipo_pessoa,
      cpf_cnpj,
      industry,
      segment,
      website,
      whatsapp,
      address,
      // concorrência
      competitors,
      concorrentes,

      // billing
      monthly_value,
      plan_id,
      services,
      servicos_contratados,
      due_day,
      dia_vencimento,
      start_date,
      data_inicio,
    } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: 'email e password são obrigatórios' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1) criar auth user
    const { data: created, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || company_name || nome_fantasia || razao_social || email,
        // padronizar PT-BR no app
        user_type: 'cliente',
        role: 'cliente',
      },
    });

    if (createUserError || !created.user) {
      return NextResponse.json({ error: createUserError?.message || 'Falha ao criar usuário' }, { status: 500 });
    }

    const userId = created.user.id;

    // 2) users (compat)
    await supabase.from('users').upsert({
      id: userId,
      email,
      full_name: full_name || company_name || nome_fantasia || razao_social || email,
      name: full_name || company_name || nome_fantasia || razao_social || email,
      phone: phone || whatsapp || null,
      // padronizar PT-BR no app
      user_type: 'cliente',
      role: 'cliente',
      account_status: 'active',
      created_by: actorUserId,
      created_at: new Date().toISOString(),
    });

    // 3) user_profiles (hub)
    await supabase.from('user_profiles').upsert({
      id: userId,
      user_id: userId,
      email,
      full_name: full_name || company_name || nome_fantasia || razao_social || email,
      // padronizar PT-BR no app
      user_type: 'cliente',
      role: 'cliente',
      is_active: true,
      metadata: { plan_id: plan_id || null },
    });

    // 4) clients (schema moderno + compat)
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        company_name: company_name || nome_fantasia || razao_social || full_name || email,
        contact_name: full_name || company_name || nome_fantasia || razao_social || email,
        contact_email: email,
        contact_phone: phone || whatsapp || null,
        industry: industry || null,
        website: website || null,
        address: address || null,
        status: 'active',
        monthly_value: typeof monthly_value === 'number' ? monthly_value : 0,
        // compat
        email,
        whatsapp: whatsapp || phone || null,
        nome_fantasia: nome_fantasia || null,
        razao_social: razao_social || null,
        tipo_pessoa: tipo_pessoa || null,
        cpf_cnpj: cpf_cnpj || null,
        plan_id: plan_id || null,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (clientErr) {
      // rollback best-effort (não deletar auth aqui para evitar lock/edge cases)
      return NextResponse.json({ error: clientErr.message || 'Falha ao criar cliente' }, { status: 500 });
    }

    // 4.0) Campos opcionais (segmento/concorrentes) — best-effort para não quebrar ambientes com schema antigo
    try {
      const updatePayload: any = {};
      if (segment) updatePayload.segment = String(segment);
      if (Array.isArray(competitors)) {
        updatePayload.competitors = competitors.map((x: any) => String(x)).filter(Boolean);
      }
      if (typeof concorrentes === 'string' && concorrentes.trim()) updatePayload.concorrentes = concorrentes.trim();

      if (Object.keys(updatePayload).length > 0) {
        const upd = await supabase.from('clients').update(updatePayload).eq('id', client.id);
        if (upd.error) {
          const msg = String((upd.error as any)?.message || '');
          // Ignora erro de coluna ausente (ambientes com schema antigo)
          if (!msg.toLowerCase().includes('column')) throw upd.error;
        }
      }
    } catch (e) {
      // best-effort: não falhar criação do cliente por isso
      console.warn('Aviso: não foi possível salvar segment/competitors no clients:', e);
    }

    // 4.1) contrato básico (se houver plano/serviços)
    const finalServices = Array.isArray(services) ? services : Array.isArray(servicos_contratados) ? servicos_contratados : [];
    const finalDueDay = typeof due_day === 'number' ? due_day : typeof dia_vencimento === 'number' ? dia_vencimento : null;
    const finalStartDate =
      typeof start_date === 'string'
        ? start_date
        : typeof data_inicio === 'string' && data_inicio
          ? data_inicio
          : new Date().toISOString().slice(0, 10);

    if (plan_id || (finalServices && finalServices.length > 0)) {
      const { data: contract, error: contractErr } = await supabase
        .from('contracts')
        .insert({
        client_id: client.id,
        plan_id: plan_id || null,
        services: finalServices,
        monthly_value: typeof monthly_value === 'number' ? monthly_value : 0,
        due_day: finalDueDay,
        start_date: finalStartDate,
        status: 'active',
        active: true,
        created_by: actorUserId,
        created_at: new Date().toISOString(),
        })
        .select('id, client_id, monthly_value, due_day, start_date')
        .single();

      if (contractErr) {
        return NextResponse.json({ error: contractErr.message || 'Falha ao criar contrato' }, { status: 500 });
      }

      // Criar fatura inicial + transação prevista (Financeiro)
      const today = new Date();
      const issueDate = today.toISOString().slice(0, 10);
      const dueDayResolved = Number(contract?.due_day || 5);
      const dueDateObj = new Date(today.getFullYear(), today.getMonth(), dueDayResolved);
      const dueDate = dueDateObj.toISOString().slice(0, 10);
      const invoiceNumber = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        Math.floor(Math.random() * 9000) + 1000
      )}`;

      const { data: invoice, error: invoiceErr } = await supabase
        .from('invoices')
        .insert({
          contract_id: contract.id,
          client_id: contract.client_id,
          invoice_number: invoiceNumber,
          amount: contract.monthly_value || 0,
          issue_date: issueDate,
          due_date: dueDate,
          status: 'pending',
          notes: 'Fatura inicial gerada automaticamente no cadastro do cliente.',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (invoiceErr) {
        return NextResponse.json({ error: invoiceErr.message || 'Falha ao criar fatura' }, { status: 500 });
      }

      await supabase.from('financial_transactions').insert({
        transaction_type: 'income',
        category: 'subscription',
        amount: contract.monthly_value || 0,
        description: 'Receita prevista - contrato ativo (cadastro do cliente)',
        transaction_date: issueDate,
        invoice_id: invoice.id,
        client_id: contract.client_id,
        payment_method: null,
        reference_number: invoiceNumber,
        status: 'pending',
        created_by: actorUserId,
        created_at: new Date().toISOString(),
      });

      // Workflow: Contratos -> Financeiro -> Operacao
      await supabase.from('workflow_transitions').insert([
        {
          from_area: 'Contratos',
          to_area: 'Financeiro',
          status: 'pending',
          trigger_event: 'contract.created',
          data_payload: { contract_id: contract.id, invoice_id: invoice.id, client_id: contract.client_id },
          created_by: actorUserId,
        },
        {
          from_area: 'Financeiro',
          to_area: 'Operacao',
          status: 'pending',
          trigger_event: 'invoice.created',
          data_payload: { contract_id: contract.id, invoice_id: invoice.id, client_id: contract.client_id },
          created_by: actorUserId,
        },
      ]);

      await notifyAdmins(supabase as any, {
        title: 'Cliente com contrato ativo',
        message: `Contrato e fatura inicial criados automaticamente para ${client.company_name || client.email}.`,
        type: 'system',
        metadata: { client_id: contract.client_id, contract_id: contract.id, invoice_id: invoice.id },
        is_read: false,
      });
    }

    // 5) Event bus: client.created
    const event = await emitEvent({
      eventType: 'client.created',
      entityType: 'client',
      entityId: client.id,
      actorUserId,
      payload: { client_id: client.id, user_id: userId, email },
    });

    const handled = await handleEvent(event);
    if (!handled.ok) {
      await markEventError(event.id, handled.error);
    } else {
      await markEventProcessed(event.id);
    }

    return NextResponse.json({ success: true, client, user_id: userId, event_status: handled.ok ? 'processed' : 'error' });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


