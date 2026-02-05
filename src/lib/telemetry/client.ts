'use client';

type TelemetryLevel = 'info' | 'warn' | 'error';

export async function trackEvent(
  name: string,
  opts?: {
    level?: TelemetryLevel;
    message?: string;
    data?: unknown;
    path?: string;
    requestId?: string;
  }
) {
  try {
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        level: opts?.level || 'info',
        message: opts?.message,
        data: opts?.data,
        path: opts?.path,
        requestId: opts?.requestId,
        ts: new Date().toISOString(),
      }),
    });
  } catch {
    // ignore
  }
}


