import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { sendWhatsAppMessage } from '@/lib/integrations/whatsapp';

export const dynamic = 'force-dynamic';

function isConfigured() {
  return Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
}

/**
 * POST /api/admin/outbound/whatsapp
 * body: { toPhone, text }
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  if (!isConfigured()) {
    return NextResponse.json(
      { success: false, configured: false, error: 'WhatsApp não configurado (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN)' },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const toPhone = String(body?.toPhone || '').trim();
  const text = String(body?.text || '').trim();

  if (!toPhone) return NextResponse.json({ success: false, error: 'toPhone é obrigatório' }, { status: 400 });
  if (!text) return NextResponse.json({ success: false, error: 'text é obrigatório' }, { status: 400 });

  const resp = await sendWhatsAppMessage({
    to: toPhone,
    type: 'text',
    text: text
  });
  
  if (!resp.success) {
    return NextResponse.json({ success: false, configured: true, error: resp.error || 'Falha ao enviar WhatsApp' }, { status: 502 });
  }

  return NextResponse.json({ success: true, configured: true, messageId: resp.messageId || null });
}




