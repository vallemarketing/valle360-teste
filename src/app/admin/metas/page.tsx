'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Target, Sparkles, Pencil, RefreshCw, Wand2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function AdminMetasPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [localGoals, setLocalGoals] = useState<Record<string, { target: number; current: number; unit: string }>>({});
  const [suggestions, setSuggestions] = useState<any[] | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const load = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/goals?status=active', { headers, cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao carregar metas');
      setItems(data.data || []);
    } catch (e: any) {
      setItems([]);
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
    const total = items.length;
    const avg = total ? Math.round(items.reduce((acc: number, x: any) => acc + Number(x.overall_progress || 0), 0) / total) : 0;
    const ai = items.filter((x: any) => !!x.ai_suggested).length;
    return { total, avg, ai };
  }, [items]);

  const openEdit = (goal: any) => {
    setSelectedGoal(goal);
    setLocalGoals((goal?.goals || {}) as any);
    setAdjustmentReason('');
    setEditOpen(true);
  };

  const saveManual = async () => {
    if (!selectedGoal) return;
    try {
      const headers = await getAuthHeaders();
      toast.loading('Salvando ajuste manual...');
      const res = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          id: selectedGoal.id,
          goals: localGoals,
          ai_suggested: false,
          adjustment_reason: adjustmentReason || 'Ajuste manual pelo Super Admin',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao salvar');
      toast.dismiss();
      toast.success('Meta atualizada!');
      setEditOpen(false);
      await load();
    } catch (e: any) {
      toast.dismiss();
      toast.error(String(e?.message || e));
    }
  };

  const loadSuggestions = async (goal: any) => {
    try {
      const headers = await getAuthHeaders();
      toast.loading('Gerando sugestões preditivas...');
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          action: 'suggest',
          collaborator_id: goal.collaborator_id,
          sector: goal.sector,
          period_type: goal.period_type || 'monthly',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao sugerir');
      toast.dismiss();
      setSuggestions(data.data || []);
      setSuggestOpen(true);
    } catch (e: any) {
      toast.dismiss();
      toast.error(String(e?.message || e));
    }
  };

  const regenerateAI = async (goal: any) => {
    try {
      const headers = await getAuthHeaders();
      toast.loading('Gerando metas com IA...');
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          action: 'generate',
          collaborator_id: goal.collaborator_id,
          collaborator_name: goal.collaborator_name,
          sector: goal.sector,
          period_type: goal.period_type || 'monthly',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao gerar');
      toast.dismiss();
      toast.success('Meta gerada/atualizada pela IA!');
      await load();
    } catch (e: any) {
      toast.dismiss();
      toast.error(String(e?.message || e));
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Metas</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Central de Metas (preditivo): IA sugere com base em dados reais + você pode ajustar manualmente.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metas ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Progresso médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.avg}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sugestões IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.ai}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Dica: metas são calculadas usando histórico real (Kanban) quando não há <code>production_history</code>.
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Central de Metas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Carregando…</div>
            ) : items.length === 0 ? (
              <EmptyState
                type="tasks"
                title="Nenhuma meta ativa"
                description="Gere metas com IA para começar (sem mocks)."
                animated={false}
                action={{ label: 'Ir para Performance', onClick: () => (window.location.href = '/admin/performance') }}
              />
            ) : (
              <div className="space-y-2">
                {items.slice(0, 25).map((g: any) => (
                  <div key={g.id} className="p-3 rounded-xl border flex items-center justify-between gap-3"
                    style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-primary)' }}>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {g.collaborator_name || 'Colaborador'} • {g.sector}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {g.period_start} → {g.period_end} • progresso: {Math.round(Number(g.overall_progress || 0))}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {g.ai_suggested ? (
                        <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20">IA</Badge>
                      ) : (
                        <Badge variant="outline">Manual</Badge>
                      )}
                      <Button size="sm" variant="outline" onClick={() => loadSuggestions(g)}>
                        <Wand2 className="w-4 h-4 mr-1" />
                        Preditivo
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(g)}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button size="sm" className="bg-[#1672d6] hover:bg-[#1260b5]" onClick={() => regenerateAI(g)}>
                        <Sparkles className="w-4 h-4 mr-1" />
                        IA
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-sm">
          <Link href="/admin/performance" className="underline" style={{ color: 'var(--primary-500)' }}>
            Ir para Performance
          </Link>
        </div>

        {/* Modal simples (sem mexer layout): edição manual */}
        {editOpen && selectedGoal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditOpen(false)}>
            <div className="w-full max-w-2xl rounded-2xl border p-5 overflow-auto max-h-[80vh]"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    Editar metas — {selectedGoal.collaborator_name || 'Colaborador'} ({selectedGoal.sector})
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {selectedGoal.period_start} → {selectedGoal.period_end}
                  </div>
                </div>
                <Button variant="outline" onClick={() => setEditOpen(false)}>Fechar</Button>
              </div>

              <div className="mt-4 space-y-3">
                {Object.entries(localGoals || {}).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{k}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>atual: {Number((v as any).current || 0)} {(v as any).unit || ''}</div>
                    <input
                      className="px-3 py-2 rounded-xl border text-sm"
                      style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      type="number"
                      value={Number((v as any).target || 0)}
                      onChange={(e) => {
                        const n = Number(e.target.value || 0);
                        setLocalGoals((prev) => ({ ...prev, [k]: { ...(prev as any)[k], target: n } }));
                      }}
                    />
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>unidade: {(v as any).unit || '-'}</div>
                  </div>
                ))}
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Motivo do ajuste</div>
                  <input
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Ex: ajuste de capacidade, sazonalidade, mudança de escopo…"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                  <Button className="bg-[#1672d6] hover:bg-[#1260b5]" onClick={saveManual}>Salvar</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal preditivo (sugestões) */}
        {suggestOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSuggestOpen(false)}>
            <div className="w-full max-w-2xl rounded-2xl border p-5 overflow-auto max-h-[80vh]"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="font-bold" style={{ color: 'var(--text-primary)' }}>Sugestões Preditivas (IA)</div>
                <Button variant="outline" onClick={() => setSuggestOpen(false)}>Fechar</Button>
              </div>
              <div className="mt-4 space-y-3">
                {(suggestions || []).length === 0 ? (
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sem sugestões no momento.</div>
                ) : (
                  (suggestions || []).map((s: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl border"
                      style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.metric}</div>
                        <Badge variant="outline">confiança {Math.round(Number(s.confidence || 0))}%</Badge>
                      </div>
                      <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        alvo sugerido: <b>{s.suggested_target}</b> • {s.reasoning}
                      </div>
                      {Array.isArray(s.factors) && s.factors.length > 0 && (
                        <ul className="mt-2 text-xs list-disc ml-5" style={{ color: 'var(--text-tertiary)' }}>
                          {s.factors.slice(0, 4).map((f: string, i: number) => <li key={i}>{f}</li>)}
                        </ul>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


