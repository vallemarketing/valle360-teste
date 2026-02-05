import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { extractMentionUserIds } from '@/lib/mentions/parse';
import { createSendGridClient } from '@/lib/integrations/email/sendgrid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type EntityType = 'kanban_task_comment' | 'direct_message' | 'group_message';

type Body = {
  entityType: EntityType;
  entityId: string;

  // context extras (best-effort para metadata/link)
  taskId?: string;
  conversationId?: string;
  groupId?: string;
  otherUserId?: string;
};

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function appUrlFromRequest(request: NextRequest) {
  const env = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (env) return env.replace(/\/+$/, '');
  const origin = request.headers.get('origin') || '';
  return origin.replace(/\/+$/, '');
}

function snippet(text: string, max = 140) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

async function resolveUserEmail(service: any, authUserId: string): Promise<string | null> {
  if (!authUserId) return null;
  // tentar user_profiles por id / user_id
  const { data: byId } = await service
    .from('user_profiles')
    .select('email, id, user_id')
    .eq('id', authUserId)
    .maybeSingle();
  const email1 = byId?.email ? String(byId.email).trim() : '';
  if (email1) return email1;

  const { data: byUserId } = await service
    .from('user_profiles')
    .select('email, id, user_id')
    .eq('user_id', authUserId)
    .maybeSingle();
  const email2 = byUserId?.email ? String(byUserId.email).trim() : '';
  if (email2) return email2;

  // fallback: employees
  const { data: emp } = await service
    .from('employees')
    .select('email')
    .eq('user_id', authUserId)
    .maybeSingle();
  const email3 = emp?.email ? String(emp.email).trim() : '';
  if (email3) return email3;

  // fallback: clients
  const { data: cl } = await service
    .from('clients')
    .select('email')
    .eq('user_id', authUserId)
    .maybeSingle();
  const email4 = cl?.email ? String(cl.email).trim() : '';
  if (email4) return email4;

  return null;
}

async function isClientUser(service: any, authUserId: string): Promise<boolean> {
  const { data } = await service.from('clients').select('id').eq('user_id', authUserId).maybeSingle();
  return !!data?.id;
}

async function sendMentionEmail(args: {
  service: any;
  request: NextRequest;
  toUserId: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const { service, request, toUserId, subject, text } = args;
  const html = args.html || undefined;

  const toEmail = await resolveUserEmail(service, toUserId);
  if (!toEmail) return { success: false, skipped: true as const, reason: 'no_email' };

  const envApiKey = (process.env.SENDGRID_API_KEY || '').trim();
  const envFromEmail = (process.env.SENDGRID_FROM_EMAIL || '').trim();
  const envFromName = (process.env.SENDGRID_FROM_NAME || '').trim();

  let apiKey = envApiKey;
  let fromEmail = envFromEmail || 'noreply@valle360.com.br';
  let fromName = envFromName || 'Valle 360';

  // Se existir config no banco, ela tem prioridade
  try {
    const { data: cfg } = await service
      .from('integration_configs')
      .select('status, api_key, config')
      .eq('integration_id', 'sendgrid')
      .maybeSingle();
    const dbKey = (cfg?.status === 'connected' ? String(cfg?.api_key || '') : '').trim();
    if (dbKey) apiKey = dbKey;
    if (cfg?.config?.fromEmail) fromEmail = String(cfg.config.fromEmail);
    if (cfg?.config?.fromName) fromName = String(cfg.config.fromName);
  } catch {
    // ignore
  }

  if (!apiKey) apiKey = 'mailto';

  const client = createSendGridClient({ apiKey, fromEmail, fromName });
  const result = await client.sendEmail({
    to: [{ email: toEmail }],
    subject,
    text,
    html,
    categories: ['valle360', 'mention'],
  });

  // Log best-effort
  try {
    await service.from('integration_logs').insert({
      integration_id: 'sendgrid',
      action: 'send_mention',
      status: result.success ? 'success' : 'error',
      request_data: { to: 1, toUserId },
      error_message: result.error,
      duration_ms: null,
      response_data: { origin: appUrlFromRequest(request) },
      created_at: new Date().toISOString(),
    });
  } catch {
    // ignore
  }

  return { success: result.success, error: result.error };
}

async function insertNotificationFlexible(service: any, payload: any) {
  // Tenta o schema usado pela app (user_id/type/link/metadata). Se falhar, tenta schema antigo (action_url).
  const base = {
    user_id: payload.user_id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  // tentativa 1: link + metadata
  const attempt1 = await service
    .from('notifications')
    .insert({
      ...base,
      link: payload.link ?? null,
      metadata: payload.metadata ?? {},
    });

  if (!attempt1.error) return { ok: true as const };

  // tentativa 2: action_url (schema antigo) + sem metadata
  const attempt2 = await service
    .from('notifications')
    .insert({
      ...base,
      action_url: payload.link ?? payload.action_url ?? null,
    });

  if (!attempt2.error) return { ok: true as const };

  return { ok: false as const, error: attempt1.error?.message || attempt2.error?.message || 'Falha ao inserir notificação' };
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth?.user;
  if (authErr || !user) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });

  const service = getServiceSupabase();
  if (!service) return NextResponse.json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor' }, { status: 500 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const entityType = String(body?.entityType || '').trim() as EntityType;
  const entityId = String(body?.entityId || '').trim();
  if (!entityType || !entityId) return NextResponse.json({ success: false, error: 'entityType e entityId são obrigatórios' }, { status: 400 });

  const nowIso = new Date().toISOString();
  const appUrl = appUrlFromRequest(request);

  let text = '';
  let meta: any = { source: 'mention', entity_type: entityType, entity_id: entityId };
  let link: string | null = null;
  let allowedMentionTargets: string[] | null = null;

  if (entityType === 'kanban_task_comment') {
    const { data: commentRow, error } = await supabase
      .from('kanban_task_comments')
      .select('id, task_id, user_id, comment, created_at')
      .eq('id', entityId)
      .single();
    if (error || !commentRow) return NextResponse.json({ success: false, error: 'Comentário não encontrado ou sem permissão' }, { status: 404 });

    // somente autor pode processar? não — qualquer viewer pode chamar, mas vamos usar o autor para excluir self
    text = String((commentRow as any).comment || '');

    const taskId = String((commentRow as any).task_id || body.taskId || '').trim();
    if (taskId) {
      const { data: taskRow } = await supabase
        .from('kanban_tasks')
        .select('id, board_id, title')
        .eq('id', taskId)
        .maybeSingle();
      if (taskRow?.id) {
        meta.board_id = String((taskRow as any).board_id || '');
        meta.task_id = String((taskRow as any).id);
        meta.task_title = String((taskRow as any).title || '');
      } else {
        meta.task_id = taskId;
      }
    }

    // Link fallback (caso schema não tenha metadata/link): aponta para /app/kanban com boardId/taskId
    if (meta?.board_id && meta?.task_id) {
      link = `/app/kanban?boardId=${encodeURIComponent(String(meta.board_id))}&taskId=${encodeURIComponent(String(meta.task_id))}`;
    } else {
      link = '/app/kanban';
    }

    // Restringir mentions: somente colaboradores ativos (employees)
    const mentionIds = extractMentionUserIds(text);
    if (mentionIds.length > 0) {
      const { data: emps } = await service
        .from('employees')
        .select('user_id')
        .eq('is_active', true)
        .in('user_id', mentionIds);
      allowedMentionTargets = (emps || []).map((r: any) => String(r.user_id));
    } else {
      allowedMentionTargets = [];
    }
  }

  if (entityType === 'direct_message') {
    const { data: msg, error } = await supabase
      .from('direct_messages')
      .select('id, conversation_id, from_user_id, body, created_at')
      .eq('id', entityId)
      .single();
    if (error || !msg) return NextResponse.json({ success: false, error: 'Mensagem não encontrada ou sem permissão' }, { status: 404 });

    const conversationId = String((msg as any).conversation_id || body.conversationId || '').trim();
    if (!conversationId) return NextResponse.json({ success: false, error: 'conversationId ausente' }, { status: 400 });

    // Checar que o usuário atual participa
    const { data: part } = await supabase
      .from('direct_conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!part?.id) return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });

    text = String((msg as any).body || '');
    meta.conversation_id = conversationId;
    meta.message_id = entityId;

    // Alvo permitido: o outro participante (evita spam para UUIDs aleatórios)
    const { data: other } = await service
      .from('direct_conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', String((msg as any).from_user_id || user.id))
      .maybeSingle();
    allowedMentionTargets = other?.user_id ? [String(other.user_id)] : [];

    // Link para mensagens (sem deep-link estrutural)
    link = '/app/mensagens';
  }

  if (entityType === 'group_message') {
    const { data: msg, error } = await supabase
      .from('messages')
      .select('id, group_id, from_user_id, body, created_at')
      .eq('id', entityId)
      .single();
    if (error || !msg) return NextResponse.json({ success: false, error: 'Mensagem não encontrada ou sem permissão' }, { status: 404 });

    const groupId = String((msg as any).group_id || body.groupId || '').trim();
    if (!groupId) return NextResponse.json({ success: false, error: 'groupId ausente' }, { status: 400 });

    // Checar que o usuário atual participa
    const { data: part } = await supabase
      .from('group_participants')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!part?.id) return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });

    text = String((msg as any).body || '');
    meta.group_id = groupId;
    meta.message_id = entityId;

    // Alvos permitidos: participantes ativos do grupo
    const { data: parts } = await service
      .from('group_participants')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('is_active', true);
    allowedMentionTargets = (parts || []).map((r: any) => String(r.user_id));

    link = '/app/mensagens';
  }

  const rawMentionIds = extractMentionUserIds(text);
  if (rawMentionIds.length === 0) {
    return NextResponse.json({ success: true, processed: 0, sentEmails: 0 });
  }

  const allowedSet = new Set((allowedMentionTargets || []) as string[]);
  const targets = rawMentionIds
    .filter((id) => id && id !== user.id)
    .filter((id) => (allowedMentionTargets ? allowedSet.has(id) : true));

  if (targets.length === 0) {
    return NextResponse.json({ success: true, processed: 0, sentEmails: 0 });
  }

  const results: Array<{ userId: string; notified: boolean; emailed: boolean; error?: string }> = [];
  let sentEmails = 0;

  // Preparar metadata padrão
  const baseTitle = 'Você foi mencionado';
  const baseMessage = snippet(text, 160);

  // Se for Kanban, o NotificationBell navega pelo metadata.board_id/task_id
  if (meta?.board_id && meta?.task_id) {
    // manter link como fallback; o NotificationBell vai preferir metadata quando existir
  }

  for (const targetUserId of targets) {
    try {
      const notifMeta = {
        ...meta,
        mentioned_by: user.id,
        mentioned_user_id: targetUserId,
        preview: baseMessage,
        created_at: nowIso,
      };

      // Para mensagens, ajustar link por alvo (cliente vai para /cliente/mensagens)
      let targetLink = link;
      if (entityType === 'direct_message' || entityType === 'group_message') {
        try {
          const client = await isClientUser(service, targetUserId);
          targetLink = client ? '/cliente/mensagens' : '/app/mensagens';
        } catch {
          targetLink = '/app/mensagens';
        }
      }

      const notif = await insertNotificationFlexible(service, {
        user_id: targetUserId,
        type: 'mention',
        title: baseTitle,
        message: baseMessage,
        link: targetLink,
        metadata: notifMeta,
      });

      const fullLink =
        meta?.board_id && meta?.task_id
          ? `${appUrl}/app/kanban?boardId=${encodeURIComponent(String(meta.board_id))}&taskId=${encodeURIComponent(String(meta.task_id))}`
          : targetLink
            ? `${appUrl}${targetLink.startsWith('/') ? targetLink : `/${targetLink}`}`
            : appUrl;

      const emailSubject = 'Você foi mencionado na Valle 360';
      const emailText = [
        'Você foi mencionado.',
        '',
        `Mensagem: ${baseMessage}`,
        '',
        `Abrir: ${fullLink}`,
      ].join('\n');

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Você foi mencionado</h2>
          <p><strong>Mensagem:</strong> ${baseMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <p><a href="${fullLink}">Abrir no Valle 360</a></p>
        </div>
      `;

      const emailRes = await sendMentionEmail({
        service,
        request,
        toUserId: targetUserId,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });

      const emailed = !!(emailRes as any).success;
      if (emailed) sentEmails++;

      results.push({ userId: targetUserId, notified: notif.ok, emailed, error: notif.ok ? undefined : (notif as any).error });
    } catch (e: any) {
      results.push({ userId: targetUserId, notified: false, emailed: false, error: e?.message || 'Erro' });
    }
  }

  return NextResponse.json({ success: true, processed: targets.length, sentEmails, results });
}


