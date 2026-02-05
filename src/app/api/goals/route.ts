/**
 * Valle 360 - API de Metas
 * Endpoints para gestão de metas inteligentes
 */

import { NextRequest, NextResponse } from 'next/server';
import { goalEngine } from '@/lib/goals/goal-engine';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function getUserSupabaseFromRequest(request: NextRequest) {
  // cookie OU Bearer token
  const cookieStore = cookies();
  const supabaseCookie = createRouteHandlerClient({ cookies: () => cookieStore });

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice('Bearer '.length).trim() : null;

  const supabaseUser = token
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : supabaseCookie;

  return { supabaseUser };
}

async function getAuthContext(request: NextRequest): Promise<{
  userId: string;
  isAdmin: boolean;
  employeeId: string | null;
}> {
  const { supabaseUser } = getUserSupabaseFromRequest(request);
  const { data: auth } = await supabaseUser.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('Não autorizado');

  const { data: isAdmin } = await supabaseUser.rpc('is_admin');

  const admin = getSupabaseAdmin();
  const { data: employee } = await admin.from('employees').select('id').eq('user_id', userId).maybeSingle();

  return { userId, isAdmin: !!isAdmin, employeeId: employee?.id ? String(employee.id) : null };
}

function mapEmployeeAreaToSector(area?: string | null): string {
  const a = (area || '').toLowerCase();
  if (a.includes('social')) return 'social_media';
  if (a.includes('trafego')) return 'trafego';
  if (a.includes('video')) return 'video_maker';
  if (a.includes('comercial')) return 'comercial';
  if (a.includes('design')) return 'designer';
  if (a.includes('web')) return 'designer';
  return 'designer';
}

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const ctx = await getAuthContext(request);

    const { searchParams } = new URL(request.url);
    const collaboratorId = searchParams.get('collaborator_id');
    const sector = searchParams.get('sector');
    const status = searchParams.get('status');

    // Sem collaborator_id: só admin pode listar tudo
    if (!collaboratorId && !ctx.isAdmin) {
      if (!ctx.employeeId) {
        return NextResponse.json({ success: false, error: 'Colaborador não vinculado (employees)' }, { status: 400 });
      }
    }

    const effectiveCollaboratorId = collaboratorId || ctx.employeeId;

    // Se pedindo de outro colaborador, exige admin
    if (effectiveCollaboratorId && ctx.employeeId && effectiveCollaboratorId !== ctx.employeeId && !ctx.isAdmin) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    let query = admin.from('collaborator_goals').select('*');

    if (effectiveCollaboratorId) {
      query = query.eq('collaborator_id', effectiveCollaboratorId);
    }
    if (sector) {
      query = query.eq('sector', sector);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    const msg = String(error?.message || error);
    const status = msg.includes('Não autorizado') ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    const admin = getSupabaseAdmin();

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'generate_all': {
        if (!ctx.isAdmin) return NextResponse.json({ success: false, error: 'Acesso negado (admin)' }, { status: 403 });
        const period_type = (params.period_type || 'monthly') as 'weekly' | 'monthly' | 'quarterly';

        const { data: employees, error } = await admin
          .from('employees')
          .select('id, user_id, full_name, area_of_expertise, department')
          .limit(500);

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        let generated = 0;
        const created: any[] = [];

        for (const emp of employees || []) {
          const name = String((emp as any).full_name || '').trim() || 'Colaborador';
          const area = String((emp as any).area_of_expertise || (emp as any).department || '');
          const sector = mapEmployeeAreaToSector(area);

          const goal = await goalEngine.createGoal(String((emp as any).id), name, sector, period_type);
          if (goal) {
            generated += 1;
            created.push(goal);
          }
        }

        return NextResponse.json({ success: true, generated, data: created });
      }

      case 'generate': {
        // Gerar metas automáticas com IA
        const { collaborator_id, collaborator_name, sector, period_type } = params;
        
        if (!collaborator_id || !sector) {
          return NextResponse.json(
            { success: false, error: 'collaborator_id e sector são obrigatórios' },
            { status: 400 }
          );
        }

        if (String(collaborator_id) !== String(ctx.employeeId || '') && !ctx.isAdmin) {
          return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const goal = await goalEngine.createGoal(
          collaborator_id,
          collaborator_name || 'Colaborador',
          sector,
          period_type || 'monthly'
        );

        return NextResponse.json({ success: true, data: goal });
      }

      case 'suggest': {
        // Obter sugestões de metas
        const { collaborator_id, sector, period_type } = params;
        if (!collaborator_id || !sector) {
          return NextResponse.json({ success: false, error: 'collaborator_id e sector são obrigatórios' }, { status: 400 });
        }

        if (String(collaborator_id) !== String(ctx.employeeId || '') && !ctx.isAdmin) {
          return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }
        
        const suggestions = await goalEngine.calculateSuggestedGoals(
          collaborator_id,
          sector,
          period_type || 'monthly'
        );

        return NextResponse.json({ success: true, data: suggestions });
      }

      case 'update_progress': {
        // Atualizar progresso de uma meta
        const { goal_id, metric_name, value } = params;
        if (!goal_id || !metric_name) {
          return NextResponse.json({ success: false, error: 'goal_id e metric_name são obrigatórios' }, { status: 400 });
        }

        // Permissão: dono da meta ou admin
        const { data: goalRow } = await admin
          .from('collaborator_goals')
          .select('id, collaborator_id')
          .eq('id', goal_id)
          .maybeSingle();
        if (!goalRow) return NextResponse.json({ success: false, error: 'Meta não encontrada' }, { status: 404 });
        if (String(goalRow.collaborator_id) !== String(ctx.employeeId || '') && !ctx.isAdmin) {
          return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const result = await goalEngine.updateProgress(goal_id, metric_name, Number(value || 0));
        return NextResponse.json({ success: true, data: result });
      }

      case 'check_alerts': {
        // Verificar e criar alertas para metas atrasadas
        if (!ctx.isAdmin) return NextResponse.json({ success: false, error: 'Acesso negado (admin)' }, { status: 403 });
        await goalEngine.checkAndCreateAlerts();
        return NextResponse.json({ success: true, message: 'Alertas verificados' });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    const msg = String(error?.message || error);
    const status = msg.includes('Não autorizado') ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    const admin = getSupabaseAdmin();

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da meta é obrigatório' },
        { status: 400 }
      );
    }

    // Permissão: dono da meta ou admin
    const { data: goalRow } = await admin.from('collaborator_goals').select('id, collaborator_id').eq('id', id).maybeSingle();
    if (!goalRow) return NextResponse.json({ success: false, error: 'Meta não encontrada' }, { status: 404 });
    if (String(goalRow.collaborator_id) !== String(ctx.employeeId || '') && !ctx.isAdmin) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const patch: Record<string, any> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Se ajustou manualmente, registra
    if (!patch.ai_suggested) {
      patch.adjusted_by = patch.adjusted_by ?? ctx.userId;
    }

    const { data, error } = await admin
      .from('collaborator_goals')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    const msg = String(error?.message || error);
    const status = msg.includes('Não autorizado') ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

