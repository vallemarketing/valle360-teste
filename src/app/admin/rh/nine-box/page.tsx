'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Download, FileText, Plus, Sparkles, Target, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Cycle = {
  id: string;
  name: string;
  description?: string | null;
  status: 'draft' | 'open' | 'closed';
  starts_at?: string | null;
  ends_at?: string | null;
  ai_enabled?: boolean;
};

type MatrixPoint = {
  id: string;
  cycle_id: string;
  employee_id: string;
  status: 'draft' | 'submitted';
  updated_at: string;
  submitted_at?: string | null;
  employee?: { id: string; full_name?: string | null; name?: string | null; department?: string | null; position?: string | null };
  result?: { performance_score: number; potential_score: number; quadrant: string };
};

type AssessmentRow = {
  id: string;
  cycle_id: string;
  employee_id: string;
  status: 'draft' | 'submitted';
  updated_at: string;
  submitted_at?: string | null;
  employee?: { id: string; full_name?: string | null; name?: string | null; department?: string | null; position?: string | null };
  result?: { performance_score: number; potential_score: number; quadrant: string } | null;
};

type ActionItem = {
  id: string;
  cycle_id: string;
  employee_id: string;
  title: string;
  description?: string | null;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  due_date?: string | null;
  created_at: string;
};

type EmployeeLite = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  department?: string | null;
  position?: string | null;
  is_active?: boolean;
};

function statusBadge(status: Cycle['status']) {
  if (status === 'open') return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Aberto</Badge>;
  if (status === 'closed') return <Badge className="bg-gray-500/10 text-gray-700 border-gray-500/30">Fechado</Badge>;
  return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30">Rascunho</Badge>;
}

function quadrantGridLabel(q: string) {
  const map: Record<string, string> = {
    Q1: 'Baixo potencial / Baixa perf.',
    Q2: 'Baixo potencial / Média perf.',
    Q3: 'Baixo potencial / Alta perf.',
    Q4: 'Médio potencial / Baixa perf.',
    Q5: 'Médio potencial / Média perf.',
    Q6: 'Médio potencial / Alta perf.',
    Q7: 'Alto potencial / Baixa perf.',
    Q8: 'Alto potencial / Média perf.',
    Q9: 'Alto potencial / Alta perf.',
  };
  return map[q] || q;
}

export default function NineBoxPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="max-w-7xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Carregando 9 Box...
          </div>
        </div>
      }
    >
      <NineBoxInner />
    </Suspense>
  );
}

function NineBoxInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cycleFromUrl = searchParams.get('cycle');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cycleId, setCycleId] = useState<string>('');
  const selectedCycle = useMemo(() => cycles.find((c) => c.id === cycleId) || null, [cycles, cycleId]);

  const [activeTab, setActiveTab] = useState<'matrix' | 'assessments' | 'dashboard' | 'actions'>('matrix');

  const [matrix, setMatrix] = useState<{ points: MatrixPoint[]; counts: Record<string, number> } | null>(null);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [predictive, setPredictive] = useState<any>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);

  const [createCycleOpen, setCreateCycleOpen] = useState(false);
  const [createCycleForm, setCreateCycleForm] = useState({ name: '', description: '', starts_at: '', ends_at: '', ai_enabled: true });

  const [createAssessmentOpen, setCreateAssessmentOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [creatingAssessment, setCreatingAssessment] = useState(false);

  async function apiGet<T>(url: string): Promise<T> {
    const r = await fetch(url, { cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || 'Falha na requisição');
    return j as T;
  }

  async function apiPost<T>(url: string, body?: any): Promise<T> {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : '{}' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || 'Falha na requisição');
    return j as T;
  }

  async function loadCycles() {
    const j = await apiGet<{ cycles: Cycle[] }>('/api/nine-box/cycles');
    setCycles(j.cycles || []);
  }

  async function loadEmployees() {
    const j = await apiGet<{ employees: EmployeeLite[] }>('/api/nine-box/employees?active=1');
    setEmployees(j.employees || []);
  }

  async function loadMatrix(cId: string) {
    const j = await apiGet<{ points: MatrixPoint[]; counts: Record<string, number> }>(`/api/nine-box/matrix?cycle_id=${encodeURIComponent(cId)}`);
    setMatrix({ points: j.points || [], counts: j.counts || {} });
  }

  async function loadAssessments(cId: string) {
    const j = await apiGet<{ assessments: AssessmentRow[] }>(`/api/nine-box/assessments?cycle_id=${encodeURIComponent(cId)}`);
    setAssessments(j.assessments || []);
  }

  async function loadDashboard(cId: string) {
    const j = await apiGet<any>(`/api/nine-box/dashboard?cycle_id=${encodeURIComponent(cId)}`);
    setDashboard(j);
  }

  async function loadPredictive(cId: string) {
    const j = await apiGet<any>(`/api/nine-box/ai/predictive?cycle_id=${encodeURIComponent(cId)}`);
    setPredictive(j);
  }

  async function loadActions(cId: string) {
    const j = await apiGet<{ items: ActionItem[] }>(`/api/nine-box/action-items?cycle_id=${encodeURIComponent(cId)}`);
    setActions(j.items || []);
  }

  async function loadAll(cId: string) {
    await Promise.allSettled([loadMatrix(cId), loadAssessments(cId), loadDashboard(cId), loadPredictive(cId), loadActions(cId)]);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadCycles();
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Erro ao carregar');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!cycles.length) return;
    const next = cycleFromUrl && cycles.some((c) => c.id === cycleFromUrl) ? cycleFromUrl : cycles[0].id;
    if (next && next !== cycleId) setCycleId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycles, cycleFromUrl]);

  useEffect(() => {
    if (!cycleId) return;
    (async () => {
      setError(null);
      try {
        await loadAll(cycleId);
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar dados do ciclo');
      }
    })();
    // manter cycle em URL para deep-link (notificações)
    router.replace(`/admin/rh/nine-box?cycle=${encodeURIComponent(cycleId)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleId]);

  const counts = matrix?.counts || {};
  const quadrantCounts = (q: string) => Number(counts[q] || 0);

  const topActions = useMemo(() => actions.slice(0, 8), [actions]);
  const alerts = useMemo(() => (dashboard?.alerts || []) as any[], [dashboard]);
  const predictiveSummary = useMemo(() => predictive?.summary || null, [predictive]);
  const predictiveAlerts = useMemo(() => (predictive?.alerts || []) as any[], [predictive]);

  const employeesOptions = useMemo(() => {
    return (employees || [])
      .map((e) => ({
        id: String(e.id),
        label: `${String(e.full_name || e.name || e.email || e.id)}${e.department ? ` • ${e.department}` : ''}${e.position ? ` • ${e.position}` : ''}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [employees]);

  async function handleCreateCycle() {
    try {
      const payload = {
        name: createCycleForm.name.trim(),
        description: createCycleForm.description.trim() || null,
        starts_at: createCycleForm.starts_at ? new Date(createCycleForm.starts_at).toISOString() : null,
        ends_at: createCycleForm.ends_at ? new Date(createCycleForm.ends_at).toISOString() : null,
        ai_enabled: Boolean(createCycleForm.ai_enabled),
        config: {},
      };
      const j = await apiPost<{ cycle: Cycle }>('/api/nine-box/cycles', payload);
      setCreateCycleOpen(false);
      setCreateCycleForm({ name: '', description: '', starts_at: '', ends_at: '', ai_enabled: true });
      await loadCycles();
      if (j?.cycle?.id) setCycleId(String(j.cycle.id));
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar ciclo');
    }
  }

  async function setCycleStatus(next: 'open' | 'closed') {
    if (!cycleId) return;
    try {
      setError(null);
      if (next === 'open') await apiPost(`/api/nine-box/cycles/${encodeURIComponent(cycleId)}/open`);
      if (next === 'closed') await apiPost(`/api/nine-box/cycles/${encodeURIComponent(cycleId)}/close`);
      await loadCycles();
      await loadAll(cycleId);
    } catch (e: any) {
      setError(e?.message || 'Erro ao atualizar status');
    }
  }

  async function openCreateAssessment() {
    setCreateAssessmentOpen(true);
    setSelectedEmployeeId('');
    if (!employees.length) {
      try {
        await loadEmployees();
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar colaboradores');
      }
    }
  }

  async function createAssessment() {
    if (!cycleId || !selectedEmployeeId) return;
    try {
      setCreatingAssessment(true);
      const j = await apiPost<{ assessment: { id: string } }>('/api/nine-box/assessments', {
        cycle_id: cycleId,
        employee_id: selectedEmployeeId,
        status: 'draft',
      });
      const id = String(j?.assessment?.id || '');
      if (!id) throw new Error('Falha ao criar avaliação');
      setCreateAssessmentOpen(false);
      router.push(`/admin/rh/nine-box/assessments/${encodeURIComponent(id)}`);
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar avaliação');
    } finally {
      setCreatingAssessment(false);
    }
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--purple-100)' }}>
              <Target className="w-6 h-6" style={{ color: 'var(--purple-500)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                9 Box (Matriz de Talentos)
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>Ciclos, avaliações, matriz, dashboard, PDI e IA (copiloto).</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link href="/admin/rh">
              <Button variant="outline">Voltar ao RH</Button>
            </Link>
            <Button onClick={() => setCreateCycleOpen(true)} className="gap-2" style={{ backgroundColor: 'var(--primary-500)' }}>
              <Plus className="w-4 h-4" />
              Novo ciclo
            </Button>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>Ciclo</span>
                {selectedCycle ? statusBadge(selectedCycle.status) : null}
                {selectedCycle?.ai_enabled ? (
                  <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/30">IA ativa</Badge>
                ) : (
                  <Badge className="bg-gray-500/10 text-gray-700 border-gray-500/30">IA desligada</Badge>
                )}
              </CardTitle>
              <CardDescription>Selecione um ciclo para ver matriz, avaliações e PDI.</CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="min-w-[280px]">
                <Select value={cycleId} onValueChange={(v) => setCycleId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? 'Carregando...' : 'Selecione'}>{selectedCycle?.name || 'Selecione'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(cycles || []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="truncate">{c.name}</div>
                          <div className="ml-auto">{statusBadge(c.status)}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={() => openCreateAssessment()} className="gap-2">
                <Users className="w-4 h-4" />
                Nova avaliação
              </Button>

              {selectedCycle?.status !== 'open' && selectedCycle?.status !== 'closed' && (
                <Button onClick={() => setCycleStatus('open')} className="gap-2" style={{ backgroundColor: 'var(--success-600)' }}>
                  <Sparkles className="w-4 h-4" />
                  Abrir ciclo
                </Button>
              )}
              {selectedCycle?.status === 'open' && (
                <Button onClick={() => setCycleStatus('closed')} variant="outline" className="gap-2">
                  Fechar ciclo
                </Button>
              )}

              {!!cycleId && (
                <>
                  <Link href={`/admin/rh/nine-box/criteria?cycle=${encodeURIComponent(cycleId)}`}>
                    <Button variant="outline" className="gap-2">
                      Critérios
                    </Button>
                  </Link>
                  <a href={`/api/nine-box/export/pdf?cycle_id=${encodeURIComponent(cycleId)}`}>
                    <Button variant="outline" className="gap-2">
                      <FileText className="w-4 h-4" />
                      PDF
                    </Button>
                  </a>
                  <a href={`/api/nine-box/export/xlsx?cycle_id=${encodeURIComponent(cycleId)}`}>
                    <Button variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      XLSX
                    </Button>
                  </a>
                </>
              )}
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="matrix">Matriz</TabsTrigger>
            <TabsTrigger value="assessments">Avaliações</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="actions">Plano de ação</TabsTrigger>
          </TabsList>

          <TabsContent value="matrix">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Matriz 9 Box</CardTitle>
                  <CardDescription>Contagem por quadrante (Potencial ↑ / Performance →).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Q7', 'Q8', 'Q9', 'Q4', 'Q5', 'Q6', 'Q1', 'Q2', 'Q3'] as const).map((q) => (
                      <div
                        key={q}
                        className="rounded-xl border p-3"
                        style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-primary)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {q}
                          </div>
                          <div className="text-2xl font-bold" style={{ color: 'var(--primary-500)' }}>
                            {quadrantCounts(q)}
                          </div>
                        </div>
                        <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {quadrantGridLabel(q)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Últimas avaliações</CardTitle>
                  <CardDescription>Abra e finalize avaliações para atualizar a matriz.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(matrix?.points || []).slice(0, 8).map((p) => (
                    <Link key={p.id} href={`/admin/rh/nine-box/assessments/${encodeURIComponent(p.id)}`}>
                      <div className="rounded-xl border p-3 hover:shadow-sm transition-all" style={{ borderColor: 'var(--border-light)' }}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>
                              {String(p.employee?.full_name || p.employee?.name || p.employee_id)}
                            </div>
                            <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                              {String(p.employee?.department || '—')} • {String(p.employee?.position || '—')}
                            </div>
                          </div>
                          <Badge className="bg-gray-500/10 text-gray-700 border-gray-500/30">{p.status === 'submitted' ? 'Finalizada' : 'Rascunho'}</Badge>
                        </div>
                        {p.result ? (
                          <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Perf {p.result.performance_score} • Pot {p.result.potential_score} • {p.result.quadrant}
                          </div>
                        ) : (
                          <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Sem resultado (finalize para calcular)
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                  {!matrix?.points?.length && (
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Nenhuma avaliação com resultado ainda.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assessments">
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle>Avaliações do ciclo</CardTitle>
                  <CardDescription>Crie, edite e finalize avaliações. Notas 1/2/5 exigem justificativa.</CardDescription>
                </div>
                <Button onClick={() => openCreateAssessment()} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova avaliação
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {(assessments || []).slice(0, 50).map((a) => (
                  <Link key={a.id} href={`/admin/rh/nine-box/assessments/${encodeURIComponent(a.id)}`}>
                    <div className="rounded-xl border p-3 hover:shadow-sm transition-all" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>
                            {String(a.employee?.full_name || a.employee?.name || a.employee_id)}
                          </div>
                          <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {String(a.employee?.department || '—')} • {String(a.employee?.position || '—')}
                          </div>
                        </div>
                        <Badge className="bg-gray-500/10 text-gray-700 border-gray-500/30">{a.status === 'submitted' ? 'Finalizada' : 'Rascunho'}</Badge>
                      </div>
                      {a.result ? (
                        <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Perf {a.result.performance_score} • Pot {a.result.potential_score} • {a.result.quadrant}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Sem resultado (finalize para calcular)
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
                {!assessments.length && (
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Nenhuma avaliação neste ciclo ainda.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Visão geral
                  </CardTitle>
                  <CardDescription>Distribuição por quadrante e alertas foco (Q1/Q4/Q7).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Q9', 'Q8', 'Q7', 'Q6', 'Q5', 'Q4', 'Q3', 'Q2', 'Q1'] as const).map((q) => (
                      <div key={q} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)' }}>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {q}
                        </div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--primary-500)' }}>
                          {Number(dashboard?.byQuadrant?.[q] || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alertas</CardTitle>
                  <CardDescription>Priorize estes colaboradores para PDI e acompanhamento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {predictiveSummary ? (
                    <div className="rounded-xl border p-3 mb-2" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Preditivo (risco)
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <span>Alto:</span>
                        <span className="font-semibold">{Number(predictiveSummary?.byRisk?.high || 0)}</span>
                        <span className="ml-2">Médio:</span>
                        <span className="font-semibold">{Number(predictiveSummary?.byRisk?.medium || 0)}</span>
                        <span className="ml-2">Baixo:</span>
                        <span className="font-semibold">{Number(predictiveSummary?.byRisk?.low || 0)}</span>
                      </div>
                      <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Dica: use o PDI com IA nas avaliações para criar intervenções.
                      </div>
                    </div>
                  ) : null}

                  {predictiveAlerts.length ? (
                    <>
                      {predictiveAlerts.slice(0, 8).map((a: any, idx: number) => (
                        <div key={`pred-${idx}`} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)' }}>
                          <div className="flex items-center justify-between">
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {String(a.employee?.full_name || a.employee?.name || a.employee?.id)}
                            </div>
                            <Badge
                              className={
                                a.riskLevel === 'high'
                                  ? 'bg-red-500/10 text-red-700 border-red-500/30'
                                  : a.riskLevel === 'medium'
                                    ? 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                                    : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                              }
                            >
                              {String(a.riskLevel)}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Atual: {String(a.current?.quadrant || '—')} • Perf Δ {a.deltas?.performance ?? '—'} • Pot Δ{' '}
                            {a.deltas?.potential ?? '—'}
                          </div>
                          {Array.isArray(a.reasons) && a.reasons.length ? (
                            <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {a.reasons.slice(0, 2).join(' • ')}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {(alerts || []).slice(0, 10).map((a, idx) => (
                        <Link key={idx} href={`/admin/rh/nine-box/assessments/${encodeURIComponent(a.assessment_id)}`}>
                          <div className="rounded-xl border p-3 hover:shadow-sm transition-all" style={{ borderColor: 'var(--border-light)' }}>
                            <div className="flex items-center justify-between">
                              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {String(a.employee?.full_name || a.employee?.name || a.employee?.id)}
                              </div>
                              <Badge className="bg-red-500/10 text-red-700 border-red-500/30">{String(a.quadrant)}</Badge>
                            </div>
                            <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              Perf {a.performance_score} • Pot {a.potential_score}
                            </div>
                          </div>
                        </Link>
                      ))}
                      {!alerts?.length && (
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Sem alertas foco neste ciclo.
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Itens de PDI (Plano de ação)</CardTitle>
                  <CardDescription>Crie ações vinculadas ao ciclo e ao colaborador (via tela da avaliação).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topActions.map((it) => (
                    <div key={it.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {it.title}
                        </div>
                        <Badge className="bg-gray-500/10 text-gray-700 border-gray-500/30">{it.status}</Badge>
                      </div>
                      {it.description ? (
                        <div className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {it.description}
                        </div>
                      ) : null}
                      {it.due_date ? (
                        <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Vencimento: {it.due_date}
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {!actions.length && (
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Nenhum item de PDI neste ciclo ainda.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exportar</CardTitle>
                  <CardDescription>Gere relatórios simples para compartilhar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!!cycleId ? (
                    <>
                      <a href={`/api/nine-box/export/pdf?cycle_id=${encodeURIComponent(cycleId)}`}>
                        <Button className="w-full gap-2" variant="outline">
                          <FileText className="w-4 h-4" />
                          Baixar PDF
                        </Button>
                      </a>
                      <a href={`/api/nine-box/export/xlsx?cycle_id=${encodeURIComponent(cycleId)}`}>
                        <Button className="w-full gap-2" variant="outline">
                          <Download className="w-4 h-4" />
                          Baixar XLSX
                        </Button>
                      </a>
                    </>
                  ) : (
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Selecione um ciclo primeiro.
                    </div>
                  )}
                  <div className="mt-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Dica: gere PDI com IA dentro da avaliação do colaborador.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Cycle */}
      <Dialog open={createCycleOpen} onOpenChange={setCreateCycleOpen}>
        <DialogContent onClose={() => setCreateCycleOpen(false)}>
          <DialogHeader>
            <DialogTitle>Novo ciclo do 9 Box</DialogTitle>
            <DialogDescription>Crie um ciclo para organizar as avaliações. Você pode abrir/fechar depois.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nome</Label>
                <Input value={createCycleForm.name} onChange={(e) => setCreateCycleForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ex.: 2026 • 1º semestre" />
              </div>
              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Input
                  value={createCycleForm.description}
                  onChange={(e) => setCreateCycleForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label>Início</Label>
                <Input type="datetime-local" value={createCycleForm.starts_at} onChange={(e) => setCreateCycleForm((p) => ({ ...p, starts_at: e.target.value }))} />
              </div>
              <div>
                <Label>Fim</Label>
                <Input type="datetime-local" value={createCycleForm.ends_at} onChange={(e) => setCreateCycleForm((p) => ({ ...p, ends_at: e.target.value }))} />
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <div className="text-sm font-medium">IA (copiloto) habilitada</div>
                </div>
                <button
                  type="button"
                  className="text-sm underline"
                  onClick={() => setCreateCycleForm((p) => ({ ...p, ai_enabled: !p.ai_enabled }))}
                >
                  {createCycleForm.ai_enabled ? 'Desligar' : 'Ligar'}
                </button>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateCycleOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCycle} disabled={!createCycleForm.name.trim()} style={{ backgroundColor: 'var(--primary-500)' }}>
              Criar ciclo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Assessment */}
      <Dialog open={createAssessmentOpen} onOpenChange={setCreateAssessmentOpen}>
        <DialogContent onClose={() => setCreateAssessmentOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova avaliação</DialogTitle>
            <DialogDescription>Escolha um colaborador para iniciar a avaliação do ciclo selecionado.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              <Label>Colaborador</Label>
              <Select value={selectedEmployeeId} onValueChange={(v) => setSelectedEmployeeId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador">
                    {employeesOptions.find((x) => x.id === selectedEmployeeId)?.label || 'Selecione um colaborador'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employeesOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Depois você pode usar a IA para sugerir notas, gerar resumo e PDI.
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAssessmentOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createAssessment} disabled={!selectedEmployeeId || creatingAssessment} style={{ backgroundColor: 'var(--primary-500)' }}>
              {creatingAssessment ? 'Criando...' : 'Criar e abrir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


