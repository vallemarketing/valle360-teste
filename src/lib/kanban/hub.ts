import type { SupabaseClient } from '@supabase/supabase-js';

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

function mapStatusToColumnName(status: TaskStatus) {
  switch (status) {
    case 'backlog':
      return 'Backlog';
    case 'in_progress':
      return 'Em Progresso';
    case 'in_review':
      return 'Em Revisão';
    case 'done':
      return 'Concluído';
    case 'blocked':
      return 'Bloqueado';
    case 'cancelled':
      return 'Cancelado';
    case 'todo':
    default:
      return 'A Fazer';
  }
}

async function ensureBoardColumns(supabase: SupabaseClient, boardId: string) {
  const { data: cols } = await supabase
    .from('kanban_columns')
    .select('id,name,position')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (cols && cols.length > 0) return;

  const defaults = [
    { name: 'Backlog', position: 1, color: '#64748b' },
    { name: 'A Fazer', position: 2, color: '#f59e0b' },
    { name: 'Em Progresso', position: 3, color: '#3b82f6' },
    { name: 'Em Revisão', position: 4, color: '#8b5cf6' },
    { name: 'Concluído', position: 5, color: '#22c55e' },
    { name: 'Bloqueado', position: 6, color: '#ef4444' },
    { name: 'Cancelado', position: 7, color: '#9ca3af' },
  ];

  await supabase.from('kanban_columns').insert(defaults.map((c) => ({ ...c, board_id: boardId })));
}

export async function getOrCreateSuperAdminBoardId(supabase: SupabaseClient, createdBy?: string | null) {
  const { data: existing } = await supabase
    .from('kanban_boards')
    .select('id')
    .is('client_id', null)
    .eq('name', 'Super Admin')
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await ensureBoardColumns(supabase, existing.id);
    return existing.id as string;
  }

  const { data: created, error } = await supabase
    .from('kanban_boards')
    .insert({
      name: 'Super Admin',
      description: 'Quadro central do Admin',
      client_id: null,
      is_active: true,
      created_by: createdBy || null,
    })
    .select('id')
    .single();

  if (error) throw error;
  await ensureBoardColumns(supabase, created.id);
  return created.id as string;
}

export async function getOrCreateOnboardingBoardIdForClient(
  supabase: SupabaseClient,
  clientId: string,
  createdBy?: string | null
) {
  const { data: existing } = await supabase
    .from('kanban_boards')
    .select('id')
    .eq('client_id', clientId)
    .eq('name', 'Onboarding')
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await ensureBoardColumns(supabase, existing.id);
    return existing.id as string;
  }

  const { data: created, error } = await supabase
    .from('kanban_boards')
    .insert({
      name: 'Onboarding',
      description: 'Fluxo inicial automático',
      client_id: clientId,
      is_active: true,
      created_by: createdBy || null,
    })
    .select('id')
    .single();

  if (error) throw error;
  await ensureBoardColumns(supabase, created.id);
  return created.id as string;
}

export async function getColumnIdForStatus(supabase: SupabaseClient, boardId: string, status: TaskStatus) {
  const desired = mapStatusToColumnName(status);
  const { data: col } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('board_id', boardId)
    .eq('name', desired)
    .limit(1)
    .maybeSingle();

  if (col?.id) return col.id as string;

  const { data: first } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('board_id', boardId)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!first?.id) throw new Error('Board sem colunas');
  return first.id as string;
}

export async function createKanbanTaskFromHub(supabase: SupabaseClient, params: {
  boardId: string;
  clientId?: string | null;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  area?: string | null;
  createdBy?: string | null;
  referenceLinks?: any;
}) {
  const status: TaskStatus = params.status || 'todo';
  const priority: TaskPriority = params.priority || 'medium';

  const columnId = await getColumnIdForStatus(supabase, params.boardId, status);

  const { data: last } = await supabase
    .from('kanban_tasks')
    .select('position')
    .eq('board_id', params.boardId)
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = Number((last as any)?.position || 0) + 1;

  const { data, error } = await supabase
    .from('kanban_tasks')
    .insert({
      board_id: params.boardId,
      column_id: columnId,
      title: params.title,
      description: params.description || null,
      priority,
      status,
      position,
      client_id: params.clientId || null,
      area: params.area || null,
      created_by: params.createdBy || null,
      reference_links: params.referenceLinks || null,
      updated_at: new Date().toISOString(),
    })
    .select('id, board_id')
    .single();

  if (error) throw error;
  return data as { id: string; board_id: string };
}


