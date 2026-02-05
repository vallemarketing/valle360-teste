import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { normalizeExecutiveRole } from '@/lib/csuite/executiveTypes';

export const dynamic = 'force-dynamic';

function clampInt(v: any, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function parseJsonValue(input: any): any {
  if (input == null) return {};
  if (typeof input === 'object') return input;
  const s = String(input).trim();
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    return { text: s };
  }
}

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const url = new URL(request.url);
  const roleRaw = url.searchParams.get('role');
  const execIdRaw = url.searchParams.get('executive_id');
  const q = (url.searchParams.get('q') || '').trim();
  const knowledgeType = (url.searchParams.get('knowledge_type') || '').trim();
  const category = (url.searchParams.get('category') || '').trim();
  const limit = clampInt(url.searchParams.get('limit'), 5, 100, 30);

  const admin = getSupabaseAdmin();

  try {
    let executiveId: string | null = execIdRaw && isUuid(execIdRaw) ? execIdRaw : null;
    const role = roleRaw ? normalizeExecutiveRole(roleRaw) : null;
    if (!executiveId && role) {
      const { data: exec } = await admin.from('ai_executives').select('id').eq('role', role).maybeSingle();
      executiveId = exec?.id ? String(exec.id) : null;
    }

    let query = admin
      .from('ai_executive_knowledge')
      .select(
        'id, executive_id, knowledge_type, category, key, value, confidence, source, source_id, valid_from, valid_until, times_referenced, created_at, updated_at, executive:ai_executives(role,name,title)'
      )
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (executiveId) query = query.eq('executive_id', executiveId);
    if (knowledgeType) query = query.eq('knowledge_type', knowledgeType);
    if (category) query = query.eq('category', category);

    if (q) {
      // busca simples (admin-only): key e category
      const safe = q.replace(/[,]/g, ' ').slice(0, 60);
      query = query.or(`key.ilike.%${safe}%,category.ilike.%${safe}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, items: data || [] });
  } catch (e: any) {
    return NextResponse.json({ success: true, items: [], warning: String(e?.message || '') }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const role = body?.role != null ? normalizeExecutiveRole(String(body.role)) : null;
  const executiveId = body?.executive_id != null ? String(body.executive_id) : null;
  const knowledgeType = String(body?.knowledge_type || '').trim();
  const key = String(body?.key || '').trim();
  const category = body?.category != null ? String(body.category).trim() : null;
  const confidence = body?.confidence != null ? Number(body.confidence) : null;
  const source = body?.source != null ? String(body.source).trim() : null;
  const sourceId = body?.source_id != null ? String(body.source_id).trim() : null;
  const validUntil = body?.valid_until != null ? String(body.valid_until).trim() : null;
  const value = parseJsonValue(body?.value ?? body?.value_json ?? body?.text);

  if (!knowledgeType) return NextResponse.json({ success: false, error: 'knowledge_type é obrigatório' }, { status: 400 });
  if (!key) return NextResponse.json({ success: false, error: 'key é obrigatório' }, { status: 400 });

  const admin = getSupabaseAdmin();

  try {
    let execId = executiveId && isUuid(executiveId) ? executiveId : null;
    if (!execId && role) {
      const { data: exec } = await admin.from('ai_executives').select('id').eq('role', role).maybeSingle();
      execId = exec?.id ? String(exec.id) : null;
    }
    if (!execId) return NextResponse.json({ success: false, error: 'executive_id/role inválido' }, { status: 400 });

    const row: any = {
      executive_id: execId,
      knowledge_type: knowledgeType,
      category: category || null,
      key,
      value,
      confidence: Number.isFinite(confidence as any) ? confidence : null,
      source: source || null,
      source_id: sourceId && isUuid(sourceId) ? sourceId : null,
      valid_until: validUntil || null,
    };

    const { data, error } = await admin
      .from('ai_executive_knowledge')
      .upsert(row, { onConflict: 'executive_id,knowledge_type,key' })
      .select(
        'id, executive_id, knowledge_type, category, key, value, confidence, source, source_id, valid_from, valid_until, times_referenced, created_at, updated_at, executive:ai_executives(role,name,title)'
      )
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || 'Falha ao salvar') }, { status: 400 });
  }
}

