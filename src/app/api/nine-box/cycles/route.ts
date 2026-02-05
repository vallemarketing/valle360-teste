import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';

export const dynamic = 'force-dynamic';

const CreateCycleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
  ai_enabled: z.boolean().optional(),
  config: z.record(z.string(), z.any()).optional(),
});

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const { data, error } = await supabase
      .from('nine_box_cycles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return NextResponse.json({ success: true, cycles: data || [] });
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

    const body = CreateCycleSchema.parse(await request.json());

    const { data, error } = await supabase
      .from('nine_box_cycles')
      .insert({
        name: body.name,
        description: body.description || null,
        starts_at: body.starts_at || null,
        ends_at: body.ends_at || null,
        ai_enabled: body.ai_enabled ?? true,
        config: body.config || {},
        created_by: access.userId,
      } as any)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, cycle: data });
  } catch (e: any) {
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Payload inválido', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


