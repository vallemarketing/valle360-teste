import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isMissingTableError(e: any) {
  const msg = String(e?.message || '').toLowerCase();
  const code = String(e?.code || '');
  return code === '42P01' || msg.includes('relation') || msg.includes('does not exist');
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeBadges(raw: any): Array<{ id: string; date?: string | null }> {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x: any) => {
        if (!x) return null;
        if (typeof x === 'string') return { id: x, date: null };
        if (typeof x === 'object') {
          const id = String(x.id || x.badge_id || x.code || '').trim();
          if (!id) return null;
          const date = x.date || x.unlocked_at || x.at || null;
          return { id, date: date ? String(date) : null };
        }
        return null;
      })
      .filter(Boolean) as any;
  }
  return [];
}

async function fetchClientBasics(admin: any, userId: string) {
  // Tentar schema novo (company_name/segment)
  const tryNew = await admin
    .from('clients')
    .select('id, company_name, segment, created_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (!tryNew.error && tryNew.data?.id) {
    return {
      schema: 'new' as const,
      id: String(tryNew.data.id),
      companyName: String((tryNew.data as any).company_name || 'Cliente'),
      segment: (tryNew.data as any).segment ? String((tryNew.data as any).segment) : null,
      createdAt: (tryNew.data as any).created_at ? String((tryNew.data as any).created_at) : null,
    };
  }

  const tryLegacy = await admin
    .from('clients')
    .select('id, nome_fantasia, razao_social, created_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (tryLegacy.error || !tryLegacy.data?.id) {
    return { schema: 'unknown' as const, id: null, companyName: null, segment: null, createdAt: null, error: tryLegacy.error };
  }
  const row: any = tryLegacy.data;
  return {
    schema: 'legacy' as const,
    id: String(row.id),
    companyName: String(row.nome_fantasia || row.razao_social || 'Cliente'),
    segment: null,
    createdAt: row.created_at ? String(row.created_at) : null,
  };
}

async function fetchClientNames(admin: any, ids: string[]) {
  const map = new Map<string, string>();
  if (!ids.length) return map;

  const tryNew = await admin.from('clients').select('id, company_name').in('id', ids);
  if (!tryNew.error) {
    for (const r of tryNew.data || []) {
      const id = (r as any).id ? String((r as any).id) : null;
      if (!id) continue;
      map.set(id, String((r as any).company_name || 'Cliente'));
    }
    return map;
  }

  const tryLegacy = await admin.from('clients').select('id, nome_fantasia, razao_social').in('id', ids);
  if (!tryLegacy.error) {
    for (const r of tryLegacy.data || []) {
      const id = (r as any).id ? String((r as any).id) : null;
      if (!id) continue;
      map.set(id, String((r as any).nome_fantasia || (r as any).razao_social || 'Cliente'));
    }
  }
  return map;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const client = await fetchClientBasics(admin, user.id);
    if (!client.id) {
      return NextResponse.json({ success: false, error: 'Cliente não vinculado (clients.user_id)' }, { status: 400 });
    }

    const warnings: string[] = [];

    // ===== Score (tabela client_gamification_scores) =====
    let scoreRow: any = null;
    try {
      const { data, error } = await admin
        .from('client_gamification_scores')
        .select('total_points, level, badges, achievements, updated_at')
        .eq('client_id', client.id)
        .maybeSingle();
      if (error) throw error;
      scoreRow = data || null;
    } catch (e: any) {
      if (isMissingTableError(e)) warnings.push('missing_table_client_gamification_scores');
      scoreRow = null;
    }

    const totalPoints = scoreRow?.total_points != null ? safeNum(scoreRow.total_points) : 0;
    const storedLevel = scoreRow?.level != null ? safeNum(scoreRow.level) : null;
    const badges = normalizeBadges(scoreRow?.badges);

    // ===== Ranking (top 10 + posição do usuário) =====
    let top: Array<{ position: number; client_id: string; name: string; points: number; isYou: boolean }> = [];
    let myPosition: number | null = null;
    try {
      const { data: topRows, error } = await admin
        .from('client_gamification_scores')
        .select('client_id, total_points, updated_at')
        .order('total_points', { ascending: false })
        .limit(10);
      if (error) throw error;

      const ids = Array.from(new Set((topRows || []).map((r: any) => String(r.client_id)).filter(Boolean)));
      const names = await fetchClientNames(admin, ids);

      top = (topRows || [])
        .map((r: any, idx: number) => {
          const cid = String(r.client_id || '');
          return {
            position: idx + 1,
            client_id: cid,
            name: names.get(cid) || 'Cliente',
            points: safeNum(r.total_points),
            isYou: cid === client.id,
          };
        })
        .filter((x: any) => !!x.client_id);

      // posição do usuário (count-based)
      if (client.id) {
        const { count, error: cntErr } = await admin
          .from('client_gamification_scores')
          .select('id', { count: 'exact', head: true })
          .gt('total_points', totalPoints);
        if (!cntErr && typeof count === 'number') myPosition = count + 1;
      }
    } catch (e: any) {
      if (isMissingTableError(e)) warnings.push('missing_table_client_gamification_scores');
      // ignore
      top = [];
      myPosition = null;
    }

    // ===== Histórico (best-effort via activity_logs) =====
    let pointsHistory: Array<{ id: string; kind: string; action: string; points: number; date: string }> = [];
    try {
      const { data: profile } = await admin.from('user_profiles').select('id').eq('user_id', user.id).maybeSingle();
      const profileId = profile?.id ? String(profile.id) : null;
      if (profileId) {
        const { data: logs, error } = await admin
          .from('activity_logs')
          .select('id, activity_type, activity_description, created_at, metadata')
          .eq('user_id', profileId)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;

        const pointsByType: Record<string, number> = {
          approval_on_time: 50,
          invoice_paid_on_time: 100,
          nps_response: 30,
          referral: 500,
          meeting_scheduled: 40,
          profile_completed: 50,
          message_sent: 5,
        };

        pointsHistory = (logs || []).map((l: any) => {
          const t = String(l.activity_type || 'activity');
          const points = (l.metadata && typeof l.metadata.points === 'number') ? Number(l.metadata.points) : (pointsByType[t] ?? 0);
          return {
            id: String(l.id),
            kind: t,
            action: String(l.activity_description || 'Atividade registrada'),
            points: points,
            date: String(l.created_at || new Date().toISOString()),
          };
        });
      }
    } catch (e: any) {
      if (isMissingTableError(e)) warnings.push('missing_table_activity_logs');
      pointsHistory = [];
    }

    return NextResponse.json({
      success: true,
      warnings,
      client: {
        id: client.id,
        company_name: client.companyName,
        segment: client.segment,
        created_at: client.createdAt,
      },
      score: {
        total_points: totalPoints,
        stored_level: storedLevel,
        badges,
        achievements: Array.isArray(scoreRow?.achievements) ? scoreRow.achievements : scoreRow?.achievements || [],
        updated_at: scoreRow?.updated_at ? String(scoreRow.updated_at) : null,
      },
      ranking: {
        my_position: myPosition,
        top10: top,
      },
      points_history: pointsHistory,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}



