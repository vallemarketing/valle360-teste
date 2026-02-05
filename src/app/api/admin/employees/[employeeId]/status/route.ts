import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

// PATCH - Atualizar status do colaborador (ativar/desativar)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { employeeId } = params;
  const db = getSupabaseAdmin();

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use "active" ou "inactive"' },
        { status: 400 }
      );
    }

    // Verificar se o colaborador existe
    const { data: employee, error: checkError } = await db
      .from('employees')
      .select('id, user_id, first_name, last_name')
      .eq('user_id', employeeId)
      .single();

    if (checkError || !employee) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    const isActive = status === 'active';
    const accountStatus = isActive ? 'active' : 'inactive';

    // Atualizar user_profiles
    await db
      .from('user_profiles')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', employeeId);

    // Atualizar users
    await db
      .from('users')
      .update({
        account_status: accountStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', employeeId);

    // Se desativando, também pode banir do Auth (opcional)
    if (!isActive) {
      try {
        // Isso impede o usuário de fazer login mas não deleta a conta
        await db.auth.admin.updateUserById(employeeId, {
          ban_duration: '876000h', // ~100 anos
        });
      } catch (authErr) {
        console.warn('Aviso: Não foi possível banir usuário do Auth:', authErr);
      }
    } else {
      // Se ativando, remover ban
      try {
        await db.auth.admin.updateUserById(employeeId, {
          ban_duration: 'none',
        });
      } catch (authErr) {
        console.warn('Aviso: Não foi possível desbanir usuário do Auth:', authErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Colaborador ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      status: accountStatus,
      employee: {
        name: `${employee.first_name} ${employee.last_name}`,
        id: employeeId,
      },
    });
  } catch (error: any) {
    console.error('Erro ao atualizar status do colaborador:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
}
