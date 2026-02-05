/**
 * Client Profile API
 * - GET: retorna dados do cliente logado (segment/industry/competitors)
 * - PUT: atualiza campos do perfil do cliente (segment/competitors/concorrentes)
 *
 * Implementação usa service role para evitar problemas com RLS, mas valida ownership
 * pela sessão do usuário (cookies) e filtra por clients.user_id = auth.uid().
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function normalizeCompetitors(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((x) => String(x).trim()).filter(Boolean).slice(0, 25);
  }
  if (typeof input === 'string') {
    return input
      .split(/[\n,;]+/g)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 25);
  }
  return [];
}

async function requireUser() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function GET(_request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const admin = getSupabaseAdmin();

  // Tenta pegar colunas novas; se der erro de coluna ausente, faz fallback.
  const tryRich = await admin
    .from('clients')
    .select('id, user_id, company_name, industry, segment, competitors, concorrentes')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!tryRich.error) {
    const row: any = tryRich.data || null;
    const competitors = Array.isArray(row?.competitors)
      ? row.competitors.map((x: any) => String(x)).filter(Boolean)
      : normalizeCompetitors(row?.concorrentes);

    return NextResponse.json({
      success: true,
      profile: {
        id: row?.id,
        company_name: row?.company_name || null,
        industry: row?.industry || null,
        segment: row?.segment || null,
        competitors,
        concorrentes: row?.concorrentes || (competitors.length ? competitors.join('\n') : null),
      },
    });
  }

  const tryBasic = await admin
    .from('clients')
    .select('id, user_id, company_name, industry')
    .eq('user_id', user.id)
    .maybeSingle();

  if (tryBasic.error) {
    return NextResponse.json({ error: tryBasic.error.message }, { status: 500 });
  }

  const row: any = tryBasic.data || null;
  return NextResponse.json({
    success: true,
    profile: {
      id: row?.id,
      company_name: row?.company_name || null,
      industry: row?.industry || null,
      segment: null,
      competitors: [],
      concorrentes: null,
    },
    warning: 'fallback_basic',
  });
}

export async function PUT(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const segment = typeof body?.segment === 'string' ? body.segment.trim() : null;
  const industry = typeof body?.industry === 'string' ? body.industry.trim() : null;
  const concorrentes = typeof body?.concorrentes === 'string' ? body.concorrentes.trim() : null;
  const competitors = normalizeCompetitors(body?.competitors);

  const payload: any = {};
  if (segment !== null) payload.segment = segment || null;
  if (industry !== null) payload.industry = industry || null;
  if (concorrentes !== null) payload.concorrentes = concorrentes || null;
  if (body?.competitors !== undefined) payload.competitors = competitors;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ success: true, updated: false });
  }

  const admin = getSupabaseAdmin();
  const upd = await admin.from('clients').update(payload).eq('user_id', user.id).select('id').maybeSingle();

  if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });
  return NextResponse.json({ success: true, updated: true });
}


