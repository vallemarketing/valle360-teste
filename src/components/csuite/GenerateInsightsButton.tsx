'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { ExecutiveRole } from '@/lib/csuite/executiveTypes';
import { toast } from 'sonner';

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export function GenerateInsightsButton(props: { role: ExecutiveRole | 'all'; label?: string }) {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/csuite/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ role: props.role, include_market: props.role === 'cmo' || props.role === 'all' }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao gerar insights');
      toast.success(`Insights gerados: ${Number(json.created || 0)}`);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao gerar insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={run} disabled={loading} variant="outline">
      {loading ? 'Gerando…' : props.label || 'Gerar insights'}
    </Button>
  );
}

