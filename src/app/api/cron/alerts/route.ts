import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { logCronRun, requireCronAuth } from '@/lib/cron/cronUtils';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { SendGridClient } from '@/lib/integrations/email/sendgrid';
import { sendWhatsAppMessage } from '@/lib/integrations/whatsapp';

// Wrapper para manter compatibilidade com o código existente
const whatsappService = {
  sendText: async (phone: string, text: string) => {
    return sendWhatsAppMessage({ to: phone, type: 'text', text });
  }
};

export const dynamic = 'force-dynamic';

function toNum(v: any): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'object' && (v as any)?.value != null) {
    const n = Number((v as any).value);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function splitCsv(v: string | undefined | null) {
  return String(v || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function getSendGridClientOrNull() {
  const apiKey = process.env.SENDGRID_API_KEY || 'mailto';
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@valle360.com.br';
  const fromName = process.env.SENDGRID_FROM_NAME || 'Valle 360';
  return new SendGridClient({ apiKey, fromEmail, fromName });
}

function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
}

async function insertInsightOncePerDay(supabase: any, input: {
  insight_category: string;
  insight_priority: string;
  insight_title: string;
  insight_description: string;
  affected_area?: string;
  confidence_score?: number;
  urgency_score?: number;
  source_type?: string;
  generated_by?: string;
}) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartIso = todayStart.toISOString();

  try {
    const { data: existing } = await supabase
      .from('super_admin_insights')
      .select('id')
      .eq('insight_title', input.insight_title)
      .gte('created_at', todayStartIso)
      .limit(1);
    if (existing && existing.length > 0) return false;

    await supabase.from('super_admin_insights').insert({
      insight_category: input.insight_category,
      insight_priority: input.insight_priority,
      insight_title: input.insight_title,
      insight_description: input.insight_description,
      affected_area: input.affected_area || null,
      confidence_score: input.confidence_score ?? 70,
      urgency_score: input.urgency_score ?? 70,
      source_type: input.source_type || 'system',
      generated_by: input.generated_by || 'system',
      status: 'new',
    });
    return true;
  } catch {
    return false;
  }
}

async function sendIntranetAlert(params: {
  supabase: any;
  fromUserId: string;
  toUserId: string;
  text: string;
}) {
  const { supabase, fromUserId, toUserId, text } = params;
  if (!isUuid(fromUserId) || !isUuid(toUserId)) return { success: false, error: 'user_id inválido' };

  // best-effort: se a função não existir ainda, não derruba o cron
  try {
    const { data: conversationId, error: convErr } = await supabase.rpc('get_or_create_direct_conversation', {
      p_user_id_1: fromUserId,
      p_user_id_2: toUserId,
      p_is_client_conversation: false,
    });
    if (convErr || !conversationId) return { success: false, error: convErr?.message || 'Falha ao criar conversa' };

    const { error: msgErr } = await supabase.from('direct_messages').insert({
      conversation_id: conversationId,
      from_user_id: fromUserId,
      body: text,
      message_type: 'text',
    });
    if (msgErr) return { success: false, error: msgErr.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Falha intranet' };
  }
}

async function resolveAdminRecipients(supabase: any): Promise<{ emails: string[]; userIds: string[] }> {
  // Preferência: env explícito. Se não existir, cai para admins/super_admins do banco.
  const envEmails = splitCsv(process.env.ALERTS_NOTIFY_EMAILS);
  const envUserIds = splitCsv(process.env.ALERTS_NOTIFY_INTRANET_USER_IDS).filter(isUuid);
  if (envEmails.length || envUserIds.length) return { emails: envEmails, userIds: envUserIds };

  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id,email,role,user_type,is_active')
      .eq('is_active', true)
      .limit(200);

    const rows = (data || []) as any[];
    const isAdminLike = (r: any) => {
      const role = String(r?.role || '').toLowerCase();
      const type = String(r?.user_type || '').toLowerCase();
      return role === 'admin' || role === 'super_admin' || type === 'super_admin';
    };

    const emails = rows.filter(isAdminLike).map((r) => String(r.email || '')).filter(Boolean);
    const userIds = rows.filter(isAdminLike).map((r) => String(r.user_id || '')).filter(isUuid);
    return { emails: Array.from(new Set(emails)), userIds: Array.from(new Set(userIds)) };
  } catch {
    return { emails: [], userIds: [] };
  }
}

async function resolveRecipientsByAlertType(
  supabase: any,
  alertType: string
): Promise<{ emails: string[]; userIds: string[]; source: 'env' | 'db' | 'fallback' }> {
  const envEmails = splitCsv(process.env.ALERTS_NOTIFY_EMAILS);
  const envUserIds = splitCsv(process.env.ALERTS_NOTIFY_INTRANET_USER_IDS).filter(isUuid);
  if (envEmails.length || envUserIds.length) return { emails: envEmails, userIds: envUserIds, source: 'env' };

  // 1) Banco/UI
  try {
    const { data: rules } = await supabase
      .from('alert_recipient_rules')
      .select('channel,recipient_user_id,recipient_email,is_enabled')
      .eq('alert_type', alertType)
      .eq('is_enabled', true)
      .limit(500);

    const rows = (rules || []) as any[];
    if (rows.length) {
      const intranetUserIds = rows
        .filter((r) => String(r.channel || '') === 'intranet')
        .map((r) => String(r.recipient_user_id || ''))
        .filter(isUuid);

      const emailUserIds = rows
        .filter((r) => String(r.channel || '') === 'email')
        .map((r) => String(r.recipient_user_id || ''))
        .filter(isUuid);

      const externalEmails = rows
        .filter((r) => String(r.channel || '') === 'email')
        .map((r) => String(r.recipient_email || ''))
        .map((e) => e.trim())
        .filter((e) => e && e.includes('@'));

      let userEmails: string[] = [];
      if (emailUserIds.length) {
        try {
          const { data: up } = await supabase
            .from('user_profiles')
            .select('user_id,email,is_active')
            .in('user_id', Array.from(new Set(emailUserIds)))
            .eq('is_active', true);
          userEmails = (up || []).map((r: any) => String(r.email || '')).filter(Boolean);
        } catch {
          userEmails = [];
        }
      }

      const emails = Array.from(new Set([...externalEmails, ...userEmails]));
      const userIds = Array.from(new Set(intranetUserIds));

      if (emails.length || userIds.length) return { emails, userIds, source: 'db' };
    }
  } catch {
    // ignore
  }

  const fallback = await resolveAdminRecipients(supabase);
  return { emails: fallback.emails, userIds: fallback.userIds, source: 'fallback' };
}

async function runThresholdAlerts() {
  const supabase = getSupabaseAdmin();
  const startedAt = Date.now();

  const thresholds = {
    payment_risk: Math.max(1, Math.min(100, Number(process.env.ALERT_THRESHOLD_PAYMENT_RISK || 80))),
    budget_overrun: Math.max(1, Math.min(100, Number(process.env.ALERT_THRESHOLD_BUDGET_OVERRUN || 85))),
    demand_capacity: Math.max(1, Math.min(100, Number(process.env.ALERT_THRESHOLD_DEMAND_CAPACITY || 85))),
    churn: Math.max(1, Math.min(100, Number(process.env.ALERT_THRESHOLD_CHURN || 70))),
  };

  // “Ator” para mensagens internas (obrigatório porque direct_messages.from_user_id é NOT NULL)
  const actorUserId = String(process.env.ALERTS_ACTOR_USER_ID || '').trim();
  const canSendIntranet = isUuid(actorUserId);

  // buscar previsões recentes (7 dias)
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  let preds: any[] = [];
  try {
    const { data } = await supabase
      .from('ml_predictions_log')
      .select('id,prediction_type,predicted_at,predicted_probability,predicted_value,prediction_target,target_id')
      .gte('predicted_at', since)
      .order('predicted_at', { ascending: false })
      .limit(500);
    preds = (data || []) as any[];
  } catch {
    // tabela não existe? degrade
    preds = [];
  }

  const latestByType = (type: string) => {
    const rows = preds
      .filter((p) => String(p?.prediction_type || '') === type)
      .map((p) => ({ p, v: toNum(p.predicted_value) }))
      .filter((x) => typeof x.v === 'number' && Number.isFinite(x.v as any));
    rows.sort((a, b) => Number(b.v) - Number(a.v));
    return rows[0]?.p || null;
  };

  const pay = latestByType('payment_risk');
  const bud = latestByType('budget_overrun');
  const cap = latestByType('demand_capacity');
  const chu = latestByType('churn');

  const triggered: Array<{ type: string; value: number; predictionId: string; entityName?: string | null }> = [];

  const resolveEntityName = async (p: any): Promise<string | null> => {
    const pv = p?.predicted_value;
    const pvName = pv && typeof pv === 'object' ? String((pv as any).entity_name || '') : '';
    if (pvName) return pvName;

    const t = String(p?.prediction_type || '');
    const targetId = p?.target_id ? String(p.target_id) : null;
    if (!targetId || !isUuid(targetId)) return null;

    try {
      if (t === 'payment_risk' || t === 'churn' || t === 'ltv' || t === 'upsell') {
        const { data } = await supabase.from('clients').select('company_name').eq('id', targetId).maybeSingle();
        const n = data?.company_name ? String(data.company_name) : null;
        return n || null;
      }
      if (t === 'budget_overrun') {
        const { data } = await supabase.from('campaigns').select('name').eq('id', targetId).maybeSingle();
        const n = data?.name ? String(data.name) : null;
        return n || null;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const check = async (
    p: any,
    type: keyof typeof thresholds,
    title: string,
    desc: (value: number, entityName?: string | null) => string,
    area: string
  ) => {
    if (!p?.id) return;
    const value = toNum(p.predicted_value);
    if (value == null) return;
    if (value < thresholds[type]) return;

    const entityName = await resolveEntityName(p);
    const inserted = await insertInsightOncePerDay(supabase, {
      insight_category: 'ml_alert',
      insight_priority: 'high',
      insight_title: title,
      insight_description: desc(value, entityName),
      affected_area: area,
      confidence_score: Math.round(Number(p.predicted_probability || 0)),
      urgency_score: Math.min(100, Math.round(value)),
      source_type: 'ml_predictions_log',
      generated_by: 'cron.alerts',
    });

    if (inserted) {
      triggered.push({ type, value, predictionId: String(p.id), entityName });
    }
  };

  await check(
    pay,
    'payment_risk',
    `Alerta ML: Risco de pagamento ≥ ${thresholds.payment_risk}%`,
    (v, name) =>
      `Cliente${name ? `: ${name}` : ''} com risco elevado de atraso/inadimplência.\nScore: ${Math.round(
        v
      )}%.\nSugestão: revisar Financeiro e acionar cobrança (intranet/email/WhatsApp).`,
    'financeiro'
  );

  await check(
    bud,
    'budget_overrun',
    `Alerta ML: Risco de estouro de orçamento ≥ ${thresholds.budget_overrun}%`,
    (v, name) =>
      `Campanha${name ? `: ${name}` : ''} com risco alto de estourar orçamento.\nScore: ${Math.round(
        v
      )}%.\nSugestão: revisar budget, pacing e metas.`,
    'marketing'
  );

  await check(
    cap,
    'demand_capacity',
    `Alerta ML: Capacidade crítica ≥ ${thresholds.demand_capacity}%`,
    (v, name) =>
      `Utilização da capacidade está crítica.${name ? ` (${name})` : ''}\nScore: ${Math.round(
        v
      )}%.\nSugestão: replanejar demanda, ajustar prioridades e acionar RH.`,
    'operacao'
  );

  await check(
    chu,
    'churn',
    `Alerta ML: Risco de churn ≥ ${thresholds.churn}%`,
    (v, name) =>
      `Cliente${name ? `: ${name}` : ''} em risco de cancelamento.\nScore: ${Math.round(
        v
      )}%.\nSugestão: plano de retenção + contato imediato.`,
    'comercial'
  );

  // Notificações (best-effort)
  const recipientsByType = {
    payment_risk: await resolveRecipientsByAlertType(supabase, 'payment_risk'),
    budget_overrun: await resolveRecipientsByAlertType(supabase, 'budget_overrun'),
    demand_capacity: await resolveRecipientsByAlertType(supabase, 'demand_capacity'),
    churn: await resolveRecipientsByAlertType(supabase, 'churn'),
  };

  const recipients = {
    emails: Array.from(new Set(Object.values(recipientsByType).flatMap((r) => r.emails))),
    userIds: Array.from(new Set(Object.values(recipientsByType).flatMap((r) => r.userIds))),
  };
  const sent: any = { email: 0, whatsapp: 0, intranet: 0, skipped: [] as string[] };

  if (triggered.length > 0) {
    const summary = triggered
      .map((t: any) => `- ${t.type}${t.entityName ? ` (${t.entityName})` : ''}: ${Math.round(t.value)}%`)
      .join('\n');
    const dashboardLink = '/admin/analytics/preditivo';
    const subject = `Valle360 • Alertas ML (${triggered.length})`;
    const text = `Alertas por threshold (cron):\n${summary}\n\nVer detalhes: ${dashboardLink}`;

    // Email
    const sg = getSendGridClientOrNull();
    if (sg && recipients.emails.length) {
      for (const email of recipients.emails.slice(0, 20)) {
        const resp = await sg.sendEmail({
          to: { email },
          subject,
          text,
          categories: ['valle360', 'cron', 'ml_alerts'],
          customArgs: { source: 'cron.alerts' },
        });
        if (resp.success) sent.email += 1;
      }
    } else {
      if (!sg) sent.skipped.push('email:not_configured');
      if (!recipients.emails.length) sent.skipped.push('email:no_recipients');
    }

    // WhatsApp
    const waPhones = splitCsv(process.env.ALERTS_NOTIFY_WHATSAPP_PHONES);
    if (isWhatsAppConfigured() && waPhones.length) {
      for (const phone of waPhones.slice(0, 10)) {
        const resp = await whatsappService.sendText(phone, text);
        if (resp.success) sent.whatsapp += 1;
      }
    } else {
      if (!isWhatsAppConfigured()) sent.skipped.push('whatsapp:not_configured');
      if (!waPhones.length) sent.skipped.push('whatsapp:no_recipients');
    }

    // Intranet (direct message)
    if (canSendIntranet && recipients.userIds.length) {
      for (const toUserId of recipients.userIds.slice(0, 20)) {
        const resp = await sendIntranetAlert({ supabase, fromUserId: actorUserId, toUserId, text });
        if (resp.success) sent.intranet += 1;
      }
    } else {
      if (!canSendIntranet) sent.skipped.push('intranet:missing_ALERTS_ACTOR_USER_ID');
      if (!recipients.userIds.length) sent.skipped.push('intranet:no_recipients');
    }
  }

  const durationMs = Date.now() - startedAt;
  return { success: true, thresholds, triggered, sent, durationMs };
}

export async function GET(request: NextRequest) {
  const deny = requireCronAuth(request);
  if (deny) return deny;

  const supabase = getSupabaseAdmin();
  const startedAt = Date.now();

  try {
    const result = await runThresholdAlerts();
    await logCronRun({
      supabase,
      action: 'alerts',
      status: 'ok',
      durationMs: Date.now() - startedAt,
      requestData: { source: 'cron', path: '/api/cron/alerts' },
      responseData: result,
    });
    return NextResponse.json(result);
  } catch (e: any) {
    await logCronRun({
      supabase,
      action: 'alerts',
      status: 'error',
      durationMs: Date.now() - startedAt,
      requestData: { source: 'cron', path: '/api/cron/alerts' },
      errorMessage: e?.message || 'Erro interno',
    });
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Execução manual (sem CRON_SECRET) — útil para QA no admin
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const result = await runThresholdAlerts();
    return NextResponse.json({ ...result, ranBy: gate.userId });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


