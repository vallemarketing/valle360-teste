import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createSendGridClient } from '@/lib/integrations/email/sendgrid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function isAdminFromCookies(): Promise<boolean> {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return false;
  const { data: isAdmin } = await supabase.rpc('is_admin');
  return !!isAdmin;
}

function isCronAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

function normalizeRecipients(to: unknown): Array<{ email: string }> {
  if (Array.isArray(to)) return to.map((x) => ({ email: String(x).trim() })).filter((x) => x.email);
  const s = String(to || '').trim();
  return s ? [{ email: s }] : [];
}

export async function POST(request: NextRequest) {
  try {
    // Autorização:
    // - Cron: Authorization: Bearer ${CRON_SECRET}
    // - Admin: sessão (cookies) + rpc('is_admin')
    const cronOk = isCronAuthorized(request);
    const adminOk = cronOk ? false : await isAdminFromCookies();
    if (!cronOk && !adminOk) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const to = normalizeRecipients(body?.to);
    const subject = String(body?.subject || '').trim();
    const html = body?.html ? String(body.html) : undefined;
    const text = body?.text ? String(body.text) : undefined;

    if (to.length === 0) return NextResponse.json({ error: 'Destinatário é obrigatório' }, { status: 400 });
    if (!subject) return NextResponse.json({ error: 'Assunto é obrigatório' }, { status: 400 });
    if (!html && !text) return NextResponse.json({ error: 'Conteúdo (html ou text) é obrigatório' }, { status: 400 });

    const envApiKey = (process.env.SENDGRID_API_KEY || '').trim();
    const envFromEmail = (process.env.SENDGRID_FROM_EMAIL || '').trim();
    const envFromName = (process.env.SENDGRID_FROM_NAME || '').trim();

    let apiKey = envApiKey;
    let fromEmail = envFromEmail || 'noreply@valle360.com.br';
    let fromName = envFromName || 'Valle 360';
    let connectedVia: 'env' | 'db' | 'mailto' = envApiKey ? 'env' : 'mailto';

    // Se existir config no banco, ela tem prioridade
    const service = getServiceSupabase();
    if (service) {
      const { data: cfg } = await service
        .from('integration_configs')
        .select('status, api_key, config')
        .eq('integration_id', 'sendgrid')
        .maybeSingle();
      const dbKey = (cfg?.status === 'connected' ? String(cfg?.api_key || '') : '').trim();
      if (dbKey) {
        apiKey = dbKey;
        connectedVia = 'db';
      }
      if (cfg?.config?.fromEmail) fromEmail = String(cfg.config.fromEmail);
      if (cfg?.config?.fromName) fromName = String(cfg.config.fromName);
    }

    if (!apiKey) {
      apiKey = 'mailto';
      connectedVia = 'mailto';
    }

    const client = createSendGridClient({ apiKey, fromEmail, fromName });
    const start = Date.now();
    const result = await client.sendEmail({
      to,
      subject,
      html,
      text,
      categories: ['valle360', 'transactional'],
    });
    const duration = Date.now() - start;

    // Log best-effort (somente se service estiver disponível)
    if (service) {
      try {
        await service.from('integration_logs').insert({
          integration_id: 'sendgrid',
          action: 'send_custom',
          status: result.success ? 'success' : 'error',
          request_data: { to: to.length, connectedVia },
          error_message: result.error,
          duration_ms: duration,
          response_data: { connectedVia },
          created_at: new Date().toISOString(),
        });
      } catch {
        // ignore
      }
    }

    if (!result.success) {
      return NextResponse.json({ error: 'Erro ao preparar email', details: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, connectedVia, mailtoUrl: result.mailtoUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}




