'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Building2, RefreshCw, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/ui/Modal';

type Exec = { id: string; role: string; name: string; title: string };
type KnowledgeItem = {
  id: string;
  executive_id: string;
  knowledge_type: string;
  category: string | null;
  key: string;
  value: any;
  confidence: number | null;
  source: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  times_referenced?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  executive?: Exec | null;
};

function fmtDate(s?: string | null) {
  if (!s) return '';
  try {
    return new Date(s).toLocaleString('pt-BR');
  } catch {
    return String(s);
  }
}

export default function CsuiteMemoriaPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [role, setRole] = useState<string>('all');
  const [q, setQ] = useState<string>('');
  const [knowledgeType, setKnowledgeType] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  const [formRole, setFormRole] = useState<string>('ceo');
  const [formType, setFormType] = useState<string>('policy');
  const [formKey, setFormKey] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('general');
  const [formSource, setFormSource] = useState<string>('');
  const [formConfidence, setFormConfidence] = useState<string>('0.85');
  const [formValueJson, setFormValueJson] = useState<string>('{\n  "text": ""\n}');

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const rolesFromItems = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of items) {
      const r = String(it?.executive?.role || '').toLowerCase();
      const n = String(it?.executive?.name || '');
      if (r) m.set(r, n);
    }
    const out = Array.from(m.entries()).map(([r, n]) => ({ value: r, label: `${r.toUpperCase()}${n ? ` — ${n}` : ''}` }));
    out.sort((a, b) => a.label.localeCompare(b.label));
    return [{ value: 'all', label: 'Todos' }, ...out];
  }, [items]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '60');
      if (role !== 'all') params.set('role', role);
      if (q.trim()) params.set('q', q.trim());
      if (knowledgeType.trim()) params.set('knowledge_type', knowledgeType.trim());
      if (category.trim()) params.set('category', category.trim());

      const res = await fetch(`/api/admin/csuite/knowledge?${params.toString()}`, { method: 'GET' });
      const json = await res.json();
      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      toast.error(String(e?.message || 'Falha ao carregar'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    const key = formKey.trim();
    if (!key) return toast.error('Key é obrigatório');

    let value: any;
    try {
      value = JSON.parse(formValueJson);
    } catch {
      return toast.error('Value precisa ser um JSON válido');
    }

    const confidence = Number(formConfidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      return toast.error('Confidence deve ser entre 0 e 1 (ex.: 0.85)');
    }

    setBusyId('save');
    try {
      const res = await fetch('/api/admin/csuite/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: formRole,
          knowledge_type: formType,
          category: formCategory || null,
          key,
          value,
          confidence,
          source: formSource || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao salvar');
      toast.success('Salvo.');
      setFormKey('');
      setFormValueJson('{\n  "text": ""\n}');
      await load();
    } catch (e: any) {
      toast.error(String(e?.message || 'Falha ao salvar'));
    } finally {
      setBusyId(null);
    }
  };

  const askDelete = (id: string) => setConfirmDelete({ open: true, id });

  const doDelete = async () => {
    const id = confirmDelete?.id;
    if (!id) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/csuite/knowledge/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao excluir');
      toast.success('Excluído.');
      await load();
    } catch (e: any) {
      toast.error(String(e?.message || 'Falha ao excluir'));
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Memória & Conhecimento (C‑Suite)</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Cadastre “regras”, “decisões” e “benchmarks” para os executivos reutilizarem em chats/insights.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="px-3 py-2 rounded-xl border text-sm flex items-center gap-2 hover:opacity-90"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Link className="underline" href="/admin/diretoria">
            <span className="inline-flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Building2 className="w-4 h-4" /> Voltar para Diretoria
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Form */}
          <div className="p-5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Novo item</h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Executivo</label>
                  <select
                    className="mt-1 w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                  >
                    {['ceo', 'cfo', 'cmo', 'cto', 'coo', 'cco', 'chro'].map((r) => (
                      <option key={r} value={r}>{r.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tipo</label>
                  <select
                    className="mt-1 w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                  >
                    {['policy', 'decision', 'benchmark', 'playbook', 'note'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Key (única por executivo + tipo)</label>
                <input
                  className="mt-1 w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  placeholder="ex: pricing_policy_v1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
                  <input
                    className="mt-1 w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="financial/marketing/..."
                  />
                </div>
                <div>
                  <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Confiança (0–1)</label>
                  <input
                    className="mt-1 w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                    value={formConfidence}
                    onChange={(e) => setFormConfidence(e.target.value)}
                    placeholder="0.85"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Fonte (opcional)</label>
                <input
                  className="mt-1 w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  placeholder="ex: decisão em reunião 2026-01-08"
                />
              </div>

              <div>
                <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Value (JSON)</label>
                <textarea
                  className="mt-1 w-full px-3 py-2 rounded-xl border text-xs min-h-[160px]"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
                  value={formValueJson}
                  onChange={(e) => setFormValueJson(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={() => void save()}
                disabled={busyId === 'save'}
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              >
                <Save className="w-4 h-4" />
                {busyId === 'save' ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2 p-5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Itens cadastrados</h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{items.length} itens</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {rolesFromItems.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input
                  className="px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                  value={knowledgeType}
                  onChange={(e) => setKnowledgeType(e.target.value)}
                  placeholder="knowledge_type (ex: policy)"
                />
                <input
                  className="px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="categoria (ex: financial)"
                />
                <input
                  className="px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="buscar por key/categoria..."
                />
                <button
                  type="button"
                  onClick={() => void load()}
                  className="px-3 py-2 rounded-xl border text-sm hover:opacity-90"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                >
                  Filtrar
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.slice(0, 60).map((it) => (
                <div key={it.id} className="p-4 rounded-2xl border" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {(it.executive?.role ? String(it.executive.role).toUpperCase() : 'C‑Suite')} • {it.knowledge_type} • <span className="font-mono">{it.key}</span>
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {it.category || 'sem categoria'} • conf: {it.confidence ?? '—'} • usos: {Number(it.times_referenced || 0)} • {fmtDate(it.updated_at || it.created_at || null)}
                        {it.source ? ` • fonte: ${it.source}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busyId === it.id}
                      onClick={() => askDelete(it.id)}
                      className="px-3 py-2 rounded-xl border text-sm hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
                      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                  <pre className="mt-3 text-xs whitespace-pre-wrap break-words" style={{ color: 'var(--text-secondary)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                    {JSON.stringify(it.value ?? {}, null, 2)}
                  </pre>
                </div>
              ))}

              {!loading && items.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sem itens ainda.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmDelete?.open)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        title="Excluir item"
        message="Tem certeza que deseja excluir este item de conhecimento?"
        confirmText="Excluir"
        cancelText="Voltar"
        variant="danger"
        loading={Boolean(confirmDelete?.id && busyId === confirmDelete.id)}
      />
    </div>
  );
}

