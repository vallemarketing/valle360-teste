import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function normalizeEmail(v: any) {
  const s = String(v || '').trim().toLowerCase();
  return s.includes('@') ? s : '';
}

type RuleInput = {
  id?: string;
  alert_type: string;
  channel: 'email' | 'intranet';
  recipient_user_id?: string | null;
  recipient_email?: string | null;
  is_enabled?: boolean;
};

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const admin = getSupabaseAdmin();

  try {
    const [{ data: rules }, { data: users }] = await Promise.all([
      admin
        .from('alert_recipient_rules')
        .select('*')
        .order('alert_type', { ascending: true })
        .order('channel', { ascending: true })
        .order('created_at', { ascending: false }),
      admin.from('user_profiles').select('user_id,email,role,user_type,is_active').eq('is_active', true).limit(400),
    ]);

    return NextResponse.json({
      success: true,
      rules: rules || [],
      users:
        (users || []).map((u: any) => ({
          user_id: u.user_id ? String(u.user_id) : null,
          email: u.email ? String(u.email) : null,
          role: u.role ? String(u.role) : null,
          user_type: u.user_type ? String(u.user_type) : null,
          is_active: Boolean(u.is_active),
        })) || [],
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || 'Erro') }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const items: RuleInput[] = Array.isArray(body?.rules) ? body.rules : [];
  if (!items.length) return NextResponse.json({ success: false, error: 'rules vazio' }, { status: 400 });

  // validação e normalização
  const normalized: any[] = [];
  for (const r of items) {
    const alertType = String(r?.alert_type || '').trim();
    const channel = String(r?.channel || '').trim() as any;
    if (!alertType) return NextResponse.json({ success: false, error: 'alert_type é obrigatório' }, { status: 400 });
    if (channel !== 'email' && channel !== 'intranet') {
      return NextResponse.json({ success: false, error: 'channel inválido' }, { status: 400 });
    }

    const recipientUserId = r?.recipient_user_id ? String(r.recipient_user_id) : '';
    const recipientEmail = normalizeEmail(r?.recipient_email);
    const isEnabled = r?.is_enabled !== false;

    if (channel === 'intranet') {
      if (!isUuid(recipientUserId)) return NextResponse.json({ success: false, error: 'recipient_user_id inválido (intranet)' }, { status: 400 });
      normalized.push({
        alert_type: alertType,
        channel,
        recipient_user_id: recipientUserId,
        recipient_email: null,
        is_enabled: isEnabled,
      });
      continue;
    }

    // email
    if (!recipientEmail && !isUuid(recipientUserId)) {
      return NextResponse.json({ success: false, error: 'Email: informe recipient_email ou recipient_user_id' }, { status: 400 });
    }
    normalized.push({
      alert_type: alertType,
      channel,
      recipient_user_id: isUuid(recipientUserId) ? recipientUserId : null,
      recipient_email: recipientEmail || null,
      is_enabled: isEnabled,
    });
  }

  const admin = getSupabaseAdmin();

  // Estratégia simples e previsível para UI: substituir o conjunto por alert_type.
  // body: { alert_type, rules: [...] }
  const targetAlertType = String(body?.alert_type || '').trim();
  if (!targetAlertType) return NextResponse.json({ success: false, error: 'alert_type (target) é obrigatório' }, { status: 400 });

  const toApply = normalized.filter((x) => x.alert_type === targetAlertType);
  try {
    // remove existentes do tipo (idempotente)
    await admin.from('alert_recipient_rules').delete().eq('alert_type', targetAlertType);

    if (toApply.length) {
      const { error } = await admin.from('alert_recipient_rules').insert(toApply);
      if (error) throw error;
    }

    const { data: after } = await admin.from('alert_recipient_rules').select('*').eq('alert_type', targetAlertType);
    return NextResponse.json({ success: true, rules: after || [] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || 'Erro ao salvar') }, { status: 500 });
  }
}

