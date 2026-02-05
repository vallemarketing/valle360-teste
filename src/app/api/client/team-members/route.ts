/**
 * API para buscar membros da equipe atribuídos a um cliente específico
 * Usado para filtrar profissionais no chat do cliente
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

interface TeamMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  userType: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getSupabaseAdmin();

    // 1. Buscar o client_id do usuário logado
    const { data: clientData, error: clientError } = await db
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (clientError) {
      console.error('Erro ao buscar cliente:', clientError);
    }

    const clientId = clientData?.id;

    // Se não encontrou cliente, tentar buscar por user_profiles
    let finalClientId = clientId;
    if (!finalClientId) {
      const { data: profileData } = await db
        .from('user_profiles')
        .select('id, user_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData?.user_type === 'client') {
        finalClientId = profileData.id;
      }
    }

    // 2. Buscar profissionais atribuídos ao cliente
    let teamMembers: TeamMember[] = [];

    if (finalClientId) {
      // Tentar buscar da tabela employee_client_assignments
      const { data: assignments, error: assignError } = await db
        .from('employee_client_assignments')
        .select(`
          employee_id,
          role,
          employees!inner (
            id,
            user_id
          )
        `)
        .eq('client_id', finalClientId)
        .eq('is_active', true)
        .is('removed_at', null);

      if (!assignError && assignments && assignments.length > 0) {
        // Buscar perfis dos usuários atribuídos
        const employeeUserIds = assignments
          .map((a: any) => a.employees?.user_id)
          .filter(Boolean);

        if (employeeUserIds.length > 0) {
          const { data: profiles } = await db
            .from('user_profiles')
            .select('id, user_id, full_name, email, avatar_url, user_type')
            .in('user_id', employeeUserIds)
            .eq('is_active', true);

          teamMembers = (profiles || []).map((p: any) => {
            const assignment = assignments.find(
              (a: any) => a.employees?.user_id === p.user_id
            );
            return {
              id: p.id,
              userId: p.user_id,
              fullName: p.full_name || p.email?.split('@')[0] || 'Profissional',
              email: p.email || '',
              avatarUrl: p.avatar_url,
              role: (assignment as any)?.role || 'Equipe',
              userType: p.user_type
            };
          });
        }
      }
    }

    // 3. Fallback: Se não há atribuições, retornar lista vazia
    // (cliente não deveria ver todos os profissionais)

    return NextResponse.json({
      success: true,
      clientId: finalClientId,
      teamMembers,
      total: teamMembers.length,
      message: teamMembers.length === 0 
        ? 'Nenhum profissional atribuído a este projeto ainda'
        : undefined
    });

  } catch (error: any) {
    console.error('[TeamMembers] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
