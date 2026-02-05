import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isMissingTableError(message: string) {
  const m = String(message || '').toLowerCase();
  return (
    m.includes('does not exist') ||
    m.includes('relation') ||
    m.includes('schema cache') ||
    m.includes('could not find the table')
  );
}

type JobStatus = 'draft' | 'active' | 'paused' | 'closed';

function normalizeStatus(v: any): JobStatus {
  const s = String(v || '').toLowerCase().trim();
  if (s === 'active' || s === 'paused' || s === 'closed') return s;
  return 'draft';
}

function mapRow(row: any) {
  return {
    id: String(row?.id || ''),
    title: String(row?.title || ''),
    department: row?.department ? String(row.department) : '',
    location: row?.location ? String(row.location) : '',
    locationType: row?.location_type ? String(row.location_type) : 'hybrid',
    contractType: row?.contract_type ? String(row.contract_type) : '',
    status: normalizeStatus(row?.status),
    applications: Number(row?.applications_count || 0),
    views: Number(row?.views_count || 0),
    createdAt: row?.created_at || null,
    publishedAt: row?.published_at || null,
    platforms: Array.isArray(row?.platforms) ? row.platforms : [],
    jobPost: row?.job_post || {},
  };
}

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const db = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get('q') || '').trim();
  const status = String(searchParams.get('status') || '').trim().toLowerCase();

  try {
    let query = db.from('job_openings').select('*').order('created_at', { ascending: false });

    if (status && ['draft', 'active', 'paused', 'closed'].includes(status)) {
      query = query.eq('status', status);
    }
    if (q) {
      // best effort search
      query = query.or(`title.ilike.%${q}%,department.ilike.%${q}%,location.ilike.%${q}%`);
    }

    const { data, error } = await query.limit(500);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      jobs: (data || []).map(mapRow),
    });
  } catch (e: any) {
    if (isMissingTableError(e?.message || '')) {
      return NextResponse.json({
        success: true,
        jobs: [],
        note: 'Tabela job_openings ainda não existe neste ambiente.',
      });
    }
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const db = getSupabaseAdmin();

  try {
    const body = await request.json().catch(() => null);
    const job = body?.job || body;

    const title = String(job?.title || '').trim();
    if (!title) return NextResponse.json({ success: false, error: 'title é obrigatório' }, { status: 400 });

    const status = normalizeStatus(job?.status);
    const platforms = Array.isArray(job?.platforms) ? job.platforms.map((x: any) => String(x)) : [];

    const row = {
      title,
      department: job?.department ? String(job.department) : null,
      location: job?.location ? String(job.location) : null,
      location_type: job?.locationType ? String(job.locationType) : null,
      contract_type: job?.contractType ? String(job.contractType) : null,
      status,
      platforms,
      applications_count: Number(job?.applications || 0) || 0,
      views_count: Number(job?.views || 0) || 0,
      published_at: status === 'active' ? new Date().toISOString() : null,
      job_post: job?.jobPost && typeof job.jobPost === 'object' ? job.jobPost : {},
      created_by: gate.userId,
    };

    const { data, error } = await db.from('job_openings').insert(row).select('*').single();
    if (error) throw error;

    return NextResponse.json({ success: true, job: mapRow(data) });
  } catch (e: any) {
    if (isMissingTableError(e?.message || '')) {
      return NextResponse.json(
        { success: false, error: 'Schema de vagas ainda não aplicado (job_openings).' },
        { status: 501 }
      );
    }
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const db = getSupabaseAdmin();

  try {
    const body = await request.json().catch(() => null);
    const id = String(body?.id || '').trim();
    if (!id) return NextResponse.json({ success: false, error: 'id é obrigatório' }, { status: 400 });

    const updates: any = {};
    if (body?.title != null) updates.title = String(body.title).trim();
    if (body?.department != null) updates.department = body.department ? String(body.department) : null;
    if (body?.location != null) updates.location = body.location ? String(body.location) : null;
    if (body?.locationType != null) updates.location_type = body.locationType ? String(body.locationType) : null;
    if (body?.contractType != null) updates.contract_type = body.contractType ? String(body.contractType) : null;
    if (body?.platforms != null) updates.platforms = Array.isArray(body.platforms) ? body.platforms.map((x: any) => String(x)) : [];
    if (body?.applications != null) updates.applications_count = Number(body.applications || 0) || 0;
    if (body?.views != null) updates.views_count = Number(body.views || 0) || 0;
    if (body?.jobPost != null) updates.job_post = body.jobPost && typeof body.jobPost === 'object' ? body.jobPost : {};

    if (body?.status != null) {
      const st = normalizeStatus(body.status);
      updates.status = st;
      if (st === 'active') updates.published_at = new Date().toISOString();
    }

    const { data, error } = await db.from('job_openings').update(updates).eq('id', id).select('*').single();
    if (error) throw error;

    return NextResponse.json({ success: true, job: mapRow(data) });
  } catch (e: any) {
    if (isMissingTableError(e?.message || '')) {
      return NextResponse.json(
        { success: false, error: 'Schema de vagas ainda não aplicado (job_openings).' },
        { status: 501 }
      );
    }
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const db = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get('id') || '').trim();
  if (!id) return NextResponse.json({ success: false, error: 'id é obrigatório' }, { status: 400 });

  try {
    const { error } = await db.from('job_openings').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (isMissingTableError(e?.message || '')) {
      return NextResponse.json(
        { success: false, error: 'Schema de vagas ainda não aplicado (job_openings).' },
        { status: 501 }
      );
    }
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}



