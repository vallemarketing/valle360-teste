import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

type TelemetryEvent = {
  name: string;
  level?: 'info' | 'warn' | 'error';
  message?: string;
  data?: unknown;
  path?: string;
  ts?: string;
  requestId?: string;
};

export async function POST(request: NextRequest) {
  const requestId =
    request.headers.get('x-vercel-id') ||
    request.headers.get('x-request-id') ||
    crypto.randomUUID();

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: auth } = await supabase.auth.getUser();

    // Telemetria é interna; se não estiver logado, ainda logamos no server (ajuda debugging).
    const userId = auth?.user?.id ?? null;

    const body = (await request.json()) as TelemetryEvent;
    const payload: TelemetryEvent = {
      name: body?.name || 'unknown',
      level: body?.level || 'info',
      message: body?.message,
      data: body?.data,
      path: body?.path || request.nextUrl.pathname,
      ts: body?.ts || new Date().toISOString(),
      requestId: body?.requestId || requestId,
    };

    const line = {
      ...payload,
      userId,
      userAgent: request.headers.get('user-agent'),
    };

    if (payload.level === 'error') console.error('[telemetry]', line);
    else if (payload.level === 'warn') console.warn('[telemetry]', line);
    else console.info('[telemetry]', line);

    // Opcional: tenta persistir se existir uma tabela de auditoria (falha silenciosa).
    try {
      await supabase.from('audit_logs').insert({
        action: payload.name,
        details: {
          ...payload,
          userAgent: request.headers.get('user-agent'),
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, requestId });
  } catch (error: any) {
    console.error('[telemetry] handler error', { requestId, error: error?.message });
    return NextResponse.json({ success: false, requestId }, { status: 200 });
  }
}


