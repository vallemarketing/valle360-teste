/**
 * API para gerenciar equipe atribuída a um cliente
 * Super Admin pode adicionar/remover colaboradores
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

async function getAuthUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function checkSuperAdmin(userId: string) {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from('user_profiles')
    .select('user_type, is_super_admin')
    .eq('user_id', userId)
    .single();
  
  return data?.user_type === 'super_admin' || data?.is_super_admin === true;
}

// GET - Listar membros da equipe do cliente
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin(user.id);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const db = getSupabaseAdmin();
    const clientId = params.clientId;

    // Buscar atribuições ativas
    const { data: assignments, error } = await db
      .from('employee_client_assignments')
      .select(`
        id,
        employee_id,
        role,
        assigned_at,
        is_active,
        employees!inner (
          id,
          user_id,
          user_profiles!inner (
            full_name,
            email,
            avatar_url
          )
        )
      `)
      .eq('client_id', clientId)
      .eq('is_active', true)
      .is('removed_at', null);

    if (error) {
      console.error('Erro ao buscar equipe:', error);
      return NextResponse.json({ error: 'Erro ao buscar equipe' }, { status: 500 });
    }

    const teamMembers = (assignments || []).map((a: any) => ({
      id: a.id,
      employee_id: a.employee_id,
      employee_name: a.employees?.user_profiles?.full_name || 'Sem nome',
      employee_email: a.employees?.user_profiles?.email || '',
      employee_avatar: a.employees?.user_profiles?.avatar_url,
      role: a.role || 'support',
      assigned_at: a.assigned_at,
      is_active: a.is_active,
    }));

    return NextResponse.json({
      success: true,
      teamMembers,
      total: teamMembers.length,
    });

  } catch (error: any) {
    console.error('[ClientTeam GET] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

// POST - Adicionar membro à equipe
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin(user.id);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const db = getSupabaseAdmin();
    const clientId = params.clientId;
    const body = await request.json();
    const { employee_id, role = 'support' } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'employee_id é obrigatório' }, { status: 400 });
    }

    // Verificar se já existe atribuição ativa
    const { data: existing } = await db
      .from('employee_client_assignments')
      .select('id')
      .eq('client_id', clientId)
      .eq('employee_id', employee_id)
      .eq('is_active', true)
      .is('removed_at', null)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Colaborador já está na equipe' }, { status: 400 });
    }

    // Criar nova atribuição
    const { data: assignment, error } = await db
      .from('employee_client_assignments')
      .insert({
        client_id: clientId,
        employee_id: employee_id,
        role: role,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar membro:', error);
      return NextResponse.json({ error: 'Erro ao adicionar membro' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      assignment,
      message: 'Colaborador adicionado à equipe',
    });

  } catch (error: any) {
    console.error('[ClientTeam POST] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

// DELETE - Remover membro da equipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin(user.id);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const db = getSupabaseAdmin();
    const body = await request.json();
    const { assignment_id } = body;

    if (!assignment_id) {
      return NextResponse.json({ error: 'assignment_id é obrigatório' }, { status: 400 });
    }

    // Soft delete - marca como removido
    const { error } = await db
      .from('employee_client_assignments')
      .update({
        is_active: false,
        removed_at: new Date().toISOString(),
        removed_by: user.id,
      })
      .eq('id', assignment_id);

    if (error) {
      console.error('Erro ao remover membro:', error);
      return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Colaborador removido da equipe',
    });

  } catch (error: any) {
    console.error('[ClientTeam DELETE] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
