'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Download, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Criterion = {
  id: string;
  axis: 'performance' | 'potential';
  key: string;
  label: string;
  description?: string | null;
  weight: number;
};

type Assessment = {
  id: string;
  cycle_id: string;
  employee_id: string;
  status: 'draft' | 'submitted';
  notes?: string | null;
  employee?: { id: string; full_name?: string | null; name?: string | null; department?: string | null; position?: string | null };
  result?: any | null;
};

type ResponseRow = {
  criterion_id: string;
  score: number;
  comment?: string | null;
};

function badgeStatus(status: Assessment['status']) {
  return status === 'submitted' ? (
    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Finalizada</Badge>
  ) : (
    <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30">Rascunho</Badge>
  );
}

export default function NineBoxAssessmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [responses, setResponses] = useState<Record<string, { score: number; comment: string }>>({});
  const [notes, setNotes] = useState('');

  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiActionsLoading, setAiActionsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiActionPlan, setAiActionPlan] = useState<any>(null);

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

  async function apiPut<T>(url: string, body?: any): Promise<T> {
    const r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : '{}' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || 'Falha na requisição');
    return j as T;
  }

  function setScore(criterionId: string, score: number) {
    setResponses((prev) => ({ ...prev, [criterionId]: { score, comment: prev[criterionId]?.comment || '' } }));
  }

  function setComment(criterionId: string, comment: string) {
    setResponses((prev) => ({ ...prev, [criterionId]: { score: prev[criterionId]?.score || 3, comment } }));
  }

  const perfCriteria = useMemo(() => criteria.filter((c) => c.axis === 'performance').sort((a, b) => b.weight - a.weight), [criteria]);
  const potCriteria = useMemo(() => criteria.filter((c) => c.axis === 'potential').sort((a, b) => b.weight - a.weight), [criteria]);

  const missingJustifications = useMemo(() => {
    const missing: string[] = [];
    for (const c of criteria) {
      const v = responses[c.id];
      const score = Number(v?.score || 0);
      const comment = String(v?.comment || '').trim();
      if ([1, 2, 5].includes(score) && !comment) missing.push(c.id);
    }
    return missing;
  }, [criteria, responses]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const j = await apiGet<{ assessment: Assessment; responses: any[] }>(`/api/nine-box/assessments/${encodeURIComponent(id)}`);
        if (!mounted) return;
        setAssessment(j.assessment);
        setNotes(String(j.assessment?.notes || ''));

        const respMap: Record<string, { score: number; comment: string }> = {};
        for (const r of j.responses || []) {
          const cid = String(r.criterion_id);
          respMap[cid] = { score: Number(r.score || 3), comment: String(r.comment || '') };
        }
        setResponses(respMap);

        const cycleId = String(j.assessment.cycle_id);
        const c = await apiGet<{ criteria: Criterion[] }>(`/api/nine-box/criteria?cycle_id=${encodeURIComponent(cycleId)}`);
        if (!mounted) return;
        setCriteria(c.criteria || []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Erro ao carregar avaliação');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function save(status?: 'draft' | 'submitted') {
    if (!assessment) return;
    try {
      setSaving(true);
      setError(null);
      const payload = {
        status,
        notes,
        responses: criteria.map((c) => ({
          criterion_id: c.id,
          score: Number(responses[c.id]?.score || 3),
          comment: String(responses[c.id]?.comment || '').trim() || null,
        })),
      };
      const j = await apiPut<{ assessment: Assessment; result?: any }>(`/api/nine-box/assessments/${encodeURIComponent(id)}`, payload);
      setAssessment((prev) => ({ ...(prev || j.assessment), ...j.assessment, result: j.result ?? (prev as any)?.result }));
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function suggestScores() {
    if (!assessment) return;
    try {
      setAiSuggestLoading(true);
      setError(null);
      const j = await apiPost<{ output: any }>(`/api/nine-box/ai/suggest-scores`, {
        cycle_id: assessment.cycle_id,
        assessment_id: assessment.id,
        employee_id: assessment.employee_id,
      });
      setAiSuggestions(j.output || null);
    } catch (e: any) {
      setError(e?.message || 'Erro IA (sugestão)');
    } finally {
      setAiSuggestLoading(false);
    }
  }

  async function summarize() {
    if (!assessment) return;
    try {
      setAiSummaryLoading(true);
      setError(null);
      const j = await apiPost<{ output: any }>(`/api/nine-box/ai/summarize`, { assessment_id: assessment.id });
      setAiSummary(j.output || null);
    } catch (e: any) {
      setError(e?.message || 'Erro IA (resumo)');
    } finally {
      setAiSummaryLoading(false);
    }
  }

  async function suggestActions() {
    if (!assessment) return;
    try {
      setAiActionsLoading(true);
      setError(null);
      const j = await apiPost<{ output: any }>(`/api/nine-box/ai/suggest-actions`, {
        cycle_id: assessment.cycle_id,
        employee_id: assessment.employee_id,
        assessment_id: assessment.id,
        quadrant: assessment.result?.quadrant || undefined,
      });
      setAiActionPlan(j.output || null);
    } catch (e: any) {
      setError(e?.message || 'Erro IA (PDI)');
    } finally {
      setAiActionsLoading(false);
    }
  }

  async function createActionItemFromAi(a: any) {
    if (!assessment) return;
    try {
      setError(null);
      const dueInDays = Number(a?.due_in_days || 30);
      const due = new Date(Date.now() + Math.max(1, dueInDays) * 24 * 3600 * 1000);
      const dueDate = due.toISOString().slice(0, 10);
      await apiPost(`/api/nine-box/action-items`, {
        cycle_id: assessment.cycle_id,
        employee_id: assessment.employee_id,
        result_id: null,
        title: String(a?.title || 'Ação sugerida'),
        description: String(a?.description || ''),
        due_date: dueDate,
        status: 'open',
        metadata: { source: 'ai', owner_role: a?.owner_role || null, success_metric: a?.success_metric || null },
      });
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar item de PDI');
    }
  }

  const employeeName = String(assessment?.employee?.full_name || assessment?.employee?.name || assessment?.employee_id || '');

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-2 rounded-xl border"
              style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-primary)' }}
              onClick={() => router.push('/admin/rh/nine-box')}
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Avaliação 9 Box
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {employeeName}
                </div>
                {assessment ? badgeStatus(assessment.status) : null}
                {assessment?.result?.quadrant ? (
                  <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30">{String(assessment.result.quadrant)}</Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {assessment?.cycle_id ? (
              <>
                <a href={`/api/nine-box/export/pdf?cycle_id=${encodeURIComponent(assessment.cycle_id)}`}>
                  <Button variant="outline" className="gap-2">
                    <FileText className="w-4 h-4" />
                    PDF
                  </Button>
                </a>
                <a href={`/api/nine-box/export/xlsx?cycle_id=${encodeURIComponent(assessment.cycle_id)}`}>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    XLSX
                  </Button>
                </a>
              </>
            ) : null}
            <Link href="/admin/rh/nine-box">
              <Button variant="outline">Voltar ao ciclo</Button>
            </Link>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <Card>
            <CardHeader>
              <CardTitle>Carregando...</CardTitle>
              <CardDescription>Buscando critérios e respostas.</CardDescription>
            </CardHeader>
          </Card>
        ) : !assessment ? (
          <Card>
            <CardHeader>
              <CardTitle>Avaliação não encontrada</CardTitle>
              <CardDescription>Verifique o link ou volte ao ciclo.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle>Notas e justificativas</CardTitle>
                  <CardDescription>Notas 1/2/5 exigem justificativa (a IA pode rascunhar, você valida).</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button onClick={() => suggestScores()} variant="outline" className="gap-2" disabled={aiSuggestLoading}>
                    <Sparkles className="w-4 h-4" />
                    {aiSuggestLoading ? 'IA...' : 'Sugerir notas (IA)'}
                  </Button>
                  <Button onClick={() => save('draft')} disabled={saving} variant="outline">
                    {saving ? 'Salvando...' : 'Salvar rascunho'}
                  </Button>
                  <Button
                    onClick={async () => {
                      if (missingJustifications.length) {
                        setError('Justificativa obrigatória para todas as notas 1, 2 e 5.');
                        return;
                      }
                      await save('submitted');
                    }}
                    disabled={saving}
                    className="gap-2"
                    style={{ backgroundColor: 'var(--success-600)' }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Finalizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Desempenho
                    </div>
                    {perfCriteria.map((c) => {
                      const v = responses[c.id];
                      const score = Number(v?.score || 3);
                      const comment = String(v?.comment || '');
                      const needs = [1, 2, 5].includes(score) && !comment.trim();
                      return (
                        <div key={c.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-primary)' }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {c.label}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                Peso: {c.weight}%
                              </div>
                              {c.description ? (
                                <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  {c.description}
                                </div>
                              ) : null}
                            </div>
                            <select
                              className="rounded-lg border px-2 py-1 text-sm"
                              style={{ borderColor: needs ? 'var(--error-500)' : 'var(--border-light)' }}
                              value={String(score)}
                              onChange={(e) => setScore(c.id, Number(e.target.value))}
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={String(n)}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-2">
                            <Textarea
                              placeholder={needs ? 'Justificativa obrigatória para nota 1/2/5' : 'Justificativa (opcional)'}
                              value={comment}
                              onChange={(e) => setComment(c.id, e.target.value)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Potencial
                    </div>
                    {potCriteria.map((c) => {
                      const v = responses[c.id];
                      const score = Number(v?.score || 3);
                      const comment = String(v?.comment || '');
                      const needs = [1, 2, 5].includes(score) && !comment.trim();
                      return (
                        <div key={c.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-primary)' }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {c.label}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                Peso: {c.weight}%
                              </div>
                              {c.description ? (
                                <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  {c.description}
                                </div>
                              ) : null}
                            </div>
                            <select
                              className="rounded-lg border px-2 py-1 text-sm"
                              style={{ borderColor: needs ? 'var(--error-500)' : 'var(--border-light)' }}
                              value={String(score)}
                              onChange={(e) => setScore(c.id, Number(e.target.value))}
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={String(n)}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-2">
                            <Textarea
                              placeholder={needs ? 'Justificativa obrigatória para nota 1/2/5' : 'Justificativa (opcional)'}
                              value={comment}
                              onChange={(e) => setComment(c.id, e.target.value)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Observações gerais
                  </div>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas gerais sobre o colaborador neste ciclo..." />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="ai">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="ai">IA (copiloto)</TabsTrigger>
                <TabsTrigger value="pdi">Plano de ação</TabsTrigger>
              </TabsList>

              <TabsContent value="ai">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <CardTitle>Sugestões de notas</CardTitle>
                        <CardDescription>Gera sugestões com confiança e evidências (best-effort).</CardDescription>
                      </div>
                      <Button onClick={() => suggestScores()} disabled={aiSuggestLoading} variant="outline" className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        {aiSuggestLoading ? 'Gerando...' : 'Gerar'}
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {aiSuggestions?.suggestions?.length ? (
                        aiSuggestions.suggestions.map((s: any, idx: number) => (
                          <div key={idx} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)' }}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {String(s.key || s.criterion_id)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30">Nota {String(s.score)}</Badge>
                                <button
                                  className="text-sm underline"
                                  onClick={() => {
                                    const cid = String(s.criterion_id);
                                    const score = Number(s.score || 3);
                                    setResponses((prev) => ({ ...prev, [cid]: { score, comment: prev[cid]?.comment || '' } }));
                                  }}
                                >
                                  Aplicar
                                </button>
                              </div>
                            </div>
                            {s.reason ? (
                              <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {String(s.reason)}
                              </div>
                            ) : null}
                            {Array.isArray(s.evidences) && s.evidences.length ? (
                              <ul className="mt-2 list-disc pl-5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {s.evidences.slice(0, 4).map((ev: any, i: number) => (
                                  <li key={i}>{String(ev)}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Gere para ver sugestões.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <CardTitle>Resumo executivo</CardTitle>
                        <CardDescription>Gera strengths, improvements, risks e next_step.</CardDescription>
                      </div>
                      <Button onClick={() => summarize()} disabled={aiSummaryLoading} variant="outline">
                        {aiSummaryLoading ? 'Gerando...' : 'Gerar resumo'}
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {aiSummary ? (
                        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)' }}>
                          {aiSummary.summary ? (
                            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                              {String(aiSummary.summary)}
                            </div>
                          ) : null}
                          {Array.isArray(aiSummary.strengths) && aiSummary.strengths.length ? (
                            <div className="mt-3">
                              <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                Pontos fortes
                              </div>
                              <ul className="list-disc pl-5 text-sm">
                                {aiSummary.strengths.slice(0, 6).map((x: any, i: number) => (
                                  <li key={i}>{String(x)}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {Array.isArray(aiSummary.improvements) && aiSummary.improvements.length ? (
                            <div className="mt-3">
                              <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                Melhorias
                              </div>
                              <ul className="list-disc pl-5 text-sm">
                                {aiSummary.improvements.slice(0, 6).map((x: any, i: number) => (
                                  <li key={i}>{String(x)}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {aiSummary.next_step ? (
                            <div className="mt-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                              <span className="font-semibold">Próximo passo: </span>
                              {String(aiSummary.next_step)}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Gere para ver o resumo.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="pdi">
                <Card>
                  <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <CardTitle>PDI (Plano de ação)</CardTitle>
                      <CardDescription>Gere ações com IA e crie itens automaticamente.</CardDescription>
                    </div>
                    <Button onClick={() => suggestActions()} disabled={aiActionsLoading} className="gap-2" style={{ backgroundColor: 'var(--primary-500)' }}>
                      <Sparkles className="w-4 h-4" />
                      {aiActionsLoading ? 'Gerando...' : 'Gerar PDI (IA)'}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {aiActionPlan?.actions?.length ? (
                      aiActionPlan.actions.map((a: any, idx: number) => (
                        <div key={idx} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)' }}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {String(a.title)}
                            </div>
                            <button className="text-sm underline" onClick={() => createActionItemFromAi(a)}>
                              Criar item
                            </button>
                          </div>
                          {a.description ? (
                            <div className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {String(a.description)}
                            </div>
                          ) : null}
                          <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Dono: {String(a.owner_role || '—')} • Prazo: {String(a.due_in_days || '—')} dias • Métrica: {String(a.success_metric || '—')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Gere o PDI para ver sugestões acionáveis.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}


