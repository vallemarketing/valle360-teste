import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') !== '0';
    const department = searchParams.get('department');

    // schema "preferido" (usado pelo módulo 9 box e migrations atuais)
    try {
      let q = supabase
        .from('employees')
        .select('id, user_id, full_name, email, department, position, manager_id, areas, is_active')
        .order('full_name', { ascending: true })
        .limit(2000);

      if (onlyActive) q = q.eq('is_active', true);
      if (department) q = q.eq('department', department);

      const { data, error } = await q;
      if (error) throw error;

      return NextResponse.json({ success: true, employees: data || [] });
    } catch {
      // fallback para schemas antigos (best-effort)
      let q = supabase
        .from('employees')
        .select('id, user_id, name, email, position, is_active, created_at')
        .order('created_at', { ascending: false })
        .limit(2000);
      if (onlyActive) q = q.eq('is_active', true);
      const { data } = await q;

      const mapped = (data || []).map((e: any) => ({
        id: e.id,
        user_id: e.user_id,
        full_name: e.name || e.email || 'Colaborador',
        email: e.email || null,
        department: null,
        position: e.position || null,
        manager_id: null,
        areas: [],
        is_active: e.is_active ?? true,
      }));

      return NextResponse.json({ success: true, employees: mapped, warning: 'employees_schema_fallback' });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


