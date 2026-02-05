import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyAreaUsers } from '@/lib/admin/notifyArea';
import { createSendGridClient, EMAIL_TEMPLATES } from '@/lib/integrations/email/sendgrid';
import { createWhatsAppClient } from '@/lib/integrations/whatsapp/cloud';
import { logCronRun, requireCronAuth } from '@/lib/cron/cronUtils';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getJson(obj: any, path: string[]) {
  let cur = obj;
  for (const p of path) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

function setJson(obj: any, path: string[], value: any) {
  const out = { ...(obj || {}) };
  let cur: any = out;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    cur[key] = typeof cur[key] === 'object' && cur[key] !== null ? { ...cur[key] } : {};
    cur = cur[key];
  }
  cur[path[path.length - 1]!] = value;
  return out;
}

function parseIso(v: any): number | null {
  if (!v) return null;
  const ms = new Date(String(v)).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function shouldNotify(lastNotifiedAtIso: any, minIntervalMs: number) {
  const last = parseIso(lastNotifiedAtIso);
  if (!last) return true;
  return Date.now() - last >= minIntervalMs;
}

async function trySendClientEmail(service: any, params: { to: string; title: string; message: string; actionUrl?: string }) {
  try {
    const { data: cfg } = await service
      .from('integration_configs')
      .select('status, api_key, config')
      .eq('integration_id', 'sendgrid')
      .maybeSingle();
    const envApiKey = (process.env.SENDGRID_API_KEY || '').trim();
    const dbApiKey = (cfg?.status === 'connected' ? String(cfg?.api_key || '') : '').trim();
    let apiKey = dbApiKey || envApiKey;
    if (!apiKey) apiKey = 'mailto';

    const client = createSendGridClient({
      apiKey,
      fromEmail: cfg?.config?.fromEmail || process.env.SENDGRID_FROM_EMAIL || 'noreply@valle360.com.br',
      fromName: cfg?.config?.fromName || process.env.SENDGRID_FROM_NAME || 'Valle 360',
    });

    const tpl = EMAIL_TEMPLATES.notification(params.title, params.message, params.actionUrl, 'Abrir');
    const result = await client.sendEmail({
      to: { email: params.to },
      subject: tpl.subject,
      html: tpl.html,
    });
    return (result as any)?.success === true;
  } catch {
    return false;
  }
}

async function trySendClientWhatsApp(service: any, params: { to: string; text: string }) {
  try {
    const { data: cfg } = await service
      .from('integration_configs')
      .select('status, access_token, config')
      .eq('integration_id', 'whatsapp')
      .maybeSingle();
    if (!cfg || cfg.status !== 'connected' || !cfg.access_token || !cfg.config?.phoneNumberId) return false;

    const client = createWhatsAppClient({
      accessToken: cfg.access_token,
      phoneNumberId: cfg.config.phoneNumberId,
    });
    const res = await client.sendTextMessage(params.to, params.text, true);
    return !!res?.messages?.[0]?.id;
  } catch {
    return false;
  }
}

async function handleOverdueCron(started: number) {
  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }, { status: 500 });
  }

  try {
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    const result = {
      ok: true,
      ran_at: nowIso,
      overdue_tasks_notified: 0,
      overdue_approvals_notified: 0,
      emails_sent: 0,
      whatsapp_sent: 0,
    };

    // 1) Tarefas atrasadas (due_date no passado, não finalizadas)
    const { data: overdueTasks } = await service
      .from('kanban_tasks')
      .select(
        `
        id, title, due_date, assigned_to, board_id, column_id, reference_links,
        board:kanban_boards ( id, name, area_key ),
        column:kanban_columns ( id, name, stage_key )
      `
      )
      .lt('due_date', nowIso)
      .neq('status', 'cancelled')
      .limit(1000);

    for (const t of overdueTasks || []) {
      const stage = String((t as any)?.column?.stage_key || '').toLowerCase();
      if (stage === 'finalizado') continue;

      const ref = (t as any).reference_links || {};
      const lastNotified = getJson(ref, ['alerts', 'overdue_task', 'last_notified_at']);
      if (!shouldNotify(lastNotified, 24 * 60 * 60 * 1000)) continue;

      const title = 'Tarefa atrasada';
      const msg = `A tarefa "${t.title}" está atrasada (vencimento: ${String(t.due_date).slice(0, 10)}).`;

      if (t.assigned_to) {
        await service.from('notifications').insert({
          user_id: String(t.assigned_to),
          type: 'kanban_overdue',
          title,
          message: msg,
          is_read: false,
          link: '/colaborador/kanban',
          metadata: { task_id: t.id, kind: 'overdue_task', board_id: t.board_id, area_key: (t as any)?.board?.area_key || null },
          created_at: nowIso,
        });
      } else {
        // Sem responsável: notifica área (colaboradores, se existirem) ou broadcast por área para admins
        await notifyAreaUsers({
          area: String((t as any)?.board?.name || (t as any)?.board?.area_key || 'Kanban'),
          title,
          message: msg,
          link: '/admin/kanban-app',
          type: 'kanban_overdue',
          metadata: { task_id: t.id, kind: 'overdue_task', board_id: t.board_id, area_key: (t as any)?.board?.area_key || null },
        });
      }

      const updatedRef = setJson(ref, ['alerts', 'overdue_task'], {
        last_notified_at: nowIso,
        count: Number(getJson(ref, ['alerts', 'overdue_task', 'count']) || 0) + 1,
      });
      await service.from('kanban_tasks').update({ reference_links: updatedRef, updated_at: nowIso }).eq('id', t.id);
      result.overdue_tasks_notified += 1;
    }

  // 2) Aprovações do cliente atrasadas (coluna stage_key=aprovacao e due_at no passado)
  const { data: approvalCols } = await service.from('kanban_columns').select('id').eq('stage_key', 'aprovacao').limit(500);
  const approvalColIds = (approvalCols || []).map((c: any) => String(c.id));

  if (approvalColIds.length > 0) {
    const { data: approvalTasks } = await service
      .from('kanban_tasks')
      .select(
        `
          id, title, client_id, board_id, column_id, reference_links, updated_at,
          board:kanban_boards ( id, name, area_key )
        `
      )
      .in('column_id', approvalColIds)
      .neq('status', 'cancelled')
      .limit(1000);

    for (const t of approvalTasks || []) {
      const ref = (t as any).reference_links || {};
      const dueAtIso = getJson(ref, ['client_approval', 'due_at']);
      const dueAtMs = parseIso(dueAtIso);
      if (!dueAtMs) continue;
      if (dueAtMs > nowMs) continue; // ainda dentro do prazo

      const lastNotified = getJson(ref, ['alerts', 'client_approval_overdue', 'last_notified_at']);
      if (!shouldNotify(lastNotified, 24 * 60 * 60 * 1000)) continue;

      // buscar user/email/whatsapp do cliente
      const clientId = t.client_id ? String(t.client_id) : null;
      if (!clientId) continue;

      const { data: client } = await service
        .from('clients')
        .select('user_id, email, contact_email, whatsapp, contact_phone, company_name, name')
        .eq('id', clientId)
        .maybeSingle();

      if (!client) continue;

      const clientUserId = client?.user_id ? String(client.user_id) : null;
      if (!clientUserId) continue;

      const title = 'Aprovação pendente (atrasada)';
      const msg = `Sua aprovação está atrasada para seguirmos com a entrega: "${t.title}".`;

      await service.from('notifications').insert({
        user_id: clientUserId,
        type: 'client_approval_overdue',
        title,
        message: msg,
        is_read: false,
        link: '/cliente/aprovacoes',
        metadata: { task_id: t.id, kind: 'approval_overdue', board_id: t.board_id, area_key: (t as any)?.board?.area_key || null },
        created_at: nowIso,
      });

      result.overdue_approvals_notified += 1;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const actionUrl = appUrl ? `${appUrl}/cliente/aprovacoes` : undefined;
      const emailTo = (client.contact_email || client.email || '').trim();
      if (emailTo) {
        const sent = await trySendClientEmail(service, { to: emailTo, title, message: msg, actionUrl });
        if (sent) result.emails_sent += 1;
      }

      const waTo = String(client.whatsapp || client.contact_phone || '').trim();
      if (waTo) {
        const sent = await trySendClientWhatsApp(service, { to: waTo, text: `${title}\n\n${msg}${actionUrl ? `\n\nAcesse: ${actionUrl}` : ''}` });
        if (sent) result.whatsapp_sent += 1;
      }

      const updatedRef = setJson(ref, ['alerts', 'client_approval_overdue'], {
        last_notified_at: nowIso,
        count: Number(getJson(ref, ['alerts', 'client_approval_overdue', 'count']) || 0) + 1,
      });
      await service.from('kanban_tasks').update({ reference_links: updatedRef, updated_at: nowIso }).eq('id', t.id);
    }
  }

    await logCronRun({
      supabase: service,
      action: 'overdue',
      status: 'ok',
      durationMs: Date.now() - started,
      responseData: {
        overdue_tasks_notified: result.overdue_tasks_notified,
        overdue_approvals_notified: result.overdue_approvals_notified,
        emails_sent: result.emails_sent,
        whatsapp_sent: result.whatsapp_sent,
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    await logCronRun({
      supabase: service,
      action: 'overdue',
      status: 'error',
      durationMs: Date.now() - started,
      errorMessage: e?.message || 'Erro interno',
    });
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;
  return handleOverdueCron(started);
}

export async function GET(request: NextRequest) {
  const started = Date.now();
  const authResp = requireCronAuth(request);
  if (authResp) return authResp;
  return handleOverdueCron(started);
}


