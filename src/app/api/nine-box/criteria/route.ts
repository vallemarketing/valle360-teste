import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { resolveNineBoxAccess } from '@/lib/rh/nineBoxAccess';

export const dynamic = 'force-dynamic';

const UpsertCriteriaSchema = z.object({
  cycle_id: z.string().uuid().optional().nullable(),
  axis: z.enum(['performance', 'potential']),
  key: z.string().min(1),
  label: z.string().min(2),
  description: z.string().optional().nullable(),
  weight: z.number().int().min(0).max(100),
  is_active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const access = await resolveNineBoxAccess({ supabase });
    if (!access.allowed) return NextResponse.json({ error: access.reason || 'Acesso negado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycle_id');
    const axis = searchParams.get('axis');

    // Regra: quando cycle_id existe, retornar critérios do ciclo + globais (cycle_id NULL)
    let q = supabase.from('nine_box_criteria').select('*').order('axis', { ascending: true }).order('weight', { ascending: false });
    if (axis) q = q.eq('axis', axis);

    if (cycleId) {
      q = q.or(`cycle_id.eq.${cycleId},cycle_id.is.null`);
    } else {
      q = q.is('cycle_id', null);
    }

    const { data, error } = await q.limit(500);
    if (error) throw error;

    return NextResponse.json({ success: true, criteria: data || [] });
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

    const raw = await request.json();
    const items = Array.isArray(raw) ? raw : raw?.criteria;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Envie criteria: []' }, { status: 400 });
    }

    const parsed = items.map((x) => UpsertCriteriaSchema.parse(x));

    const rows = parsed.map((c) => ({
      cycle_id: c.cycle_id || null,
      axis: c.axis,
      key: c.key,
      label: c.label,
      description: c.description || null,
      weight: c.weight,
      is_active: c.is_active ?? true,
    }));

    const { data, error } = await supabase
      .from('nine_box_criteria')
      .upsert(rows as any, { onConflict: 'cycle_id_norm,axis,key' })
      .select('*');

    if (error) throw error;
    return NextResponse.json({ success: true, criteria: data || [] });
  } catch (e: any) {
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Payload inválido', details: e.errors }, { status: 400 });
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


