import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  cycle_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  result_id: z.string().uuid().optional().nullable(),
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  owner_user_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(), // YYYY-MM-DD
  status: z.enum(['open', 'in_progress', 'done', 'cancelled']).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycle_id');
    const employeeId = searchParams.get('employee_id');

    let q = supabase.from('nine_box_action_items').select('*').order('created_at', { ascending: false });
    if (cycleId) q = q.eq('cycle_id', cycleId);
    if (employeeId) q = q.eq('employee_id', employeeId);

    const { data, error } = await q.limit(500);
    if (error) throw error;

    return NextResponse.json({ success: true, items: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const body = CreateSchema.parse(await request.json());

    const { data, error } = await supabase
      .from('nine_box_action_items')
      .insert({
        cycle_id: body.cycle_id,
        employee_id: body.employee_id,
        result_id: body.result_id || null,
        title: body.title,
        description: body.description || null,
        owner_user_id: body.owner_user_id || access.userId,
        due_date: body.due_date || null,
        status: body.status || 'open',
        metadata: body.metadata || {},
      } as any)
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (e: any) {
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Payload inválido', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


