'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ExecutiveRole } from '@/lib/csuite/executiveTypes';

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export function useCsuiteInsights(role: ExecutiveRole) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/csuite/insights?role=${encodeURIComponent(role)}`, { headers });
      const json = await res.json().catch(() => null);
      setInsights(Array.isArray(json?.insights) ? json.insights : []);
    } catch (e: any) {
      setError(String(e?.message || 'Falha ao carregar insights'));
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return { loading, insights, error, reload: load };
}

export function useCsuiteDrafts(role: ExecutiveRole) {
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/csuite/actions/drafts?role=${encodeURIComponent(role)}`, { headers });
      const json = await res.json().catch(() => null);
      setDrafts(Array.isArray(json?.drafts) ? json.drafts : []);
    } catch (e: any) {
      setError(String(e?.message || 'Falha ao carregar rascunhos'));
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return { loading, drafts, error, reload: load };
}

export function useCsuiteActions() {
  const [workingId, setWorkingId] = useState<string | null>(null);

  const draftFromInsight = async (params: {
    role: ExecutiveRole;
    source_insight_id: string;
    action: any;
  }) => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/csuite/actions/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        role: params.role,
        source_insight_id: params.source_insight_id,
        action_type: String(params.action?.action_type || 'create_kanban_task'),
        payload: params.action?.payload || {},
        risk_level: params.action?.risk_level || 'medium',
        preview: { label: params.action?.label || null },
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao criar rascunho');
    return json?.draft;
  };

  const confirmDraft = async (draftId: string) => {
    setWorkingId(draftId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/csuite/actions/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ draft_id: draftId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao executar');
      return json;
    } finally {
      setWorkingId(null);
    }
  };

  return useMemo(() => ({ workingId, draftFromInsight, confirmDraft }), [workingId]);
}

