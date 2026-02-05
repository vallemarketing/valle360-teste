'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Axis = 'performance' | 'potential';

type Criterion = {
  id: string;
  cycle_id: string | null;
  axis: Axis;
  key: string;
  label: string;
  description: string | null;
  weight: number;
  is_active: boolean;
};

function sumWeights(list: Criterion[]) {
  return list.reduce((acc, c) => acc + Number(c.weight || 0), 0);
}

export default function NineBoxCriteriaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="max-w-6xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Carregando critérios...
          </div>
        </div>
      }
    >
      <NineBoxCriteriaInner />
    </Suspense>
  );
}

function NineBoxCriteriaInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cycleId = searchParams.get('cycle') || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const [newPerf, setNewPerf] = useState({ key: '', label: '', description: '', weight: 10 });
  const [newPot, setNewPot] = useState({ key: '', label: '', description: '', weight: 10 });

  async function apiGet<T>(url: string): Promise<T> {
    const r = await fetch(url, { cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || 'Falha na requisição');
    return j as T;
  }

  async function apiPost<T>(url: string, body?: any): Promise<T> {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || 'Falha na requisição');
    return j as T;
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const url = cycleId ? `/api/nine-box/criteria?cycle_id=${encodeURIComponent(cycleId)}` : '/api/nine-box/criteria';
      const j = await apiGet<{ criteria: Criterion[] }>(url);
      setCriteria((j.criteria || []) as any);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar critérios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleId]);

  const perf = useMemo(() => criteria.filter((c) => c.axis === 'performance'), [criteria]);
  const pot = useMemo(() => criteria.filter((c) => c.axis === 'potential'), [criteria]);
  const perfSum = useMemo(() => sumWeights(perf), [perf]);
  const potSum = useMemo(() => sumWeights(pot), [pot]);

  function updateCriterion(id: string, patch: Partial<Criterion>) {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function saveAll() {
    try {
      setSaving(true);
      setError(null);

      const payload = criteria.map((c) => ({
        cycle_id: c.cycle_id || (cycleId ? cycleId : null),
        axis: c.axis,
        key: c.key,
        label: c.label,
        description: c.description || null,
        weight: Number(c.weight || 0),
        is_active: Boolean(c.is_active),
      }));

      const j = await apiPost<{ criteria: Criterion[] }>('/api/nine-box/criteria', { criteria: payload });
      setCriteria((j.criteria || []) as any);
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function addNew(axis: Axis) {
    const f = axis === 'performance' ? newPerf : newPot;
    if (!f.key.trim() || !f.label.trim()) {
      setError('Preencha key e label.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const body = {
        criteria: [
          {
            cycle_id: cycleId ? cycleId : null,
            axis,
            key: f.key.trim(),
            label: f.label.trim(),
            description: f.description.trim() || null,
            weight: Number(f.weight || 0),
            is_active: true,
          },
        ],
      };
      await apiPost('/api/nine-box/criteria', body);
      if (axis === 'performance') setNewPerf({ key: '', label: '', description: '', weight: 10 });
      else setNewPot({ key: '', label: '', description: '', weight: 10 });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Erro ao adicionar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-2 rounded-xl border"
              style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-primary)' }}
              onClick={() => router.push(cycleId ? `/admin/rh/nine-box?cycle=${encodeURIComponent(cycleId)}` : '/admin/rh/nine-box')}
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Critérios do 9 Box
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Editar pesos, descrições e ativação. {cycleId ? 'Inclui critérios do ciclo + globais.' : 'Somente critérios globais.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href={cycleId ? `/admin/rh/nine-box?cycle=${encodeURIComponent(cycleId)}` : '/admin/rh/nine-box'}>
              <Button variant="outline">Voltar ao 9 Box</Button>
            </Link>
            <Button onClick={saveAll} disabled={saving || loading} className="gap-2" style={{ backgroundColor: 'var(--primary-500)' }}>
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <Card>
          <CardHeader>
            <CardTitle>Checagem de pesos</CardTitle>
            <CardDescription>Ideal: 100% por eixo. Você pode ajustar e salvar.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3 flex-wrap">
            <Badge className={perfSum === 100 ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-amber-500/10 text-amber-700 border-amber-500/30'}>
              Desempenho: {perfSum}%
            </Badge>
            <Badge className={potSum === 100 ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-amber-500/10 text-amber-700 border-amber-500/30'}>
              Potencial: {potSum}%
            </Badge>
            {!cycleId ? (
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Dica: para critérios específicos por ciclo, acesse esta tela com `?cycle=&lt;id&gt;`.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Tabs defaultValue="performance">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="performance">Desempenho</TabsTrigger>
            <TabsTrigger value="potential">Potencial</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <CriteriaTable
              title="Desempenho"
              subtitle="Peso, descrição e ativação dos critérios"
              list={perf}
              loading={loading}
              update={updateCriterion}
              newForm={newPerf}
              setNewForm={setNewPerf}
              onAdd={() => addNew('performance')}
            />
          </TabsContent>

          <TabsContent value="potential">
            <CriteriaTable
              title="Potencial"
              subtitle="Peso, descrição e ativação dos critérios"
              list={pot}
              loading={loading}
              update={updateCriterion}
              newForm={newPot}
              setNewForm={setNewPot}
              onAdd={() => addNew('potential')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CriteriaTable(props: {
  title: string;
  subtitle: string;
  list: Criterion[];
  loading: boolean;
  update: (id: string, patch: Partial<Criterion>) => void;
  newForm: { key: string; label: string; description: string; weight: number };
  setNewForm: React.Dispatch<React.SetStateAction<{ key: string; label: string; description: string; weight: number }>>;
  onAdd: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-primary)' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                key
              </div>
              <Input value={props.newForm.key} onChange={(e) => props.setNewForm((p) => ({ ...p, key: e.target.value }))} placeholder="ex: ownership" />
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                label
              </div>
              <Input value={props.newForm.label} onChange={(e) => props.setNewForm((p) => ({ ...p, label: e.target.value }))} placeholder="ex: Responsabilidade" />
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                peso (%)
              </div>
              <Input
                type="number"
                value={String(props.newForm.weight)}
                onChange={(e) => props.setNewForm((p) => ({ ...p, weight: Number(e.target.value || 0) }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={props.onAdd} className="w-full gap-2" style={{ backgroundColor: 'var(--primary-500)' }}>
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </div>
            <div className="md:col-span-4">
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                descrição
              </div>
              <Textarea value={props.newForm.description} onChange={(e) => props.setNewForm((p) => ({ ...p, description: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
        </div>

        {props.loading ? (
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Carregando...
          </div>
        ) : props.list.length ? (
          props.list.map((c) => (
            <div key={c.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-primary)' }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {c.label}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    key: <span className="font-mono">{c.key}</span> • {c.cycle_id ? 'do ciclo' : 'global'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Ativo
                    <input
                      className="ml-2"
                      type="checkbox"
                      checked={!!c.is_active}
                      onChange={(e) => props.update(c.id, { is_active: e.target.checked })}
                    />
                  </label>
                  <Input
                    type="number"
                    className="w-24"
                    value={String(c.weight)}
                    onChange={(e) => props.update(c.id, { weight: Number(e.target.value || 0) })}
                  />
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Label
                  </div>
                  <Input value={c.label} onChange={(e) => props.update(c.id, { label: e.target.value })} />
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Descrição
                  </div>
                  <Textarea value={c.description || ''} onChange={(e) => props.update(c.id, { description: e.target.value })} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sem critérios.
          </div>
        )}
      </CardContent>
    </Card>
  );
}


