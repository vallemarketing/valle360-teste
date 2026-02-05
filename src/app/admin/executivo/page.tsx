'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Brain, RefreshCw, ShieldAlert, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type ExecutiveSummary = {
  success: boolean;
  kpis: { totalClients: number; activeClients: number; pendingInvoices: number; mrr: number };
  highlights: Array<{
    id: string;
    type: string;
    label: string;
    value: number | null;
    confidence: number;
    predicted_at: string | null;
    href: string;
  }>;
  links: Record<string, string>;
};

export default function AdminExecutivoPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExecutiveSummary | null>(null);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/executive/summary', { headers });
      const json = (await res.json().catch(() => null)) as ExecutiveSummary | null;
      if (!res.ok || !json?.success) throw new Error((json as any)?.error || 'Falha ao carregar resumo executivo');
      setData(json);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao carregar resumo executivo');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const runNow = async (path: '/api/cron/ml' | '/api/cron/alerts', label: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(path, { method: 'POST', headers });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Falha ao executar ${label}`);
      toast.success(`${label} executado.`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || `Falha ao executar ${label}`);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = data?.kpis;
  const highlights = useMemo(() => (data?.highlights || []).slice(0, 6), [data]);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Executivo</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Snapshot unificado (complementar): KPIs + principais sinais do ML/preditivo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => load()} disabled={loading} className="gap-2">
              <RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
              Atualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis ? kpis.totalClients : '—'}</div>
              <div className="text-xs text-gray-600">{kpis ? `${kpis.activeClients} ativos` : ''}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">MRR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis ? `R$ ${kpis.mrr.toLocaleString('pt-BR')}` : '—'}</div>
              <div className="text-xs text-gray-600">Contratos ativos</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Faturas pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis ? kpis.pendingInvoices : '—'}</div>
              <div className="text-xs text-gray-600">Não pagas</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Acesso rápido</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link href={data?.links?.analytics || '/admin/analytics/preditivo'} className="text-sm text-blue-700 hover:underline">
                Analytics Preditivo
              </Link>
              <span className="text-gray-300">•</span>
              <Link href={data?.links?.intelligence || '/admin/centro-inteligencia'} className="text-sm text-blue-700 hover:underline">
                Centro de Inteligência
              </Link>
              <span className="text-gray-300">•</span>
              <Link href={data?.links?.billing || '/admin/financeiro/clientes'} className="text-sm text-blue-700 hover:underline">
                Cobranças
              </Link>
              <span className="text-gray-300">•</span>
              <Link href={data?.links?.machineLearning || '/admin/machine-learning'} className="text-sm text-blue-700 hover:underline">
                Machine Learning
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#1672d6]" />
              <CardTitle className="text-base">Sinais principais (top)</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => runNow('/api/cron/ml', 'ML')} className="gap-2">
                <Brain className="w-4 h-4" /> Rodar ML agora
              </Button>
              <Button variant="outline" onClick={() => runNow('/api/cron/alerts', 'Alertas')} className="gap-2">
                <Zap className="w-4 h-4" /> Rodar alertas agora
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-600">Carregando…</div>
            ) : !highlights.length ? (
              <div className="text-sm text-gray-600">
                Ainda sem predições suficientes neste ambiente. Rode o ML acima para preencher o log.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {highlights.map((h) => (
                  <Link key={h.id} href={h.href} className="block">
                    <div className="rounded-xl border p-4 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-gray-900">{h.label}</div>
                        <Badge>{h.type}</Badge>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-[#001533]">
                        {typeof h.value === 'number' ? `${Math.round(h.value)}%` : '—'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Confiança: {h.confidence}%</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


