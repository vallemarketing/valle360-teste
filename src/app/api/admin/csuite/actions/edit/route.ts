import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function PATCH(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const draftId = String(body?.draft_id || '').trim();
  if (!draftId || !isUuid(draftId)) {
    return NextResponse.json({ success: false, error: 'draft_id inválido' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Buscar o draft existente
  const { data: draft, error: draftErr } = await admin
    .from('ai_executive_action_drafts')
    .select('*')
    .eq('id', draftId)
    .maybeSingle();

  if (draftErr || !draft) {
    return NextResponse.json(
      { success: false, error: draftErr?.message || 'Draft não encontrado' },
      { status: 404 }
    );
  }

  const status = String(draft.status || '').toLowerCase();
  if (status !== 'draft') {
    return NextResponse.json(
      { success: false, error: `Draft não pode ser editado (status=${draft.status})` },
      { status: 400 }
    );
  }

  try {
    // Pegar o payload existente
    const currentPayload = (draft.action_payload || {}) as any;
    const currentMetadata = currentPayload?.metadata || {};

    // Atualizar campos que foram enviados
    const updates: any = {};

    // Atualizar title se enviado
    if (body.title !== undefined) {
      updates.title = String(body.title || '').trim();
    }

    // Atualizar description se enviado
    if (body.description !== undefined) {
      updates.description = String(body.description || '').trim();
    }

    // Atualizar metadata
    const metadataUpdates: any = {};
    
    if (body.hashtags !== undefined) {
      metadataUpdates.hashtags = Array.isArray(body.hashtags) 
        ? body.hashtags 
        : [];
    }

    if (body.cta !== undefined) {
      metadataUpdates.cta = String(body.cta || '').trim();
    }

    if (body.visualPrompt !== undefined) {
      metadataUpdates.visualPrompt = String(body.visualPrompt || '').trim();
    }

    if (body.selectedNetworks !== undefined) {
      metadataUpdates.selectedNetworks = Array.isArray(body.selectedNetworks)
        ? body.selectedNetworks
        : [];
    }

    if (body.scheduledAt !== undefined) {
      metadataUpdates.scheduledAt = body.scheduledAt;
    }

    // Mesclar com metadata existente
    const newMetadata = {
      ...currentMetadata,
      ...metadataUpdates,
    };

    // Criar novo payload
    const newPayload = {
      ...currentPayload,
      ...updates,
      metadata: newMetadata,
    };

    // Atualizar preview também
    const newPreview = {
      label: 'Criar tarefa no Kanban',
      description: updates.title || currentPayload.title || 'Conteúdo editado',
    };

    // Salvar no banco
    const { error: updateError } = await admin
      .from('ai_executive_action_drafts')
      .update({
        action_payload: newPayload,
        preview: newPreview,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId);

    if (updateError) {
      throw new Error(`Falha ao atualizar draft: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      draft_id: draftId,
      updated_payload: newPayload,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: String(e?.message || 'Falha ao editar draft') },
      { status: 500 }
    );
  }
}
