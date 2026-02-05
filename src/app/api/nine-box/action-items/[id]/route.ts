import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';

export const dynamic = 'force-dynamic';

const UpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
  owner_user_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  status: z.enum(['open', 'in_progress', 'done', 'cancelled']).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function PUT(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const id = String(ctx.params.id);
    const body = UpdateSchema.parse(await request.json());

    const { data, error } = await supabase
      .from('nine_box_action_items')
      .update({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.owner_user_id !== undefined ? { owner_user_id: body.owner_user_id } : {}),
        ...(body.due_date !== undefined ? { due_date: body.due_date } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.metadata !== undefined ? { metadata: body.metadata } : {}),
      } as any)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (e: any) {
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Payload inválido', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, ctx: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const id = String(ctx.params.id);
    const { error } = await supabase.from('nine_box_action_items').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


