import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isMissingTableError(e: any) {
  const msg = String(e?.message || '').toLowerCase();
  const code = String(e?.code || '');
  return code === '42P01' || msg.includes('relation') || msg.includes('does not exist');
}

function safeStr(v: any) {
  return v == null ? '' : String(v);
}

function inferTypeFromTask(task: any): 'design' | 'video' | 'post' | 'document' | 'website' {
  const tags = Array.isArray(task?.tags) ? task.tags.map((t: any) => String(t).toLowerCase()) : [];
  const title = String(task?.title || '').toLowerCase();
  const hay = `${title} ${tags.join(' ')}`;
  if (hay.includes('video')) return 'video';
  if (hay.includes('site') || hay.includes('website')) return 'website';
  if (hay.includes('post') || hay.includes('instagram') || hay.includes('reel')) return 'post';
  if (hay.includes('design') || hay.includes('banner') || hay.includes('criativo')) return 'design';
  return 'document';
}

async function requireUser() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function GET(_request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });

  const admin = getSupabaseAdmin();

  // 1) employee_id
  let employeeId: string | null = null;
  try {
    const byUser = await admin.from('employees').select('id').eq('user_id', user.id).maybeSingle();
    if (!byUser.error && byUser.data?.id) employeeId = String(byUser.data.id);
    else {
      const byProfile = await admin.from('employees').select('id').eq('user_profile_id', user.id).maybeSingle();
      if (!byProfile.error && byProfile.data?.id) employeeId = String(byProfile.data.id);
    }
  } catch {
    employeeId = null;
  }

  if (!employeeId) {
    return NextResponse.json({ success: false, error: 'Acesso negado (colaborador não vinculado em employees)' }, { status: 403 });
  }

  // 2) client assignments
  let clientIds: string[] = [];
  try {
    const { data, error } = await admin
      .from('employee_client_assignments')
      .select('client_id, is_active, removed_at')
      .eq('employee_id', employeeId)
      .order('assigned_at', { ascending: false })
      .limit(1000);
    if (error) throw error;
    clientIds = Array.from(
      new Set(
        (data || [])
          .filter((r: any) => r?.client_id && r?.is_active !== false && !r?.removed_at)
          .map((r: any) => String(r.client_id))
      )
    );
  } catch (e: any) {
    if (isMissingTableError(e)) {
      return NextResponse.json({
        success: true,
        items: [],
        note: 'Tabela employee_client_assignments não existe neste ambiente.',
      });
    }
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }

  if (clientIds.length === 0) {
    return NextResponse.json({ success: true, items: [], note: 'Nenhum cliente atribuído.' });
  }

  // 3) approval columns
  const { data: cols, error: colErr } = await admin
    .from('kanban_columns')
    .select('id, sla_hours')
    .eq('stage_key', 'aprovacao')
    .limit(500);
  if (colErr) {
    if (isMissingTableError(colErr)) return NextResponse.json({ success: true, items: [], note: 'Schema de kanban não encontrado.' });
    return NextResponse.json({ success: false, error: colErr.message }, { status: 500 });
  }
  const approvalColumnIds = (cols || []).map((c: any) => String(c.id));
  if (approvalColumnIds.length === 0) return NextResponse.json({ success: true, items: [], note: 'Nenhuma coluna de aprovação encontrada.' });

  // 4) tasks in approval
  let tasks: any[] = [];
  try {
    const { data, error } = await admin
      .from('kanban_tasks')
      .select('id,title,description,client_id,created_at,updated_at,due_date,priority,tags,reference_links,assigned_to,created_by')
      .in('column_id', approvalColumnIds)
      .in('client_id', clientIds)
      .neq('status', 'cancelled')
      .order('updated_at', { ascending: true })
      .limit(500);
    if (error) throw error;
    tasks = data || [];
  } catch (e: any) {
    if (isMissingTableError(e)) return NextResponse.json({ success: true, items: [], note: 'Tabela kanban_tasks não encontrada.' });
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }

  // 5) client names map (best-effort)
  const clientNameById = new Map<string, string>();
  {
    const tryNew = await admin.from('clients').select('id, company_name').in('id', clientIds);
    if (!tryNew.error) {
      for (const r of tryNew.data || []) {
        clientNameById.set(String((r as any).id), String((r as any).company_name || 'Cliente'));
      }
    } else {
      const tryLegacy = await admin.from('clients').select('id, nome_fantasia, razao_social').in('id', clientIds);
      if (!tryLegacy.error) {
        for (const r of tryLegacy.data || []) {
          const row: any = r;
          clientNameById.set(String(row.id), String(row.nome_fantasia || row.razao_social || 'Cliente'));
        }
      }
    }
  }

  // 6) creator names best-effort
  const creatorIds = Array.from(new Set(tasks.map((t: any) => String(t.created_by || '')).filter(Boolean)));
  const creatorNameById = new Map<string, string>();
  if (creatorIds.length) {
    const { data: profiles } = await admin.from('user_profiles').select('user_id, full_name, role').in('user_id', creatorIds);
    for (const p of profiles || []) {
      const id = String((p as any).user_id);
      creatorNameById.set(id, String((p as any).full_name || 'Usuário'));
    }
  }

  const items = tasks.map((t: any) => {
    const ref = (t.reference_links || {}) as any;
    const approval = (ref.client_approval || {}) as any;
    const history = Array.isArray(approval.history) ? approval.history : [];

    const comments = history
      .filter((h: any) => h?.comment)
      .slice(-10)
      .map((h: any, idx: number) => ({
        id: `${t.id}:${idx}`,
        text: String(h.comment),
        author: String(h.by_user_id || ''),
        authorName: String(h.by_name || 'Usuário'),
        isClient: true,
        createdAt: String(h.at || t.updated_at || t.created_at || new Date().toISOString()),
      }));

    return {
      id: String(t.id),
      title: safeStr(t.title) || 'Aprovação',
      description: safeStr(t.description) || undefined,
      type: inferTypeFromTask(t),
      status: 'pending',
      clientId: String(t.client_id),
      clientName: clientNameById.get(String(t.client_id)) || 'Cliente',
      createdBy: String(t.created_by || ''),
      createdByName: creatorNameById.get(String(t.created_by || '')) || 'Equipe',
      createdByArea: 'Equipe',
      createdAt: String(t.created_at || new Date().toISOString()),
      updatedAt: String(t.updated_at || t.created_at || new Date().toISOString()),
      dueDate: approval?.due_at ? String(approval.due_at) : (t.due_date ? String(t.due_date) : undefined),
      attachments: [],
      thumbnail: undefined,
      comments,
      priority: String(t.priority || '').toLowerCase() === 'high' || String(t.priority || '').toLowerCase() === 'urgent' ? 'high' : 'normal',
    };
  });

  return NextResponse.json({ success: true, items });
}



