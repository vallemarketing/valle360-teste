import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { searchBrandMemory } from '@/lib/agency/brandMemory';

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
  const query = String(body?.query || '').trim();

  if (!clientId) return NextResponse.json({ success: false, error: 'client_id é obrigatório' }, { status: 400 });
  if (!query) return NextResponse.json({ success: false, error: 'query é obrigatório' }, { status: 400 });

  try {
    const result = await searchBrandMemory({
      clientId,
      query,
      matchCount: body.match_count ?? 8,
      similarityThreshold: body.similarity_threshold ?? 0.7,
    });

    return NextResponse.json({
      success: true,
      matches: result.matches,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || 'Falha na busca') }, { status: 500 });
  }
}
