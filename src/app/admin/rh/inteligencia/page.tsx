'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Brain } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

export default function AdminRhInteligenciaPage() {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<any | null>(null);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const load = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/rh/intelligence/summary', { headers, cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao carregar RH Inteligência');
      setPayload(data);
    } catch {
      setPayload(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = payload?.totals || null;
  const insights = Array.isArray(payload?.insights) ? payload.insights : [];

  const hasAnyData = useMemo(() => {
    if (!totals) return false;
    return (
      Number(totals.employees_active || 0) > 0 ||
      Number(totals.requests_pending || 0) > 0 ||
      Number(totals.requests_approved_this_month || 0) > 0 ||
      Number(totals.goals_active || 0) > 0
    );
  }, [totals]);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">RH Inteligência</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Removemos dados simulados. Este módulo será conectado a dados reais de colaboradores, desempenho e metas.
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Carregando inteligência de RH…
              </span>
            </div>
          ) : !hasAnyData ? (
            <EmptyState
              type="users"
              title="RH (sem mock)"
              description="Ainda não há dados suficientes (ou o schema de RH/metas não foi aplicado). Assim que houver dados reais, exibiremos KPIs e recomendações aqui."
              animated={false}
              action={{ label: 'Abrir Solicitações', onClick: () => (window.location.href = '/admin/solicitacoes') }}
              secondaryAction={{ label: 'Abrir Prontidão', onClick: () => (window.location.href = '/admin/prontidao') }}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Atualizado em: <span className="font-medium">{String(payload?.as_of || '').slice(0, 19).replace('T', ' ')}</span>
                </div>
                <Button variant="outline" onClick={load}>
                  Atualizar
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <Card style={{ borderColor: 'var(--border-light)' }}>
                  <CardHeader>
                    <CardTitle className="text-sm">Colaboradores ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Number(totals?.employees_active || 0)}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Fonte: employees
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ borderColor: 'var(--border-light)' }}>
                  <CardHeader>
                    <CardTitle className="text-sm">Solicitações pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Number(totals?.requests_pending || 0)}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Fonte: Kanban (RH/Operação)
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ borderColor: 'var(--border-light)' }}>
                  <CardHeader>
                    <CardTitle className="text-sm">Metas em risco</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Number(totals?.goals_at_risk || 0)}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Atraso vs. esperado
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ borderColor: 'var(--border-light)' }}>
                  <CardHeader>
                    <CardTitle className="text-sm">Progresso médio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Number(totals?.goals_avg_progress || 0)}%</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Metas ativas
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Recomendações (baseado em dados reais)
                  </div>
                  <Link href="/admin/metas" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
                    Central de Metas
                  </Link>
                </div>

                <div className="space-y-2">
                  {insights.map((it: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-xl border p-4 flex items-start justify-between gap-3"
                      style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {String(it?.title || 'Insight')}
                          </div>
                          <Badge
                            className={
                              it?.severity === 'critical'
                                ? 'bg-red-500/10 text-red-600 border-red-500/30'
                                : it?.severity === 'warning'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                  : it?.severity === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                    : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                            }
                          >
                            {String(it?.severity || 'info')}
                          </Badge>
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {String(it?.message || '')}
                        </div>
                      </div>

                      {it?.href ? (
                        <Link href={String(it.href)} className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
                          Abrir
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <Link href="/admin/colaboradores" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
              Ir para Colaboradores
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


