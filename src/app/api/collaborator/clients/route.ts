import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isMissingTableOrColumnError(message: string) {
  const m = String(message || '').toLowerCase();
  return (
    m.includes('does not exist') ||
    m.includes('relation') ||
    m.includes('schema cache') ||
    m.includes('could not find the table') ||
    m.includes('column') ||
    m.includes('unknown')
  );
}

function mapTrend(trend?: string | null): { trend: 'up' | 'down' | 'stable'; value: number } {
  const t = String(trend || '').toLowerCase();
  if (t === 'improving') return { trend: 'up', value: 0 };
  if (t === 'declining') return { trend: 'down', value: 0 };
  return { trend: 'stable', value: 0 };
}

async function getUserFromRequest(request: NextRequest) {
  // Cookie (app)
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) return data.user;
  } catch {
    // ignore
  }

  // Bearer (fallback)
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });

  const db = getSupabaseAdmin();

  // 1) identificar employee
  let employeeId: string | null = null;
  try {
    const byUserId = await db.from('employees').select('id').eq('user_id', user.id).maybeSingle();
    if (!byUserId.error && byUserId.data?.id) employeeId = String(byUserId.data.id);
    else if (byUserId.error && String(byUserId.error.message || '').toLowerCase().includes('column')) {
      const byProfileId = await db.from('employees').select('id').eq('user_profile_id', user.id).maybeSingle();
      if (!byProfileId.error && byProfileId.data?.id) employeeId = String(byProfileId.data.id);
    }
  } catch {
    employeeId = null;
  }

  if (!employeeId) {
    return NextResponse.json({ success: false, error: 'Acesso negado (colaborador não vinculado em employees)' }, { status: 403 });
  }

  // 2) assignments (employee_client_assignments)
  let assignments: Array<{ client_id: string; assigned_at?: string | null; role?: string | null }> = [];
  try {
    const { data, error } = await db
      .from('employee_client_assignments')
      .select('client_id, assigned_at, role, removed_at, is_active')
      .eq('employee_id', employeeId)
      .order('assigned_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    assignments = (data || [])
      .filter((r: any) => r?.client_id && (r?.is_active !== false) && !r?.removed_at)
      .map((r: any) => ({ client_id: String(r.client_id), assigned_at: r.assigned_at || null, role: r.role || null }));
  } catch (e: any) {
    if (isMissingTableOrColumnError(e?.message || '')) {
      return NextResponse.json({
        success: true,
        clients: [],
        note: 'Tabela employee_client_assignments não existe neste ambiente (schema de atribuição ainda não aplicado).',
      });
    }
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }

  const clientIds = Array.from(new Set(assignments.map((a) => a.client_id)));
  if (clientIds.length === 0) {
    return NextResponse.json({ success: true, clients: [], note: 'Nenhum cliente atribuído a este colaborador.' });
  }

  // 3) clients (new schema vs legacy)
  let clientsRows: any[] = [];
  let schema: 'new' | 'legacy' = 'new';
  {
    const tryNew = await db
      .from('clients')
      .select('id, user_id, company_name, industry, segment, site, created_at')
      .in('id', clientIds);
    if (!tryNew.error) {
      clientsRows = tryNew.data || [];
      schema = 'new';
    } else {
      const tryLegacy = await db
        .from('clients')
        .select('id, user_id, nome_fantasia, razao_social, area_atuacao, cidade, estado, site, created_at')
        .in('id', clientIds);
      if (tryLegacy.error) {
        return NextResponse.json({ success: false, error: tryLegacy.error.message }, { status: 500 });
      }
      clientsRows = tryLegacy.data || [];
      schema = 'legacy';
    }
  }

  const userIds = Array.from(new Set(clientsRows.map((c: any) => String(c.user_id || '')).filter(Boolean)));

  // 4) users (best-effort)
  let usersRows: any[] = [];
  if (userIds.length > 0) {
    const tryUsers = await db.from('users').select('id,email,full_name,phone,name,account_status').in('id', userIds);
    if (!tryUsers.error) usersRows = tryUsers.data || [];
    else {
      const tryProfiles = await db.from('user_profiles').select('user_id,email,full_name,phone,is_active').in('user_id', userIds);
      usersRows = (tryProfiles.data || []).map((p: any) => ({
        id: p.user_id,
        email: p.email,
        full_name: p.full_name,
        phone: p.phone,
        account_status: p.is_active === false ? 'inactive' : 'active',
      }));
    }
  }
  const userById = new Map(usersRows.map((u: any) => [String(u.id), u]));

  // 5) contracts (monthly value) best-effort
  const contractByClientId = new Map<string, any>();
  {
    const tryContracts = await db.from('contracts').select('client_id, monthly_value, status, start_date, created_at').in('client_id', clientIds);
    if (!tryContracts.error) {
      for (const c of tryContracts.data || []) if (c?.client_id && !contractByClientId.has(c.client_id)) contractByClientId.set(String(c.client_id), c);
    } else {
      const tryClientContracts = await db.from('client_contracts').select('client_id, monthly_value, status, start_date, created_at').in('client_id', clientIds);
      if (!tryClientContracts.error) {
        for (const c of tryClientContracts.data || []) if (c?.client_id && !contractByClientId.has(c.client_id)) contractByClientId.set(String(c.client_id), c);
      }
    }
  }

  // 6) health score (predictive) best-effort
  const healthByClientId = new Map<string, any>();
  {
    const tryHealth = await db
      .from('client_health_scores')
      .select('client_id, overall_health_score, score_trend, score_change, previous_score, calculated_at')
      .in('client_id', clientIds);
    if (!tryHealth.error) {
      for (const h of tryHealth.data || []) if (h?.client_id) healthByClientId.set(String(h.client_id), h);
    }
  }

  const assignedAtByClientId = new Map(assignments.map((a) => [a.client_id, a.assigned_at || null]));

  const clients = clientsRows.map((c: any) => {
    const u = userById.get(String(c.user_id || '')) || {};
    const contract = contractByClientId.get(String(c.id));
    const health = healthByClientId.get(String(c.id));

    const company =
      schema === 'new'
        ? String(c.company_name || 'Cliente')
        : String(c.nome_fantasia || c.razao_social || 'Cliente');

    const contactName = String(u.full_name || u.name || company);
    const email = String(u.email || '');
    const phone = String(u.phone || '');
    const website = String(c.site || '').trim() || null;

    const monthlyValue = contract ? Number(contract.monthly_value || 0) : null;
    const plan = contract?.status ? String(contract.status) : '—';

    const score = health ? Number(health.overall_health_score || 0) : null;
    const scoreChange = health && health.score_change != null ? Number(health.score_change || 0) : null;
    const trend = mapTrend(health?.score_trend || null);
    if (scoreChange != null) trend.value = scoreChange;

    const status: 'active' | 'inactive' | 'at_risk' =
      score != null && score < 60 ? 'at_risk' : 'active';

    const lastInteractionAt =
      (health?.calculated_at as string | null) ||
      (contract?.start_date as string | null) ||
      (contract?.created_at as string | null) ||
      (assignedAtByClientId.get(String(c.id)) as string | null) ||
      (c.created_at as string | null) ||
      null;

    // Location best-effort
    const location =
      schema === 'legacy'
        ? [c.cidade, c.estado].filter(Boolean).join(', ') || '—'
        : '—';

    return {
      id: String(c.id),
      name: contactName,
      company,
      logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(company)}`,
      plan,
      status,
      lastInteractionAt,
      revenue: monthlyValue,
      revenueKnown: monthlyValue != null,
      performance: {
        trend: trend.trend,
        value: trend.value,
        score,
      },
      email,
      phone,
      location,
      website,
    };
  });

  return NextResponse.json({ success: true, clients });
}



