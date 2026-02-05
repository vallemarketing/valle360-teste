'use client';

import { useEffect, useMemo } from 'react';

export default function CallbackClient(props: { platform: string; ok: boolean; error?: string }) {
  const payload = useMemo(
    () => ({ type: 'oauth_connected', platform: props.platform, ok: props.ok, error: props.error || '' }),
    [props.platform, props.ok, props.error]
  );

  useEffect(() => {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, window.location.origin);
        const t = setTimeout(() => {
          try {
            window.close();
          } catch {
            // ignore
          }
        }, 200);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore
    }

    // Fluxo sem popup (mesma aba): voltar para /cliente/redes com status
    const t = setTimeout(() => {
      try {
        const url = new URL('/cliente/redes', window.location.origin);
        url.searchParams.set('connected', '1');
        url.searchParams.set('platform', props.platform || 'rede');
        url.searchParams.set('ok', props.ok ? '1' : '0');
        if (props.error) url.searchParams.set('error', props.error);
        window.location.assign(url.toString());
      } catch {
        // ignore
      }
    }, 50);
    return () => clearTimeout(t);
  }, [payload]);

  return null;
}


