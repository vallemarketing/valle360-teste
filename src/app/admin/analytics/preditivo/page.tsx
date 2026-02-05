'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Brain, RefreshCw, Play } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AdminPreditivoPage() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runningAlerts, setRunningAlerts] = useState(false);
  const [data, setData] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics/preditivo', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao carregar');
      setData(json);
    } catch (e: any) {
      setData(null);
      toast.error(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const s = data?.summary || {};
    const types = s.types || {};
    return {
      total: Number(s.latest_predictions || 0),
      riskyClients: Number(s.risky_clients || 0),
      highConfidence: Number(s.high_confidence_latest || 0),
      churn: Number(types.churn || 0),
      delay: Number(types.delay || 0),
      payment_risk: Number(types.payment_risk || 0),
      ltv: Number(types.ltv || 0),
      conversion: Number(types.conversion || 0),
      revenue: Number(types.revenue || 0),
      demand_capacity: Number(types.demand_capacity || 0),
      budget_overrun: Number(types.budget_overrun || 0),
    };
  }, [data]);

  const runMlNow = async () => {
    setRunning(true);
    try {
      toast.loading('Rodando pipeline ML…');
      const res = await fetch('/api/cron/ml', { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao rodar ML');
      toast.dismiss();
      toast.success('ML executado! Atualizando painel…');
      await load();
    } catch (e: any) {
      toast.dismiss();
      toast.error(String(e?.message || e));
    } finally {
      setRunning(false);
    }
  };

  const runAlertsNow = async () => {
    setRunningAlerts(true);
    try {
      toast.loading('Rodando alertas…');
      const res = await fetch('/api/cron/alerts', { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao rodar alertas');
      toast.dismiss();
      const count = Array.isArray(json?.triggered) ? json.triggered.length : 0;
      toast.success(`Alertas executados (${count})`);
      await load();
    } catch (e: any) {
      toast.dismiss();
      toast.error(String(e?.message || e));
    } finally {
      setRunningAlerts(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Analytics Preditivo</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Painel com dados reais: health score, churn, atrasos e logs de predição (sem mocks).
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={loading ? 'w-4 h-4 mr-2 animate-spin' : 'w-4 h-4 mr-2'} />
              Atualizar
            </Button>
            <Button className="bg-[#1672d6] hover:bg-[#1260b5]" onClick={runMlNow} disabled={running}>
              <Play className="w-4 h-4 mr-2" />
              Rodar ML agora
            </Button>
            <Button variant="outline" onClick={runAlertsNow} disabled={runningAlerts}>
              <Play className="w-4 h-4 mr-2" />
              Rodar alertas agora
            </Button>
          </div>
          <Link href="/admin/prontidao" className="text-sm underline" style={{ color: 'var(--primary-500)' }}>
            Ver Prontidão
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Previsões recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                alta confiança: {summary.highConfidence}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Clientes em risco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.riskyClients}</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                top 10 por churn probability
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tipos (amostra)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                churn: <b>{summary.churn}</b> • delay: <b>{summary.delay}</b> • pagamento: <b>{summary.payment_risk}</b> • LTV: <b>{summary.ltv}</b>
                <div className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  conversão: <b>{summary.conversion}</b> • receita: <b>{summary.revenue}</b> • demanda/cap.: <b>{summary.demand_capacity}</b> • budget: <b>{summary.budget_overrun}</b>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          {loading ? (
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Carregando…
            </div>
          ) : !data ? (
            <EmptyState
              type="default"
              title="Não foi possível carregar"
              description="Verifique permissões e integrações do Supabase/cron."
              animated={false}
              action={{ label: 'Tentar novamente', onClick: load }}
              secondaryAction={{ label: 'Ver Prontidão', onClick: () => (window.location.href = '/admin/prontidao') }}
            />
          ) : (data?.riskyClients || []).length === 0 && (data?.predictions || []).length === 0 ? (
            <EmptyState
              type="default"
              title="Sem dados preditivos ainda"
              description="Rode o pipeline ML para gerar health score e logs de predição (sem valores inventados)."
              animated={false}
              action={{ label: 'Rodar ML agora', onClick: runMlNow }}
              secondaryAction={{ label: 'Ver Prontidão', onClick: () => (window.location.href = '/admin/prontidao') }}
            />
          ) : (
            <div className="space-y-6">
              <div>
                <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Top clientes em risco (Health Score)
                </div>
                <div className="divide-y rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-light)' }}>
                  {(data?.riskyClients || []).slice(0, 10).map((c: any) => (
                    <div key={c.client_id} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {c.client_name || c.client_id}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          risco: {c.risk_level || '-'} • churn: {Math.round(Number(c.churn_probability || 0))}% • score: {Math.round(Number(c.overall_score || 0))}
                        </div>
                      </div>
                      <Link href="/admin/centro-inteligencia" className="text-xs underline" style={{ color: 'var(--primary-500)' }}>
                        Ações
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Últimas previsões (log)
                </div>
                <div className="divide-y rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-light)' }}>
                  {(data?.predictions || []).slice(0, 15).map((p: any) => (
                    <div key={p.id} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {p.type} • {p.target}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          conf: {Math.round(Number(p.probability || 0))}% • {String(p.predicted_at || '').slice(0, 19).replace('T', ' ')}
                        </div>
                        {p.value != null && (
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            valor: <b>{typeof p.value === 'number' ? Math.round(p.value) : String(p.value)}</b>
                            {p.entity_name ? ` • ${String(p.entity_name)}` : ''}
                          </div>
                        )}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {p.model_version || 'model'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


