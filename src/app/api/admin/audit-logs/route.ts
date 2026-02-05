import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function pickSeverityFromNewValues(action: string, newValues: any): 'info' | 'warning' | 'error' | 'critical' {
  const s = String(newValues?.severity || '').toLowerCase();
  if (s === 'info' || s === 'warning' || s === 'error' || s === 'critical') return s;

  const ok = newValues?.success ?? newValues?.ok;
  if (ok === false) return 'error';
  if (String(action || '').toLowerCase().includes('error')) return 'error';
  return 'info';
}

function pickSuccessFromNewValues(action: string, newValues: any): boolean {
  const ok = newValues?.success ?? newValues?.ok;
  if (typeof ok === 'boolean') return ok;
  if (String(action || '').toLowerCase().includes('error')) return false;
  return true;
}

/**
 * GET /api/admin/audit-logs
 * Retorna logs unificados: audit_logs + integration_logs (admin-only).
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: authData } = await supabaseAuth.auth.getUser();
  if (!authData.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data: isAdmin, error: isAdminError } = await supabaseAuth.rpc('is_admin');
  if (isAdminError || !isAdmin) return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(500, Number(searchParams.get('limit') || 200)));

    const admin = getSupabaseAdmin();

    const [{ data: auditRows, error: auditErr }, { data: integrationRows, error: integrationErr }] = await Promise.all([
      admin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit),
      admin.from('integration_logs').select('*').order('created_at', { ascending: false }).limit(limit),
    ]);

    if (auditErr) throw auditErr;
    if (integrationErr) throw integrationErr;

    const userIds = Array.from(
      new Set((auditRows || []).map((r: any) => r.user_id).filter(Boolean))
    ) as string[];

    const { data: profiles } =
      userIds.length > 0
        ? await admin
            .from('user_profiles')
            .select('user_id,full_name,email,role')
            .in('user_id', userIds)
        : { data: [] as any[] };

    const profileById = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const auditLogs = (auditRows || []).map((r: any) => {
      const nv = r.new_values || {};
      const profile = r.user_id ? profileById.get(r.user_id) : null;

      return {
        id: r.id,
        timestamp: r.created_at,
        action: r.action,
        severity: pickSeverityFromNewValues(r.action, nv),
        userId: r.user_id || null,
        userEmail: profile?.email || nv.user_email || null,
        userName: profile?.full_name || nv.user_name || null,
        userRole: profile?.role || nv.user_role || null,
        targetType: r.entity_type || nv.target_type || null,
        targetId: r.entity_id || nv.target_id || null,
        targetName: nv.target_name || nv.targetName || null,
        description: nv.description || nv.message || r.action,
        metadata: nv.metadata || nv,
        ipAddress: r.ip_address || null,
        success: pickSuccessFromNewValues(r.action, nv),
        errorMessage: nv.errorMessage || nv.error || null,
      };
    });

    const integrationLogs = (integrationRows || []).map((r: any) => {
      const ok = String(r.status || '').toLowerCase() === 'success';
      const severity: 'info' | 'warning' | 'error' | 'critical' = ok ? 'info' : 'error';

      return {
        id: r.id,
        timestamp: r.created_at,
        action: `integration.${r.integration_id}.${r.action}`,
        severity,
        userId: null,
        userEmail: null,
        userName: null,
        userRole: 'system',
        targetType: 'integration',
        targetId: null,
        targetName: r.integration_id,
        description: `Integração ${r.integration_id}: ${r.action} (${r.status})`,
        metadata: {
          integration_id: r.integration_id,
          action: r.action,
          status: r.status,
          duration_ms: r.duration_ms,
          request_data: r.request_data,
          response_data: r.response_data,
        },
        ipAddress: null,
        success: ok,
        errorMessage: r.error_message || null,
      };
    });

    // Unificar e ordenar por timestamp
    const merged = [...auditLogs, ...integrationLogs].sort((a: any, b: any) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({ logs: merged.slice(0, limit) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


