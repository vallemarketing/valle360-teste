/**
 * API para buscar usuários que podem ser mencionados em mensagens
 * Retorna lista de usuários baseado no contexto (grupo ou conversa direta)
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

interface MentionableUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  userType: string;
  online?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const context = searchParams.get('context') || 'all'; // 'group', 'direct', 'all'
    const groupId = searchParams.get('groupId');
    const query = searchParams.get('q') || '';

    let mentionableUsers: MentionableUser[] = [];

    // Determinar contexto do usuário atual
    const { data: currentProfile } = await db
      .from('user_profiles')
      .select('id, user_type, is_super_admin')
      .eq('user_id', user.id)
      .single();

    const userType = currentProfile?.user_type || 'employee';
    const isSuperAdmin = currentProfile?.is_super_admin || userType === 'super_admin';

    if (context === 'group' && groupId) {
      // Buscar membros do grupo
      const { data: members } = await db
        .from('group_members')
        .select(`
          user_id,
          user_profiles!inner (
            id,
            user_id,
            full_name,
            email,
            avatar_url,
            user_type,
            is_active
          )
        `)
        .eq('group_id', groupId)
        .eq('is_active', true);

      if (members) {
        mentionableUsers = members
          .filter((m: any) => m.user_profiles?.is_active !== false)
          .map((m: any) => ({
            id: m.user_profiles.id,
            userId: m.user_profiles.user_id,
            name: m.user_profiles.full_name || 'Usuário',
            email: m.user_profiles.email || '',
            avatarUrl: m.user_profiles.avatar_url,
            userType: m.user_profiles.user_type || 'employee',
          }));
      }
    } else if (userType === 'client') {
      // Cliente só vê sua equipe atribuída
      const { data: clientData } = await db
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientData?.id) {
        const { data: teamAssignments } = await db
          .from('employee_client_assignments')
          .select(`
            role,
            employees!inner (
              user_id,
              user_profiles!inner (
                id,
                user_id,
                full_name,
                email,
                avatar_url,
                user_type
              )
            )
          `)
          .eq('client_id', clientData.id)
          .eq('is_active', true)
          .is('removed_at', null);

        if (teamAssignments) {
          mentionableUsers = teamAssignments.map((a: any) => ({
            id: a.employees?.user_profiles?.id,
            userId: a.employees?.user_profiles?.user_id,
            name: a.employees?.user_profiles?.full_name || 'Profissional',
            email: a.employees?.user_profiles?.email || '',
            avatarUrl: a.employees?.user_profiles?.avatar_url,
            role: a.role,
            userType: a.employees?.user_profiles?.user_type || 'employee',
          })).filter((u: any) => u.id);
        }
      }
    } else {
      // Colaboradores e admins veem todos os ativos
      const { data: profiles } = await db
        .from('user_profiles')
        .select('id, user_id, full_name, email, avatar_url, user_type')
        .eq('is_active', true)
        .neq('user_id', user.id) // Não incluir o próprio usuário
        .order('full_name');

      if (profiles) {
        mentionableUsers = profiles.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          name: p.full_name || 'Usuário',
          email: p.email || '',
          avatarUrl: p.avatar_url,
          userType: p.user_type || 'employee',
        }));
      }
    }

    // Filtrar por query se fornecida
    if (query) {
      const q = query.toLowerCase();
      mentionableUsers = mentionableUsers.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role?.toLowerCase().includes(q))
      );
    }

    // Limitar resultados
    mentionableUsers = mentionableUsers.slice(0, 20);

    return NextResponse.json({
      success: true,
      users: mentionableUsers,
      total: mentionableUsers.length,
    });

  } catch (error: any) {
    console.error('[Mentions API] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
