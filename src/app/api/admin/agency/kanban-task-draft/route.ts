import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const clientId = String(body?.client_id || '').trim();
  const title = String(body?.title || '').trim();

  if (!clientId) return NextResponse.json({ success: false, error: 'client_id é obrigatório' }, { status: 400 });
  if (!title) return NextResponse.json({ success: false, error: 'title é obrigatório' }, { status: 400 });

  try {
    const supabase = getSupabaseAdmin();

    // Resolve executive_id by role (default: coo)
    const role = String(body?.executive_role || 'coo').toLowerCase();
    const { data: execData } = await supabase
      .from('ai_executives')
      .select('id')
      .eq('role', role)
      .limit(1)
      .single();
    const execId = execData?.id || null;

    const payload = {
      title,
      description: body?.description || null,
      priority: body?.priority || 'medium',
      due_date: body?.due_date || null,
      metadata: {
        client_id: clientId,
        area_key: body?.area_key || null,
        stage_key: body?.stage_key || null,
        source: 'agency_api',
      },
    };

    const preview = {
      label: 'Criar tarefa no Kanban',
      description: title,
    };

    const { data: draftData, error: draftError } = await supabase
      .from('ai_executive_action_drafts')
      .insert({
        executive_id: execId,
        created_by_user_id: gate.userId,
        action_type: 'create_kanban_task',
        action_payload: payload,
        preview,
        risk_level: 'low',
        requires_external: false,
        is_executable: true,
        status: 'draft',
      })
      .select('id')
      .single();

    if (draftError || !draftData?.id) {
      throw new Error(`Falha ao criar draft: ${draftError?.message}`);
    }

    return NextResponse.json({ success: true, draft_id: String(draftData.id) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || 'Falha') }, { status: 500 });
  }
}
