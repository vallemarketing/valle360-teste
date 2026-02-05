import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { AREA_BOARDS, inferAreaKeyFromLabel, type AreaKey } from '@/lib/kanban/areaBoards';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

type ReadinessStatus = 'pass' | 'warn' | 'fail';

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function splitCsv(v: string | undefined | null) {
  return String(v || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function statusFromBool(ok: boolean): ReadinessStatus {
  return ok ? 'pass' : 'fail';
}

function inferVercelEnv(): 'production' | 'preview' | 'development' | 'unknown' {
  const raw = String(process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || '').trim().toLowerCase();
  if (raw === 'production' || raw === 'preview' || raw === 'development') return raw;
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'development') return 'development';
  return 'unknown';
}

function inferAppUrl(): string | null {
  const direct =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    null;
  if (direct) return String(direct);
  const vercelUrl = process.env.VERCEL_URL ? String(process.env.VERCEL_URL) : null;
  if (vercelUrl) return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
  return null;
}

function hasFirebaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );
}

function normalizeErrorMessage(msg: string) {
  return String(msg || '').toLowerCase();
}

function isMissingTableError(message: string) {
  const m = normalizeErrorMessage(message);
  return (
    m.includes('does not exist') ||
    m.includes('relation') ||
    m.includes('not found') ||
    m.includes('schema cache') ||
    m.includes('could not find the table')
  );
}

function isMissingColumnError(message: string) {
  const m = normalizeErrorMessage(message);
  return m.includes('column') && (m.includes('does not exist') || m.includes('could not find'));
}

async function checkTableExists(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  table: string
): Promise<{ ok: boolean; status: ReadinessStatus; reason?: string }> {
  const { error } = await supabaseAdmin.from(table).select('*', { head: true, count: 'exact' }).limit(1);
  if (!error) return { ok: true, status: 'pass' };

  // Se não existe, isso é FAIL. Qualquer outro erro (ex.: permissão) é WARN para não bloquear produção indevidamente.
  if (isMissingTableError(error.message)) {
    return { ok: false, status: 'fail', reason: error.message };
  }
  return { ok: false, status: 'warn', reason: error.message };
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabaseCookie = createRouteHandlerClient({ cookies: () => cookieStore });

  // Aceita auth por cookie (padrão) OU por Authorization Bearer (fallback),
  // porque algumas partes do front ainda usam supabase-js com sessão em localStorage.
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : null;

  const supabaseUser = bearer
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : supabaseCookie;

  const { data: authData } = await supabaseUser.auth.getUser();
  if (!authData.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  // Admin check via RPC (respeita RLS/auth.uid quando usando bearer token)
  const { data: isAdmin, error: isAdminError } = await supabaseUser.rpc('is_admin');
  if (isAdminError || !isAdmin) return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });

  try {
    const now = new Date().toISOString();
    const vercelEnv = inferVercelEnv();
    const appUrl = inferAppUrl();
    const supabaseAdmin = getSupabaseAdmin();

    // Hub
    const [{ count: pendingEvents }, { count: pendingTransitions }, { count: errorTransitions }] = await Promise.all([
      supabaseAdmin.from('event_log').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('workflow_transitions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('workflow_transitions').select('*', { count: 'exact', head: true }).eq('status', 'error'),
    ]);

    // Integrações
    const { data: integrations } = await supabaseAdmin
      .from('integration_configs')
      .select('integration_id, display_name, category, status, last_sync, error_message, api_key, access_token, config')
      .order('display_name');

    const integrationsSummary = (integrations || []).map((i: any) => ({
      id: i.integration_id,
      name: i.display_name,
      category: i.category,
      status: i.status,
      connected: i.status === 'connected',
      hasCredentials: Boolean(i.api_key || i.access_token),
      lastSync: i.last_sync,
      error: i.error_message,
    }));

    // Integrações obrigatórias (impactam prontidão) vs opcionais (N/A se não configuradas)
    const requiredIntegrations = ['openrouter', 'openai', 'stripe'] as const;
    // Opcionais (não bloqueiam prontidão), mas melhoram recursos: ex. Mercado (Perplexity)
    const optionalIntegrations = ['whatsapp', 'instagramback', 'n8n', 'perplexity'] as const;

    const requiredStatus: Record<string, ReadinessStatus> = {};
    const optionalStatus: Record<string, { status: ReadinessStatus; applicable: boolean }> = {};

    const findIntegrationRow = (id: string) => (integrations || []).find((x: any) => x.integration_id === id);

    for (const id of requiredIntegrations) {
      const row = findIntegrationRow(id);
      const connectedInDb = row?.status === 'connected' && Boolean(row?.api_key || row?.access_token);
      const connectedInEnv =
        (id === 'openrouter' && !!process.env.OPENROUTER_API_KEY) ||
        (id === 'openai' && !!process.env.OPENAI_API_KEY) ||
        (id === 'stripe' && !!process.env.STRIPE_SECRET_KEY);
      requiredStatus[id] = connectedInDb || connectedInEnv ? 'pass' : 'warn';
    }

    for (const id of optionalIntegrations) {
      const row = findIntegrationRow(id);
      const connectedInDb =
        id === 'whatsapp'
          ? row?.status === 'connected' && Boolean(row?.access_token) && Boolean(row?.config?.phoneNumberId)
          : row?.status === 'connected' && (Boolean(row?.api_key || row?.access_token) || Boolean(row?.config?.baseUrl || row?.config?.webhookUrl));

      const connectedInEnv =
        (id === 'whatsapp' && !!process.env.WHATSAPP_ACCESS_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID) ||
        (id === 'perplexity' && !!process.env.PERPLEXITY_API_KEY) ||
        // InstagramBack é configurado via DB (não env)
        false;

      // Se não há sinal de configuração (DB/env), tratamos como não aplicável.
      const hasAnyDbConfig = Boolean(row?.api_key || row?.access_token || (row?.config && Object.keys(row.config || {}).length > 0));
      const applicable = Boolean(connectedInDb || connectedInEnv || hasAnyDbConfig);

      optionalStatus[id] = {
        applicable,
        status: applicable ? (connectedInDb || connectedInEnv ? 'pass' : 'warn') : ('warn' as ReadinessStatus),
      };
    }

    const aiSource = {
      openrouter:
        (integrations || []).find((x: any) => x.integration_id === 'openrouter')?.status === 'connected' &&
        (integrations || []).find((x: any) => x.integration_id === 'openrouter')?.api_key
          ? ('db' as const)
          : process.env.OPENROUTER_API_KEY
            ? ('env' as const)
            : ('none' as const),
      openai:
        (integrations || []).find((x: any) => x.integration_id === 'openai')?.status === 'connected' &&
        (integrations || []).find((x: any) => x.integration_id === 'openai')?.api_key
          ? ('db' as const)
          : process.env.OPENAI_API_KEY
            ? ('env' as const)
            : ('none' as const),
    };

    // cPanel (mailbox)
    const cpanel = {
      status: (process.env.CPANEL_USER && process.env.CPANEL_PASSWORD && process.env.CPANEL_DOMAIN) ? ('pass' as ReadinessStatus) : ('warn' as ReadinessStatus),
      env: {
        hasUser: Boolean(process.env.CPANEL_USER),
        hasPassword: Boolean(process.env.CPANEL_PASSWORD),
        hasDomain: Boolean(process.env.CPANEL_DOMAIN),
        hasWebmailUrl: Boolean(process.env.WEBMAIL_URL || process.env.CPANEL_WEBMAIL_URL || process.env.NEXT_PUBLIC_WEBMAIL_URL),
      },
    };

    // Schema (tabelas críticas) — usando Service Role para evitar falsos negativos por RLS
    const schemaCriticalTables = [
      'notifications',
      'integration_configs',
      'integration_logs',
      'kanban_boards',
      'kanban_columns',
      'kanban_tasks',
      'kanban_task_comments',
      'clients',
      'employees',
      'user_profiles',
      // Mensagens (intranet)
      'direct_conversations',
      'direct_conversation_participants',
      'direct_messages',
      // Alert recipients (UI)
      'alert_recipient_rules',
      'instagram_posts',
      'social_connected_accounts',
      // Social metrics (cliente)
      'social_account_metrics_daily',
      'social_post_metrics',
      // IA/Insights
      'client_ai_insights',
      // Prospecção
      'prospecting_leads',
      // Metas
      'goal_configs',
      'collaborator_goals',
      'production_history',
      // ML/Preditivo
      'ml_predictions_log',
      'client_health_scores',
      'super_admin_insights',
      // C‑Suite Virtual (novo, canônico)
      'ai_executives',
      'ai_executive_conversations',
      'ai_executive_messages',
      'ai_executive_meetings',
      'ai_executive_meeting_messages',
      'ai_executive_insights',
      'ai_executive_decisions',
      'ai_executive_knowledge',
      'ai_executive_web_searches',
      'ai_executive_data_access_log',
      'ai_executive_alerts',
      'ai_executive_triggers',
      'ai_executive_action_drafts',
      // Sentimento
      'sentiment_analyses',
      'sentiment_processing_queue',
      'sentiment_alerts',
      'sentiment_daily_stats',
      'sentiment_automation_config',
      // RH
      'job_openings',
    ];

    const schemaChecks = await Promise.all(
      schemaCriticalTables.map(async (t) => {
        const r = await checkTableExists(supabaseAdmin, t);
        return { table: t, ...r };
      })
    );

    const schemaStatus: ReadinessStatus = schemaChecks.some((x) => x.status === 'fail')
      ? 'fail'
      : schemaChecks.some((x) => x.status === 'warn')
        ? 'warn'
        : 'pass';

    // Cron (execução real) — em Vercel, crons normalmente rodam apenas em produção.
    const cronJobs = ['collection', 'overdue', 'ml', 'alerts', 'social-publish', 'social-metrics'] as const;
    const cronApplicable = vercelEnv === 'production' || process.env.ENABLE_CRON_IN_PREVIEW === 'true';

    const cronChecks = cronApplicable
      ? await Promise.all(
          cronJobs.map(async (job) => {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: last } = await supabaseAdmin
              .from('integration_logs')
              .select('status, created_at, error_message')
              .eq('integration_id', 'cron')
              .eq('action', job)
              .gte('created_at', since)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const hasRun = Boolean(last?.created_at);
            // Se nunca rodou nas últimas 24h, warn (não fail) porque pode estar em implantação inicial
            const st: ReadinessStatus = hasRun ? (String(last?.status) === 'ok' ? 'pass' : 'warn') : 'warn';
            return {
              job,
              applicable: true,
              status: st,
              lastRunAt: last?.created_at || null,
              lastStatus: last?.status || null,
              lastError: last?.error_message || null,
            };
          })
        )
      : cronJobs.map((job) => ({
          job,
          applicable: false,
          status: 'warn' as ReadinessStatus,
          lastRunAt: null,
          lastStatus: null,
          lastError: null,
        }));

    const cronStatus: ReadinessStatus = cronChecks.some((c: any) => c.applicable && c.status === 'warn') ? 'warn' : 'pass';

    // Áreas (colaboradores)
    const { data: employees } = await supabaseAdmin
      .from('employees')
      .select('id, department, area_of_expertise, areas, is_active')
      .eq('is_active', true);

    const countsByAreaKey = new Map<AreaKey, number>();
    for (const b of AREA_BOARDS) countsByAreaKey.set(b.areaKey, 0);

    const addAreaKey = (k: AreaKey | null) => {
      if (!k) return;
      if (!countsByAreaKey.has(k)) return;
      countsByAreaKey.set(k, (countsByAreaKey.get(k) || 0) + 1);
    };

    for (const e of employees || []) {
      const labels: string[] = [];
      if (e?.department) labels.push(String(e.department));
      if ((e as any)?.area_of_expertise) labels.push(String((e as any).area_of_expertise));
      if (Array.isArray((e as any)?.areas)) labels.push(...((e as any).areas as any[]).map((x) => String(x)));

      const unique = new Set<AreaKey>();
      for (const lbl of labels) {
        const k = inferAreaKeyFromLabel(lbl);
        if (k) unique.add(k);
      }

      // Fallback: se nada foi inferido mas tem string de department, tenta inferir do texto todo
      if (unique.size === 0 && e?.department) {
        const k = inferAreaKeyFromLabel(String(e.department));
        if (k) unique.add(k);
      }

      for (const k of unique) addAreaKey(k);
    }

    const areaCoverage = AREA_BOARDS.map((b) => {
      const count = countsByAreaKey.get(b.areaKey) || 0;
      return {
        area: b.label,
        areaKey: b.areaKey,
        activeEmployees: count,
        status: count > 0 ? 'pass' : 'warn',
      };
    });

    // ML / Metas
    const [{ count: goalConfigs }, { count: mlModels }] = await Promise.all([
      supabaseAdmin.from('goal_configs').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('ml_models').select('*', { count: 'exact', head: true }),
    ]);

    // SQL/RPC essenciais
    const rpcOk = !isAdminError;

    // Segurança (anti-bypass)
    const testModeEnabled = String(process.env.NEXT_PUBLIC_TEST_MODE || '').toLowerCase() === 'true';
    const security = {
      applicable: true,
      testModeEnabled,
      status:
        vercelEnv === 'production' && testModeEnabled
          ? ('fail' as ReadinessStatus)
          : testModeEnabled
            ? ('warn' as ReadinessStatus)
            : ('pass' as ReadinessStatus),
      notes:
        vercelEnv === 'production' && testModeEnabled
          ? 'NEXT_PUBLIC_TEST_MODE=true em produção é crítico (bypass de autenticação).'
          : testModeEnabled
            ? 'NEXT_PUBLIC_TEST_MODE=true: permitido apenas para QA local/preview.'
            : 'OK',
    };

    // Alertas (threshold / cron.alerts)
    const alertsActorUserId = String(process.env.ALERTS_ACTOR_USER_ID || '').trim();
    const sendgridFromConfigured = true;

    // fallback para destinatários: admins/super_admins do banco
    let fallbackAdminEmails = 0;
    let fallbackAdminUserIds = 0;
    try {
      const { data } = await supabaseAdmin
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
      fallbackAdminEmails = rows.filter(isAdminLike).map((r) => String(r.email || '')).filter(Boolean).length;
      fallbackAdminUserIds = rows.filter(isAdminLike).map((r) => String(r.user_id || '')).filter(isUuid).length;
    } catch {
      // ignore
    }

    const emailRecipientsEnv = splitCsv(process.env.ALERTS_NOTIFY_EMAILS);
    const waRecipientsEnv = splitCsv(process.env.ALERTS_NOTIFY_WHATSAPP_PHONES);
    const intranetRecipientsEnv = splitCsv(process.env.ALERTS_NOTIFY_INTRANET_USER_IDS).filter((x) => isUuid(x));

    // Banco/UI (alert_recipient_rules)
    let dbEmailRecipients = 0;
    let dbIntranetRecipients = 0;
    let dbRecipientRulesConfigured = false;
    try {
      const { data } = await supabaseAdmin
        .from('alert_recipient_rules')
        .select('channel,is_enabled')
        .eq('is_enabled', true)
        .limit(1000);
      const rows = (data || []) as any[];
      dbRecipientRulesConfigured = rows.length > 0;
      dbEmailRecipients = rows.filter((r) => String(r.channel || '') === 'email').length;
      dbIntranetRecipients = rows.filter((r) => String(r.channel || '') === 'intranet').length;
    } catch {
      // tabela pode não existir ainda; ignore
      dbRecipientRulesConfigured = false;
      dbEmailRecipients = 0;
      dbIntranetRecipients = 0;
    }

    const alerts = {
      applicable: true,
      actorUserIdConfigured: Boolean(alertsActorUserId),
      actorUserIdValid: isUuid(alertsActorUserId),
      sendgridFromConfigured,
      hasEmailRecipientsEnv: emailRecipientsEnv.length > 0,
      hasWhatsAppRecipientsEnv: waRecipientsEnv.length > 0,
      hasIntranetRecipientsEnv: intranetRecipientsEnv.length > 0,
      hasRecipientsDb: dbRecipientRulesConfigured,
      dbEmailRecipients,
      dbIntranetRecipients,
      fallbackAdminEmails,
      fallbackAdminUserIds,
      status:
        // se ao menos 1 canal estiver configurado, consideramos "pass" para não bloquear prod
        ((emailRecipientsEnv.length > 0 || dbEmailRecipients > 0 || fallbackAdminEmails > 0) ||
          (optionalStatus.whatsapp?.status === 'pass' && waRecipientsEnv.length > 0) ||
          (isUuid(alertsActorUserId) && (intranetRecipientsEnv.length > 0 || dbIntranetRecipients > 0 || fallbackAdminUserIds > 0)))
          ? ('pass' as ReadinessStatus)
          : ('warn' as ReadinessStatus),
    };

    // QA (smoke checks de dados críticos por perfil)
    const tavilyConfigured = Boolean(process.env.TAVILY_API_KEY);
    let missingAreaBoards: string[] = [];
    let hasRhDemandColumn = false;
    let hasOperacaoDemandColumn = false;
    let assignmentsOk: { ok: boolean; status: ReadinessStatus; reason?: string } | null = null;
    let clientProfileColumnsOk = true;
    let clientProfileColumnsReason: string | null = null;

    try {
      // Kanban boards coverage
      const { data: boards } = await supabaseAdmin.from('kanban_boards').select('id,area_key').limit(200);
      const rows = (boards || []) as any[];
      const expectedKeys = AREA_BOARDS.map((b) => String(b.areaKey));
      missingAreaBoards = expectedKeys.filter((k) => !rows.some((b) => String(b?.area_key || '') === k));

      const findBoardId = (k: string) => rows.find((b) => String(b?.area_key || '') === k)?.id || null;
      const rhBoardId = findBoardId('rh');
      const opBoardId = findBoardId('operacao');

      if (rhBoardId) {
        const { data } = await supabaseAdmin
          .from('kanban_columns')
          .select('id')
          .eq('board_id', rhBoardId)
          .eq('stage_key', 'demanda')
          .maybeSingle();
        hasRhDemandColumn = Boolean((data as any)?.id);
      }

      if (opBoardId) {
        const { data } = await supabaseAdmin
          .from('kanban_columns')
          .select('id')
          .eq('board_id', opBoardId)
          .eq('stage_key', 'demanda')
          .maybeSingle();
        hasOperacaoDemandColumn = Boolean((data as any)?.id);
      }
    } catch {
      // ignore (degrade)
    }

    // Tabela de assignments (colaborador -> clientes/aprovações)
    assignmentsOk = await checkTableExists(supabaseAdmin, 'employee_client_assignments');

    // Colunas de perfil do cliente (segment/competitors) — detecta migrações faltando
    try {
      const { error } = await supabaseAdmin.from('clients').select('id,segment,competitors', { head: true }).limit(1);
      if (error && isMissingColumnError(error.message)) {
        clientProfileColumnsOk = false;
        clientProfileColumnsReason = error.message;
      }
    } catch (e: any) {
      clientProfileColumnsOk = false;
      clientProfileColumnsReason = e?.message || 'Falha ao validar colunas do perfil do cliente';
    }

    const qaStatus: ReadinessStatus =
      !clientProfileColumnsOk || (!hasRhDemandColumn && !hasOperacaoDemandColumn)
        ? 'fail'
        : missingAreaBoards.length > 0 || (assignmentsOk?.status !== 'pass') || !tavilyConfigured
          ? 'warn'
          : 'pass';

    const qa = {
      applicable: true,
      status: qaStatus,
      collaborator: {
        employeeClientAssignments: assignmentsOk,
      },
      kanban: {
        missingAreaBoards,
        requestsDemandColumn: {
          rh: hasRhDemandColumn,
          operacao: hasOperacaoDemandColumn,
          ok: hasRhDemandColumn || hasOperacaoDemandColumn,
        },
      },
      client: {
        profileColumns: {
          ok: clientProfileColumnsOk,
          reason: clientProfileColumnsReason,
        },
      },
      prospecting: {
        tavilyConfigured,
      },
    };

    const checks = {
      hub: {
        applicable: true,
        status: 'pass' as ReadinessStatus,
        pendingEvents: pendingEvents || 0,
        pendingTransitions: pendingTransitions || 0,
        errorTransitions: errorTransitions || 0,
      },
      security,
      areas: {
        applicable: true,
        status: areaCoverage.some((a) => a.status !== 'pass') ? ('warn' as ReadinessStatus) : ('pass' as ReadinessStatus),
        coverage: areaCoverage,
      },
      integrations: {
        applicable: true,
        status: Object.values(requiredStatus).some((s) => s === 'warn') ? ('warn' as ReadinessStatus) : ('pass' as ReadinessStatus),
        required: requiredStatus,
        optional: optionalStatus,
        items: integrationsSummary,
      },
      ai: {
        applicable: true,
        status: requiredStatus.openrouter === 'pass' || requiredStatus.openai === 'pass' ? ('pass' as ReadinessStatus) : ('warn' as ReadinessStatus),
        providers: {
          openrouter: requiredStatus.openrouter,
          openai: requiredStatus.openai,
        },
        source: aiSource,
      },
      ml: {
        applicable: true,
        status: statusFromBool((goalConfigs || 0) > 0 || (mlModels || 0) > 0),
        goalConfigs: goalConfigs || 0,
        mlModels: mlModels || 0,
      },
      sql: {
        applicable: true,
        status: statusFromBool(rpcOk),
        rpc: { is_admin: rpcOk ? 'pass' : 'fail' },
      },
      schema: {
        applicable: true,
        status: schemaStatus,
        criticalTables: schemaChecks,
      },
      cron: {
        applicable: cronApplicable,
        status: cronStatus,
        reason: cronApplicable ? null : 'Crons do Vercel rodam apenas em produção (preview: não aplicável).',
        jobs: cronChecks,
      },
      alerts,
      qa,
      cpanel: { ...cpanel, applicable: true },
    };

    const firebase = {
      // Firebase é opcional: o app usa Supabase Storage como padrão.
      // Para habilitar Firebase (ex.: upload direto/push), setar ENABLE_FIREBASE_STORAGE=true.
      applicable: process.env.ENABLE_FIREBASE_STORAGE === 'true',
      status:
        process.env.ENABLE_FIREBASE_STORAGE === 'true'
          ? (hasFirebaseEnv() ? ('pass' as ReadinessStatus) : ('warn' as ReadinessStatus))
          : ('warn' as ReadinessStatus),
    };

    // status geral (apenas checks aplicáveis)
    const allStatuses: ReadinessStatus[] = [
      checks.hub.applicable ? checks.hub.status : null,
      checks.security?.applicable ? (checks.security.status as ReadinessStatus) : null,
      checks.areas.applicable ? checks.areas.status : null,
      checks.integrations.applicable ? checks.integrations.status : null,
      checks.ai.applicable ? checks.ai.status : null,
      checks.ml.applicable ? checks.ml.status : null,
      checks.sql.applicable ? checks.sql.status : null,
      checks.schema.applicable ? checks.schema.status : null,
      checks.cron.applicable ? checks.cron.status : null,
      checks.alerts?.applicable ? (checks.alerts.status as ReadinessStatus) : null,
      checks.qa?.applicable ? (checks.qa.status as ReadinessStatus) : null,
      checks.cpanel.applicable ? checks.cpanel.status : null,
      firebase.applicable ? firebase.status : null,
    ].filter(Boolean) as ReadinessStatus[];

    const overall: ReadinessStatus = allStatuses.includes('fail') ? 'fail' : allStatuses.includes('warn') ? 'warn' : 'pass';

    return NextResponse.json({
      success: true,
      timestamp: now,
      environment: {
        vercelEnv,
        nodeEnv: process.env.NODE_ENV || null,
        appUrl,
      },
      overall,
      checks,
      firebase,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


