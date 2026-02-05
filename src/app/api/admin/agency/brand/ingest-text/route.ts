import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { ingestText } from '@/lib/agency/brandMemory';

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
  const content = String(body?.content || '').trim();

  if (!clientId) return NextResponse.json({ success: false, error: 'client_id é obrigatório' }, { status: 400 });
  if (!content) return NextResponse.json({ success: false, error: 'content é obrigatório' }, { status: 400 });

  try {
    const result = await ingestText({
      clientId,
      title: body.title || null,
      content,
      sourceType: body.source_type || 'manual',
      sourceRef: body.source_ref || null,
      createdByUserId: gate.userId,
      metadata: body.metadata || {},
    });

    return NextResponse.json({
      success: true,
      document_id: result.documentId,
      chunks_created: result.chunksCreated,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || 'Falha ao ingerir texto') }, { status: 500 });
  }
}
