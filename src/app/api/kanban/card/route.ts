import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { getAreaBoard, mapClientServiceTypeToAreaKey, type AreaKey } from '@/lib/kanban/areaBoards';
import type { DbTaskPriority } from '@/lib/kanban/types';
import { notifyAreaUsers } from '@/lib/admin/notifyArea';

export const dynamic = 'force-dynamic';

type ClientPriority = 'low' | 'normal' | 'high' | 'urgent';

function mapClientPriorityToDbPriority(priority: ClientPriority | undefined): DbTaskPriority {
  switch (priority) {
    case 'urgent':
      return 'urgent';
    case 'high':
      return 'high';
    case 'low':
      return 'low';
    case 'normal':
    default:
      return 'medium';
  }
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth?.user;
  if (authErr || !user) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor' }, { status: 500 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const title = String(body?.title || '').trim();
  const description = String(body?.description || '').trim();
  const observations = String(body?.observations || '').trim();
  const serviceType = String(body?.serviceType || '').trim();
  const dueDate = body?.dueDate ? String(body.dueDate) : null;
  const priority = (body?.priority as ClientPriority | undefined) || 'normal';

  if (!title) return NextResponse.json({ success: false, error: 'Título é obrigatório' }, { status: 400 });
  if (!serviceType) return NextResponse.json({ success: false, error: 'Tipo de serviço é obrigatório' }, { status: 400 });

  // Permitir cliente (user_profiles.user_type = 'client') ou admin para testes
  const { data: profile, error: profErr } = await supabase
    .from('user_profiles')
    .select('user_type, full_name, email')
    .eq('user_id', user.id)
    .maybeSingle();
  if (profErr) {
    return NextResponse.json({ success: false, error: 'Falha ao validar usuário' }, { status: 500 });
  }

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin && profile?.user_type !== 'client') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
  }

  const { data: clientRow } = await service
    .from('clients')
    .select('id, company_name, name, email')
    .eq('user_id', user.id)
    .maybeSingle();

  const clientId = clientRow?.id || null;
  if (!clientId && !isAdmin) {
      return NextResponse.json(
      { success: false, error: 'Cliente não vinculado. Crie/associe um registro em `clients` para este usuário.' },
        { status: 400 }
    );
  }

  const areaKey = mapClientServiceTypeToAreaKey(serviceType) as AreaKey;
  const areaLabel = getAreaBoard(areaKey).label;

  const { data: board, error: boardErr } = await service
    .from('kanban_boards')
    .select('id, name, area_key')
    .eq('area_key', areaKey)
    .maybeSingle();
  if (boardErr || !board) {
    return NextResponse.json({ success: false, error: 'Board da área não encontrado' }, { status: 500 });
  }

  const { data: demandCol, error: colErr } = await service
    .from('kanban_columns')
    .select('id, stage_key')
    .eq('board_id', board.id)
    .eq('stage_key', 'demanda')
    .maybeSingle();
  if (colErr || !demandCol) {
    return NextResponse.json({ success: false, error: 'Coluna "Demanda" não encontrada no board de destino' }, { status: 500 });
  }

  const dbPriority = mapClientPriorityToDbPriority(priority);

  // Próxima posição na coluna
  const { data: last } = await service
    .from('kanban_tasks')
    .select('position')
    .eq('board_id', board.id)
    .eq('column_id', demandCol.id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = Number((last as any)?.position || 0) + 1;

  const now = new Date().toISOString();
  const fullDescription = [description, observations ? `\n\nObservações do cliente:\n${observations}` : ''].join('').trim();

  const referenceLinks = {
    source: 'client_request',
    service_type: serviceType,
    client_user_id: user.id,
    client_profile: {
      name: profile?.full_name || null,
      email: profile?.email || null,
    },
    client: {
      id: clientId,
      company_name: clientRow?.company_name || clientRow?.name || null,
      email: clientRow?.email || null,
    },
    created_at: now,
  };

  const { data: created, error: insErr } = await service
    .from('kanban_tasks')
    .insert({
      board_id: board.id,
      column_id: demandCol.id,
      title,
      description: fullDescription || null,
      priority: dbPriority,
      status: 'todo',
      tags: Array.from(new Set(['cliente', serviceType])),
      due_date: dueDate || null,
      client_id: clientId,
      area: areaKey,
      reference_links: referenceLinks,
      assigned_to: null,
      created_by: user.id,
      position: nextPosition,
      updated_at: now,
    })
    .select('id, board_id, column_id, title')
    .single();
  if (insErr || !created) {
    return NextResponse.json({ success: false, error: insErr?.message || 'Falha ao criar tarefa' }, { status: 500 });
  }

  // Notificação best-effort para a área
  try {
    await notifyAreaUsers({
      area: areaLabel,
      title: 'Nova solicitação do cliente',
      message: `Nova demanda: ${title}`,
      link: '/app/kanban',
      type: 'client_request',
      metadata: { task_id: created.id, area_key: areaKey, service_type: serviceType },
    });
  } catch {
    // ignore
  }

    return NextResponse.json({
      success: true,
      message: 'Solicitação criada com sucesso',
    task: created,
    target: { area_key: areaKey, board_id: board.id, column_id: demandCol.id },
  });
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth?.user;
  if (authErr || !user) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const onlyMine = searchParams.get('mine');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (onlyMine === '1' && !isAdmin) {
    const { data: clientRow } = await service.from('clients').select('id').eq('user_id', user.id).maybeSingle();
    if (!clientRow?.id) return NextResponse.json({ success: true, tasks: [] });
    const { data } = await service
      .from('kanban_tasks')
      .select(
        `
          id, title, description, due_date, created_at, updated_at, status, priority, tags, reference_links,
          board:kanban_boards ( id, area_key ),
          column:kanban_columns ( id, stage_key, sla_hours )
        `
      )
      .eq('client_id', clientRow.id)
      .contains('reference_links', { source: 'client_request' })
      .order('created_at', { ascending: false });
    return NextResponse.json({ success: true, tasks: data || [] });
  }

  // Admin: listar as últimas tarefas do tipo client_request
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
  const { data } = await service
    .from('kanban_tasks')
    .select('id, title, client_id, board_id, column_id, created_at, reference_links')
    .contains('reference_links', { source: 'client_request' })
    .order('created_at', { ascending: false })
    .limit(50);
  return NextResponse.json({ success: true, tasks: data || [] });
}

