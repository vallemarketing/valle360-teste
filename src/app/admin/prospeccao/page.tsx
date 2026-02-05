'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, RefreshCw, Search, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

type LeadRow = {
  id: string;
  company_name: string;
  segment?: string | null;
  status?: string | null;
  qualification_score?: number | null;
  source?: string | null;
  created_at?: string | null;
};

export default function AdminProspeccaoPage() {
  const [items, setItems] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [runLoading, setRunLoading] = useState(false);
  const [segment, setSegment] = useState('ecommerce');
  const [location, setLocation] = useState('');
  const [keywords, setKeywords] = useState('');
  const [limit, setLimit] = useState(10);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/prospecting');
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao carregar leads');
      setItems((data.data || []) as LeadRow[]);
      setNote(data?.note ? String(data.note) : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar');
      setNote(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async () => {
    const seg = segment.trim();
    if (!seg) return;
    setRunLoading(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch('/api/prospecting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          segment: seg,
          location: location.trim() || undefined,
          keywords: keywords.trim() || undefined,
          limit,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao buscar leads');
      setNote(
        `Busca concluída: encontrados ${Number(data?.found || 0)}, criados ${Number(data?.created || 0)}, atualizados ${Number(data?.updated || 0)}.` +
          (data?.note ? ` ${String(data.note)}` : '')
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao buscar leads');
    } finally {
      setRunLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return (items || []).filter((x) => {
      const hay = [x.company_name, x.segment, x.status, x.source].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(term);
    });
  }, [items, q]);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Prospecção</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Sem mocks: este painel só exibe leads reais salvos em <code>prospecting_leads</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/integracoes/n8n"
              className="px-4 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            >
              Conectar N8N/CRM
            </Link>
            <button
              onClick={load}
              className="px-4 py-2 rounded-xl border text-sm flex items-center gap-2"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            >
              <RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
              Atualizar
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl border p-4 flex items-center gap-2"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <Search className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar leads…"
            className="w-full bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <div
          className="rounded-2xl border p-4 space-y-3"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Buscar leads (sem mock)
            </div>
            <button
              onClick={runSearch}
              disabled={runLoading || !segment.trim()}
              className="px-4 py-2 rounded-xl border text-sm flex items-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              title={!segment.trim() ? 'Informe o segmento' : undefined}
            >
              <Sparkles className={runLoading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
              {runLoading ? 'Buscando…' : 'Buscar agora'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-1">
              <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Segmento *
              </div>
              <input
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                placeholder="ecommerce, clinica, restaurante…"
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="md:col-span-1">
              <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Local (opcional)
              </div>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="SP, São Paulo…"
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="md:col-span-1">
              <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Keywords (opcional)
              </div>
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="contato, orçamento, site…"
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="md:col-span-1">
              <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Limite
              </div>
              <input
                value={String(limit)}
                onChange={(e) => setLimit(Math.max(1, Math.min(20, Number(e.target.value || 10))))}
                type="number"
                min={1}
                max={20}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {note ? (
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {note}
            </div>
          ) : null}
        </div>

        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          {loading ? (
            <div className="p-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Carregando…
            </div>
          ) : error ? (
            <div className="p-6">
              <EmptyState type="default" title="Falha ao carregar" description={error} animated={false} action={{ label: 'Tentar novamente', onClick: load }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                type="default"
                title="Nenhum lead ainda"
                description="A prospecção automática não cria mais leads falsos. Para gerar leads, conecte um provedor (N8N/CRM/Tavily) e grave em prospecting_leads."
                animated={false}
                action={{ label: 'Ir para Integrações (N8N)', onClick: () => (window.location.href = '/admin/integracoes/n8n') }}
              />
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
              {filtered.map((l) => (
                <div key={l.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {l.company_name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {l.segment ? `segmento: ${l.segment}` : 'segmento: -'} • {l.source ? `fonte: ${l.source}` : 'fonte: -'} •{' '}
                      {l.created_at ? `criado: ${String(l.created_at).slice(0, 10)}` : 'criado: -'}
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    score: {typeof l.qualification_score === 'number' ? l.qualification_score : '-'} • status: {l.status || '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


