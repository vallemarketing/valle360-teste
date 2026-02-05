import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import type { AreaKey } from '@/lib/kanban/areaBoards';
import { getAreaBoard } from '@/lib/kanban/areaBoards';
import { notifyAreaUsers } from '@/lib/admin/notifyArea';

export const dynamic = 'force-dynamic';

type RequestType = 'vacation' | 'dayoff' | 'home_office' | 'equipment' | 'refund';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getUserFromRequest(request: NextRequest): Promise<{ user: { id: string; email?: string | null } | null }> {
  // 1) Cookies (app)
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) return { user: { id: data.user.id, email: data.user.email } };
  } catch {
    // ignore
  }

  // 2) Bearer (mobile / apps)
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) return { user: null };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { user: null };

  const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) return { user: null };
  return { user: { id: data.user.id, email: data.user.email } };
}

async function isAdminUser(service: any, userId: string): Promise<boolean> {
  try {
    const { data } = await service
      .from('user_profiles')
      .select('user_type, role')
      .eq('user_id', userId)
      .maybeSingle();
    const ut = String((data as any)?.user_type || '').toLowerCase();
    const role = String((data as any)?.role || '').toLowerCase();
    return ut === 'super_admin' || ut === 'admin' || role === 'super_admin' || role === 'admin';
  } catch {
    return false;
  }
}

function requestTypeLabel(type: string) {
  switch (String(type)) {
    case 'vacation':
      return 'Férias';
    case 'dayoff':
      return 'Folga / Day Off';
    case 'home_office':
      return 'Home Office';
    case 'equipment':
      return 'Equipamento';
    case 'refund':
      return 'Reembolso';
    default:
      return 'Solicitação';
  }
}

function mapToEmployeeRequestType(type: RequestType): string {
  switch (type) {
    case 'home_office':
      return 'home_office';
    case 'dayoff':
      return 'day_off';
    case 'vacation':
      return 'vacation';
    case 'refund':
      return 'reimbursement';
    case 'equipment':
      return 'other';
    default:
      return 'other';
  }
}

function parseAmount(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value).replace(/[^\d,.\-]/g, '').trim();
  if (!s) return null;
  // aceita "1234,56" e "1234.56"
  const normalized = s.includes(',') && !s.includes('.') ? s.replace(',', '.') : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

async function createEmployeeRequest(params: {
  service: any;
  employeeId: string;
  type: RequestType;
  startDate: string;
  endDate: string | null;
  reason: string;
  amount: string | null;
}): Promise<string | null> {
  try {
    const request_type = mapToEmployeeRequestType(params.type);
    const amountNum = parseAmount(params.amount);

    const { data, error } = await params.service
      .from('employee_requests')
      .insert({
        employee_id: params.employeeId,
        request_type,
        start_date: params.startDate || null,
        end_date: params.endDate || null,
        description: params.reason,
        amount: amountNum,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !data?.id) return null;
    return String(data.id);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = getServiceSupabase();
    if (!service) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const wantAll = searchParams.get('all') === '1';
    const admin = wantAll ? await isAdminUser(service, user.id) : false;
    if (wantAll && !admin) return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });

    let q = service
      .from('kanban_tasks')
      .select(
        `
          id, title, created_at, updated_at, reference_links,
          created_by,
          column:kanban_columns ( stage_key )
        `
      )
      .contains('reference_links', { source: 'employee_request' })
      .order('created_at', { ascending: false })
      .limit(200);

    if (!wantAll) q = q.eq('created_by', user.id);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Enriquecer com status real (employee_requests), quando existir
    const taskRows = (data || []) as any[];
    const employeeRequestIds = Array.from(
      new Set(
        taskRows
          .map((t) => String((t?.reference_links as any)?.employee_request_id || '').trim())
          .filter(Boolean)
      )
    );
    let requestStatusMap = new Map<string, any>();
    if (employeeRequestIds.length > 0) {
      const { data: reqs } = await service
        .from('employee_requests')
        .select('id, status, approved_by, approved_at, rejection_reason')
        .in('id', employeeRequestIds);
      requestStatusMap = new Map((reqs || []).map((r: any) => [String(r.id), r]));
    }

    // Enriquecer com nome do colaborador (admin view)
    let nameByUserId = new Map<string, string>();
    if (wantAll) {
      const userIds = Array.from(new Set(taskRows.map((t) => String(t?.created_by || '')).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: emps } = await service.from('employees').select('user_id, full_name').in('user_id', userIds);
        nameByUserId = new Map((emps || []).map((e: any) => [String(e.user_id), String(e.full_name || '').trim()]));
      }
    }

    const requests = (data || []).map((t: any) => {
      const ref = (t?.reference_links || {}) as any;
      const req = (ref?.request || {}) as any;
      const stageKey = String(t?.column?.stage_key || '').toLowerCase();
      const employeeRequestId = String(ref?.employee_request_id || '').trim() || null;
      const dbStatus = employeeRequestId ? requestStatusMap.get(employeeRequestId) : null;
      const status: any =
        String(dbStatus?.status || '').trim() ||
        String(req?.status || '').trim() ||
        (stageKey.includes('final') ? 'approved' : stageKey.includes('bloq') ? 'rejected' : 'pending');

      return {
        id: String(t.id),
        type: String(req?.type || ''),
        start_date: req?.start_date || null,
        end_date: req?.end_date || null,
        reason: req?.reason || null,
        amount: req?.amount || null,
        attachments: Array.isArray(req?.attachments) ? req.attachments : [],
        status,
        employee_request_id: employeeRequestId,
        requester_name: wantAll ? (nameByUserId.get(String(t?.created_by || '')) || null) : undefined,
        created_at: t.created_at,
        title: String(t.title || ''),
      };
    });

    return NextResponse.json({ success: true, requests, total: requests.length });
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = getServiceSupabase();
    if (!service) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor' }, { status: 500 });
    }

    const body = await request.json().catch(() => null);
    const type = String(body?.type || '').trim() as RequestType;
    const start_date = body?.start_date ? String(body.start_date) : '';
    const end_date = body?.end_date ? String(body.end_date) : null;
    const reason = String(body?.reason || '').trim();
    const amount = body?.amount != null ? String(body.amount) : null;
    const attachments = Array.isArray(body?.attachments) ? body.attachments : [];

    if (!type || !start_date || !reason) {
      return NextResponse.json({ error: 'Campos obrigatórios: type, start_date, reason' }, { status: 400 });
    }

    // Validar que é colaborador (ou admin)
    const admin = await isAdminUser(service, user.id);
    let employeeId: string | null = null;
    if (!admin) {
      const { data: emp } = await service.from('employees').select('id, is_active, full_name').eq('user_id', user.id).maybeSingle();
      if (!emp?.id) return NextResponse.json({ error: 'Acesso negado (colaborador)' }, { status: 403 });
      employeeId = String(emp.id);
    } else {
      const { data: emp } = await service.from('employees').select('id, is_active, full_name').eq('user_id', user.id).maybeSingle();
      employeeId = emp?.id ? String(emp.id) : null;
    }

    // Criar como tarefa no Kanban de RH (coluna Demanda)
    let areaKey: AreaKey = 'rh';
    let board = await service.from('kanban_boards').select('id, area_key, name').eq('area_key', areaKey).maybeSingle();
    if (!board?.data?.id) {
      areaKey = 'operacao';
      board = await service.from('kanban_boards').select('id, area_key, name').eq('area_key', areaKey).maybeSingle();
    }
    if (!board?.data?.id) return NextResponse.json({ error: 'Board de RH/Operação não encontrado' }, { status: 500 });

    const { data: demandCol } = await service
      .from('kanban_columns')
      .select('id, stage_key')
      .eq('board_id', board.data.id)
      .eq('stage_key', 'demanda')
      .maybeSingle();
    if (!demandCol?.id) return NextResponse.json({ error: 'Coluna "Demanda" não encontrada no board de destino' }, { status: 500 });

    // Próxima posição
    const { data: last } = await service
      .from('kanban_tasks')
      .select('position')
      .eq('board_id', board.data.id)
      .eq('column_id', demandCol.id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPosition = Number((last as any)?.position || 0) + 1;

    const now = new Date().toISOString();
    const title = `Solicitação (${requestTypeLabel(type)}): ${start_date}${end_date ? ` → ${end_date}` : ''}`;

    const { data: created, error: insErr } = await service
      .from('kanban_tasks')
      .insert({
        board_id: board.data.id,
        column_id: demandCol.id,
        title,
        description: reason,
        priority: type === 'refund' ? 'high' : 'medium',
        status: 'todo',
        tags: Array.from(new Set(['solicitacao', 'colaborador', type])),
        due_date: start_date || null,
        client_id: null,
        area: areaKey,
        reference_links: {
          source: 'employee_request',
          request: {
            type,
            start_date,
            end_date,
            reason,
            amount,
            attachments,
            status: 'pending',
          },
          created_at: now,
        },
        assigned_to: null,
        created_by: user.id,
        position: nextPosition,
        updated_at: now,
      })
      .select('id, title, created_at, reference_links')
      .single();

    if (insErr || !created) {
      return NextResponse.json({ error: insErr?.message || 'Falha ao criar solicitação' }, { status: 500 });
    }

    // Persistir também em employee_requests (para aprovação/auditoria) quando possível
    const employeeRequestId =
      employeeId
        ? await createEmployeeRequest({
            service,
            employeeId,
            type,
            startDate: start_date,
            endDate: end_date,
            reason,
            amount,
          })
        : null;

    if (employeeRequestId) {
      try {
        const ref = ((created as any).reference_links || {}) as any;
        await service
          .from('kanban_tasks')
          .update({
            reference_links: {
              ...ref,
              employee_request_id: employeeRequestId,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', (created as any).id);
      } catch {
        // ignore
      }
    }

    // Notificar RH/Admin (intranet) — best-effort
    try {
      await notifyAreaUsers({
        area: 'rh',
        title: 'Nova solicitação de colaborador',
        message: `${requestTypeLabel(type)} • ${start_date}${end_date ? ` → ${end_date}` : ''}`,
        link: '/admin/solicitacoes',
        metadata: { source: 'employee_request', task_id: String((created as any).id), employee_request_id: employeeRequestId || null },
        type: 'request',
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitação criada com sucesso',
      request: {
        id: String((created as any).id),
        title: String((created as any).title || title),
        type,
        start_date,
        end_date,
        reason,
        amount,
        attachments,
        status: 'pending',
        employee_request_id: employeeRequestId,
        created_at: (created as any).created_at,
      },
      target: { area_key: areaKey, board_id: board.data.id, column_id: demandCol.id, board_label: getAreaBoard(areaKey).label },
    });
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = getServiceSupabase();
    if (!service) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor' }, { status: 500 });
    }

    const admin = await isAdminUser(service, user.id);
    if (!admin) return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });

    const body = await request.json().catch(() => null);
    const task_id = String(body?.task_id || '').trim();
    const status = String(body?.status || '').trim() as 'approved' | 'rejected';
    const rejection_reason = String(body?.rejection_reason || '').trim() || null;

    if (!task_id || !status) return NextResponse.json({ error: 'Campos obrigatórios: task_id, status' }, { status: 400 });
    if (status === 'rejected' && (!rejection_reason || rejection_reason.length < 10)) {
      return NextResponse.json({ error: 'Motivo da rejeição deve ter pelo menos 10 caracteres' }, { status: 400 });
    }

    // Buscar tarefa
    const { data: task, error: taskErr } = await service
      .from('kanban_tasks')
      .select('id, created_by, reference_links')
      .eq('id', task_id)
      .maybeSingle();
    if (taskErr || !task?.id) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });

    const ref = (task.reference_links || {}) as any;
    if (String(ref?.source || '') !== 'employee_request') {
      return NextResponse.json({ error: 'Este card não é uma solicitação de colaborador' }, { status: 400 });
    }

    // Garantir employee_request_id (cria se não existir, usando dados do card)
    let employeeRequestId: string | null = String(ref?.employee_request_id || '').trim() || null;
    if (!employeeRequestId) {
      const { data: emp } = await service.from('employees').select('id').eq('user_id', task.created_by).maybeSingle();
      const employeeId = emp?.id ? String(emp.id) : null;
      const req = (ref?.request || {}) as any;
      if (employeeId) {
        employeeRequestId = await createEmployeeRequest({
          service,
          employeeId,
          type: (String(req?.type || 'other') as RequestType),
          startDate: String(req?.start_date || ''),
          endDate: req?.end_date ? String(req.end_date) : null,
          reason: String(req?.reason || ''),
          amount: req?.amount != null ? String(req.amount) : null,
        });
      }
    }

    // Atualizar employee_requests (se existir)
    if (employeeRequestId) {
      const patch: any =
        status === 'approved'
          ? { status: 'approved', approved_by: user.id, approved_at: new Date().toISOString(), rejection_reason: null }
          : { status: 'rejected', approved_by: user.id, approved_at: new Date().toISOString(), rejection_reason };

      await service.from('employee_requests').update(patch).eq('id', employeeRequestId);
    }

    // Atualizar referência do card (fonte de verdade pro front)
    const newRef = {
      ...ref,
      employee_request_id: employeeRequestId,
      request: {
        ...(ref?.request || {}),
        status,
        rejection_reason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      },
    };

    await service
      .from('kanban_tasks')
      .update({ reference_links: newRef, updated_at: new Date().toISOString() })
      .eq('id', task_id);

    // Notificar solicitante (intranet) — best-effort
    try {
      await service.from('notifications').insert({
        user_id: String(task.created_by),
        title: status === 'approved' ? 'Solicitação aprovada' : 'Solicitação rejeitada',
        message:
          status === 'approved'
            ? 'Sua solicitação foi aprovada.'
            : `Sua solicitação foi rejeitada. Motivo: ${rejection_reason}`,
        type: 'request',
        is_read: false,
        link: '/colaborador/solicitacoes',
        metadata: { source: 'employee_request', task_id, employee_request_id: employeeRequestId },
        created_at: new Date().toISOString(),
      });
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, task_id, employee_request_id: employeeRequestId, status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update request' }, { status: 500 });
  }
}


