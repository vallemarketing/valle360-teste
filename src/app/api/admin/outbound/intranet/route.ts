import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/outbound/intranet
 * Envia mensagem interna (chat) para um cliente via direct messages.
 * body: { clientId, text }
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const clientId = String(body?.clientId || '').trim();
  const text = String(body?.text || '').trim();
  if (!clientId) return NextResponse.json({ success: false, error: 'clientId é obrigatório' }, { status: 400 });
  if (!text) return NextResponse.json({ success: false, error: 'text é obrigatório' }, { status: 400 });

  // Resolve auth user_id do cliente
  const admin = getSupabaseAdmin();
  const { data: clientRow, error: clientErr } = await admin
    .from('clients')
    .select('id, user_id, company_name, contact_name')
    .eq('id', clientId)
    .maybeSingle();

  if (clientErr) return NextResponse.json({ success: false, error: clientErr.message }, { status: 500 });
  const clientUserId = clientRow?.user_id ? String(clientRow.user_id) : null;
  if (!clientUserId) {
    return NextResponse.json(
      { success: false, error: 'Cliente não tem user_id vinculado (clients.user_id). Não é possível enviar mensagem via intranet.' },
      { status: 400 }
    );
  }

  // Envio como usuário admin autenticado (respeitando RLS)
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Cria/obtém conversa direta (função SECURITY DEFINER)
  const { data: conversationId, error: convErr } = await supabase.rpc('get_or_create_direct_conversation', {
    p_user_id_1: gate.userId,
    p_user_id_2: clientUserId,
    p_is_client_conversation: true,
  });
  if (convErr || !conversationId) {
    return NextResponse.json({ success: false, error: convErr?.message || 'Falha ao criar conversa' }, { status: 500 });
  }

  const { data: msg, error: msgErr } = await supabase
    .from('direct_messages')
    .insert({
      conversation_id: conversationId,
      from_user_id: gate.userId,
      body: text,
      message_type: 'text',
    })
    .select('id, conversation_id, created_at')
    .single();

  if (msgErr || !msg) {
    return NextResponse.json({ success: false, error: msgErr?.message || 'Falha ao enviar mensagem' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    conversation_id: String(msg.conversation_id),
    message_id: String(msg.id),
    created_at: msg.created_at,
  });
}




