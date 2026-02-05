import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { EXECUTIVE_ROLES } from '@/lib/csuite/executiveTypes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const admin = getSupabaseAdmin();
  try {
    const { data, error } = await admin
      .from('ai_executives')
      .select('id, role, name, title, avatar_url, status, communication_style, risk_tolerance, reports_to, created_at, updated_at')
      .order('role', { ascending: true });

    if (error) throw error;

    const order = new Map(EXECUTIVE_ROLES.map((r, i) => [r, i]));
    const list = (data || [])
      .map((r: any) => ({
        id: String(r.id),
        role: String(r.role || '').toLowerCase(),
        name: String(r.name || ''),
        title: String(r.title || ''),
        avatar_url: r.avatar_url ? String(r.avatar_url) : null,
        status: String(r.status || 'active'),
        communication_style: r.communication_style ? String(r.communication_style) : null,
        risk_tolerance: r.risk_tolerance ? String(r.risk_tolerance) : null,
        reports_to: r.reports_to ? String(r.reports_to) : null,
        created_at: r.created_at || null,
        updated_at: r.updated_at || null,
      }))
      .sort((a, b) => (order.get(a.role as any) ?? 999) - (order.get(b.role as any) ?? 999));

    return NextResponse.json({ success: true, executives: list });
  } catch (e: any) {
    const msg = String(e?.message || '');
    return NextResponse.json(
      {
        success: true,
        executives: [],
        warning:
          msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('relation')
            ? 'Tabela ai_executives ainda não existe neste ambiente. Rode a migration/SQL consolidado.'
            : 'Falha ao listar executivos.',
      },
      { status: 200 }
    );
  }
}

