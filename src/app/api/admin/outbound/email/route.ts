import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { sendEmailWithFallback } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/outbound/email
 * body: { toEmail, toName?, subject, html?, text? }
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido (JSON)' }, { status: 400 });
  }

  const toEmail = String(body?.toEmail || '').trim();
  const toName = body?.toName ? String(body.toName) : undefined;
  const subject = String(body?.subject || '').trim();
  const html = body?.html ? String(body.html) : undefined;
  const text = body?.text ? String(body.text) : undefined;

  if (!toEmail) return NextResponse.json({ success: false, error: 'toEmail é obrigatório' }, { status: 400 });
  if (!subject) return NextResponse.json({ success: false, error: 'subject é obrigatório' }, { status: 400 });
  if (!html && !text) return NextResponse.json({ success: false, error: 'html ou text é obrigatório' }, { status: 400 });

  const resp = await sendEmailWithFallback({
    to: toEmail,
    subject,
    html,
    text,
  });

  if (!resp.success) {
    return NextResponse.json({ success: false, configured: true, error: resp.error || 'Falha ao preparar email' }, { status: 502 });
  }

  return NextResponse.json({ success: true, configured: true, provider: resp.provider, mailtoUrl: resp.mailtoUrl });
}




