import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { publishMetaPost } from '@/lib/social/metaPublisher';
import { logCronRun, requireCronAuth } from '@/lib/cron/cronUtils';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

async function handleSocialPublishCron(request: NextRequest) {
  const started = Date.now();
  // GET: cron (Vercel); POST: admin manual. Mantemos o handler único e o auth é decidido no export.

  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  // Buscar posts meta agendados e aprovados
  const { data: posts, error } = await admin
    .from('instagram_posts')
    .select('*')
    .eq('backend', 'meta')
    .eq('status', 'scheduled')
    .eq('is_draft', false)
    .eq('approval_status', 'approved')
    .lte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(25);

  if (error) {
    await logCronRun({
      supabase: admin,
      action: 'social-publish',
      status: 'error',
      durationMs: Date.now() - started,
      errorMessage: error.message,
    });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  if (!posts || posts.length === 0) {
    await logCronRun({
      supabase: admin,
      action: 'social-publish',
      status: 'ok',
      durationMs: Date.now() - started,
      responseData: { processed: 0, published: 0, failed: 0 },
    });
    return NextResponse.json({ success: true, processed: 0, published: 0, failed: 0 });
  }

  let publishedCount = 0;
  let failedCount = 0;

  for (const p of posts) {
    // marca como "publishing" para evitar concorrência
    await admin.from('instagram_posts').update({ status: 'publishing' }).eq('id', p.id);

    const published = await publishMetaPost({ post: p });
    const nextStatus = published.ok ? 'published' : 'failed';

    await admin
      .from('instagram_posts')
      .update({
        status: nextStatus,
        published_at: published.ok ? new Date().toISOString() : null,
        error_message: published.ok ? null : published.error || 'Falha ao publicar',
        raw_payload: { ...(p as any)?.raw_payload, publish_results: published.results },
      } as any)
      .eq('id', p.id);

    if (published.ok) publishedCount++;
    else failedCount++;
  }

  await logCronRun({
    supabase: admin,
    action: 'social-publish',
    status: failedCount === 0 ? 'ok' : 'error',
    durationMs: Date.now() - started,
    responseData: { processed: posts.length, published: publishedCount, failed: failedCount },
    errorMessage: failedCount ? 'Falhas ao publicar' : null,
  });

  return NextResponse.json({ success: true, processed: posts.length, published: publishedCount, failed: failedCount });
}

export async function GET(request: NextRequest) {
  const auth = requireCronAuth(request);
  if (auth) return auth;
  return handleSocialPublishCron(request);
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;
  return handleSocialPublishCron(request);
}


