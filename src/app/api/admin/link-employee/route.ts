import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { AREA_BOARD_BY_KEY, type AreaKey } from '@/lib/kanban/areaBoards';

export const dynamic = 'force-dynamic';

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

async function requireAdmin() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) {
    return { ok: false as const, res: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }
  const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin');
  if (isAdminError || !isAdmin) {
    return { ok: false as const, res: NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 }) };
  }
  return { ok: true as const, actorUserId: auth.user.id };
}

async function findAuthUserIdByEmail(email: string): Promise<{ userId: string | null; fullName?: string | null }> {
  const supabaseAdmin = getSupabaseAdmin();
  const target = normalizeEmail(email);
  if (!target) return { userId: null };

  // Supabase Admin API não tem filtro direto por email; varremos páginas (suficiente para poucos usuários).
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) break;
    const users = data?.users || [];
    const found = users.find((u) => normalizeEmail(String(u.email || '')) === target);
    if (found?.id) {
      const meta: any = found.user_metadata || {};
      const fullName = meta.full_name || meta.name || null;
      return { userId: found.id, fullName };
    }
    if (users.length < perPage) break;
  }
  return { userId: null };
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  try {
    const body = await request.json();
    const email = normalizeEmail(body?.email);
    const areas = (Array.isArray(body?.areas) ? body.areas : [])
      .map((x: any) => String(x).trim())
      .filter(Boolean) as AreaKey[];

    if (!email) return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    if (areas.length === 0) return NextResponse.json({ error: 'Selecione ao menos 1 área' }, { status: 400 });

    // Validar se as áreas existem no catálogo
    for (const a of areas) {
      if (!AREA_BOARD_BY_KEY[a]) {
        return NextResponse.json({ error: `Área inválida: ${a}` }, { status: 400 });
      }
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1) Descobrir user_id (preferência: tabela public.users, fallback: Auth)
    let userId: string | null = null;
    let existingUserRow: any = null;

    {
      const { data: u } = await supabaseAdmin.from('users').select('id,email,full_name,name,role,user_type').eq('email', email).maybeSingle();
      if (u?.id && isUuid(String(u.id))) {
        userId = String(u.id);
        existingUserRow = u;
      }
    }

    let fullNameFromAuth: string | null = null;
    if (!userId) {
      const found = await findAuthUserIdByEmail(email);
      userId = found.userId;
      fullNameFromAuth = (found.fullName as any) || null;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado no Auth. Confirme o email e se ele consegue logar.' },
        { status: 404 }
      );
    }

    const providedFullName = body?.fullName ? String(body.fullName).trim() : '';
    const fullName = providedFullName || existingUserRow?.full_name || existingUserRow?.name || fullNameFromAuth || email;

    // 2) Garantir public.users
    const preserveRole = ['admin', 'super_admin'].includes(String(existingUserRow?.role || '').toLowerCase());
    const nextRole = preserveRole ? existingUserRow.role : 'employee';

    await supabaseAdmin
      .from('users')
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          name: fullName,
          role: nextRole,
          user_type: 'employee',
          account_status: 'active',
          is_active: true,
          email_verified: true,
          created_by: gate.actorUserId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    // 3) Garantir user_profiles (hub)
    await supabaseAdmin
      .from('user_profiles')
      .upsert(
        {
          id: userId,
          user_id: userId,
          email,
          full_name: fullName,
          user_type: 'employee',
          role: 'employee',
          is_active: true,
        },
        { onConflict: 'id' }
      );

    // 4) Upsert employees (fonte para RLS por área)
    const primaryArea: AreaKey = areas[0];
    const dept = primaryArea; // evita “Marketing” genérico (que mapeia errado para head_marketing)
    const expertise = areas.join(', ');

    const avatar = body?.avatarUrl ? String(body.avatarUrl).trim() : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;
    const phone = body?.phone ? String(body.phone).trim() : null;

    const { data: existingEmp } = await supabaseAdmin.from('employees').select('id,user_id').eq('user_id', userId).maybeSingle();

    if (existingEmp?.id) {
      await supabaseAdmin
        .from('employees')
        .update({
          full_name: fullName,
          email,
          phone,
          avatar,
          department: dept,
          area_of_expertise: expertise,
          areas,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingEmp.id);
    } else {
      await supabaseAdmin.from('employees').insert({
        user_id: userId,
        full_name: fullName,
        email,
        phone,
        avatar,
        department: dept,
        position: 'Colaborador',
        area_of_expertise: expertise,
        hire_date: new Date().toISOString().slice(0, 10),
        is_active: true,
        // compat (telas antigas)
        first_name: String(fullName).split(' ')[0] || fullName,
        last_name: String(fullName).split(' ').slice(1).join(' ') || '',
        whatsapp: phone,
        admission_date: new Date().toISOString().slice(0, 10),
        areas,
        photo_url: body?.photoUrl ? String(body.photoUrl).trim() : null,
      });
    }

    return NextResponse.json({
      success: true,
      userId,
      email,
      fullName,
      areas,
      note: 'Vínculo concluído. O colaborador deve ver apenas o(s) board(s) da(s) área(s) ao logar.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


