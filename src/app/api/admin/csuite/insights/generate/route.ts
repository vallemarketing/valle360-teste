import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { normalizeExecutiveRole, EXECUTIVE_ROLES } from '@/lib/csuite/executiveTypes';
import { generateInsights } from '@/lib/csuite/insightsGenerator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const roleRaw = body?.role != null ? String(body.role) : 'all';
  const includeMarket = Boolean(body?.include_market);

  const role = roleRaw === 'all' ? null : normalizeExecutiveRole(roleRaw);
  if (roleRaw !== 'all' && !role) {
    return NextResponse.json({ success: false, error: 'role inválido' }, { status: 400 });
  }

  const roles = role ? [role] : EXECUTIVE_ROLES;
  let totalCreated = 0;
  const perRole: any[] = [];

  for (const r of roles) {
    const res = await generateInsights({ role: r, actorUserId: gate.userId, includeMarket: includeMarket && r === 'cmo' });
    totalCreated += res.created;
    perRole.push({ role: r, created: res.created, warning: res.warning || null });
  }

  return NextResponse.json({ success: true, created: totalCreated, perRole });
}

