import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';

export const dynamic = 'force-dynamic';

const UpdateCycleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
  status: z.enum(['draft', 'open', 'closed']).optional(),
  ai_enabled: z.boolean().optional(),
  config: z.record(z.string(), z.any()).optional(),
});

export async function GET(_: NextRequest, ctx: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const id = String(ctx.params.id);
    const { data, error } = await supabase.from('nine_box_cycles').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, cycle: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const id = String(ctx.params.id);
    const body = UpdateCycleSchema.parse(await request.json());

    // regra: se fechou, não reabrir via PUT (usar endpoint dedicado se quiser no futuro)
    const { data: existing } = await supabase.from('nine_box_cycles').select('status').eq('id', id).maybeSingle();
    if (!existing) return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 });
    if (existing.status === 'closed' && body.status && body.status !== 'closed') {
      return NextResponse.json({ error: 'Ciclo fechado não pode ser reaberto' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('nine_box_cycles')
      .update({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.starts_at !== undefined ? { starts_at: body.starts_at } : {}),
        ...(body.ends_at !== undefined ? { ends_at: body.ends_at } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.ai_enabled !== undefined ? { ai_enabled: body.ai_enabled } : {}),
        ...(body.config !== undefined ? { config: body.config } : {}),
      } as any)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, cycle: data });
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
    const { data: existing, error: fetchErr } = await supabase.from('nine_box_cycles').select('status').eq('id', id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 });
    if (existing.status === 'closed') return NextResponse.json({ error: 'Ciclo fechado não pode ser excluído' }, { status: 400 });

    const { error } = await supabase.from('nine_box_cycles').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


