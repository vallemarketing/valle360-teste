import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const gate = await requireAdmin(_request);
  if (!gate.ok) return gate.res;

  const params = await (ctx.params as any);
  const id = String(params?.id || '').trim();
  if (!id || !isUuid(id)) return NextResponse.json({ success: false, error: 'id inválido' }, { status: 400 });

  const admin = getSupabaseAdmin();
  try {
    const { error } = await admin.from('ai_executive_knowledge').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || 'Falha ao excluir') }, { status: 400 });
  }
}

