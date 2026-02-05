'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, Building2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/ui/Modal';

type AuditPayload = {
  success: boolean;
  role: string | null;
  limit: number;
  executives: Array<{ id: string; role: string; name: string; title: string }>;
  meetings: any[];
  decisions: any[];
  drafts: any[];
  warning?: string;
};

function fmtDate(s?: string | null) {
  if (!s) return '';
  try {
    return new Date(s).toLocaleString('pt-BR');
  } catch {
    return String(s);
  }
}

function pill(status: string) {
  const s = String(status || '').toLowerCase();
  if (['completed', 'executed', 'approved', 'connected', 'ok', 'pass'].includes(s)) return 'border-green-300 bg-green-50 text-green-700';
  if (['running', 'scheduled', 'in_progress'].includes(s)) return 'border-blue-300 bg-blue-50 text-blue-700';
  if (['cancelled', 'failed', 'rejected', 'error'].includes(s)) return 'border-red-300 bg-red-50 text-red-700';
  return 'border-yellow-300 bg-yellow-50 text-yellow-800';
}

export default function CsuiteHistoricoPage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('all');
  const [data, setData] = useState<AuditPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [busyDraftId, setBusyDraftId] = useState<string | null>(null);
  const [busyCloneDraftId, setBusyCloneDraftId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ open: boolean; action: 'execute' | 'cancel'; draftId: string } | null>(null);
  const [busyDecisionId, setBusyDecisionId] = useState<string | null>(null);
  const [confirmDecision, setConfirmDecision] = useState<{ open: boolean; action: 'approve' | 'reject'; decisionId: string } | null>(null);

  const roleOptions = useMemo(() => {
    const execs = data?.executives || [];
    const base = [{ value: 'all', label: 'Todos' }];
    const sorted = execs
      .map((e) => ({ value: String(e.role), label: `${String(e.role).toUpperCase()} — ${e.name}` }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [...base, ...sorted];
  }, [data?.executives]);

  const load = async (nextRole?: string) => {
    setLoading(true);
    setErr(null);
    try {
      const q = new URLSearchParams();
      const r = nextRole ?? role;
      if (r && r !== 'all') q.set('role', r);
      q.set('limit', '25');
      const res = await fetch(`/api/admin/csuite/audit?${q.toString()}`, { method: 'GET' });
      const json = (await res.json()) as AuditPayload;
      setData(json);
      if (json?.warning) {
        // warning não bloqueia
        console.warn('audit warning:', json.warning);
      }
    } catch (e: any) {
      setErr(String(e?.message || 'Falha ao carregar'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPreview = (a: any) => {
    setPreviewItem(a);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewItem(null);
  };

  async function postJson(url: string, body: any, timeoutMs = 20_000): Promise<any> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Falha ao executar');
      }
      return json;
    } finally {
      clearTimeout(t);
    }
  };

  const askExecute = (draftId: string) => {
    if (!draftId) return;
    // Se o usuário está no modal de preview (z-index alto), fechamos antes de abrir o ConfirmModal
    // para evitar o overlay interceptar cliques.
    if (previewOpen) {
      setPreviewOpen(false);
      setPreviewItem(null);
    }
    setConfirm({ open: true, action: 'execute', draftId });
  };

  const askCancel = (draftId: string) => {
    if (!draftId) return;
    if (previewOpen) {
      setPreviewOpen(false);
      setPreviewItem(null);
    }
    setConfirm({ open: true, action: 'cancel', draftId });
  };

  const runConfirmed = async () => {
    const c = confirm;
    if (!c?.draftId) return;
    setBusyDraftId(c.draftId);
    try {
      if (c.action === 'execute') {
        await postJson('/api/admin/csuite/actions/confirm', { draft_id: c.draftId });
        toast.success('Ação executada.');
      } else {
        await postJson('/api/admin/csuite/actions/cancel', { draft_id: c.draftId });
        toast.success('Rascunho cancelado.');
      }
      await load();
    } catch (e: any) {
      const msg = String(e?.message || 'Falha');
      toast.error(msg);
    } finally {
      setBusyDraftId(null);
      setConfirm(null);
    }
  };

  const extractDraftError = (a: any): string | null => {
    const status = String(a?.status || '').toLowerCase();
    if (status !== 'failed') return null;
    const er = a?.execution_result;
    const msg = String(er?.error || a?.error_message || '').trim();
    return msg || 'Falha ao executar (sem detalhes).';
  };

  const kanbanLinkForDraft = (a: any): string | null => {
    const entityType = String(a?.execution_result?.entity_type || '').trim();
    const entityId = String(a?.execution_result?.entity_id || '').trim();
    if (entityType !== 'kanban_tasks' || !entityId) return null;
    // Admin tem atalho para /admin/kanban-app (que reusa o Kanban do app)
    return `/admin/kanban-app?task=${encodeURIComponent(entityId)}`;
  };

  const cloneDraft = async (a: any) => {
    const id = String(a?.id || '').trim();
    if (!id) return;
    const role = String(a?.executive?.role || '').trim();
    const actionType = String(a?.action_type || '').trim();
    const payload = a?.action_payload ?? null;
    if (!role) {
      toast.error('Não foi possível determinar o role do executivo para clonar este rascunho.');
      return;
    }
    if (!actionType) {
      toast.error('action_type inválido no rascunho.');
      return;
    }
    if (!payload || typeof payload !== 'object') {
      toast.error('payload inválido no rascunho.');
      return;
    }

    setBusyCloneDraftId(id);
    try {
      const res = await postJson('/api/admin/csuite/actions/draft', {
        role,
        action_type: actionType,
        payload: {
          ...payload,
          metadata: {
            ...(payload?.metadata || {}),
            cloned_from_draft_id: id,
            cloned_at: new Date().toISOString(),
          },
        },
        preview: {
          ...(a?.preview || {}),
          cloned_from_draft_id: id,
        },
        risk_level: a?.risk_level || 'medium',
      });
      const newId = String(res?.draft?.id || '').trim();
      toast.success(newId ? 'Rascunho clonado.' : 'Rascunho clonado (id indisponível).');
      await load();
    } catch (e: any) {
      toast.error(String(e?.message || 'Falha ao clonar rascunho'));
    } finally {
      setBusyCloneDraftId(null);
    }
  };

  const askDecisionApprove = (decisionId: string) => {
    if (!decisionId) return;
    setConfirmDecision({ open: true, action: 'approve', decisionId });
  };

  const askDecisionReject = (decisionId: string) => {
    if (!decisionId) return;
    setConfirmDecision({ open: true, action: 'reject', decisionId });
  };

  const runDecisionConfirmed = async () => {
    const c = confirmDecision;
    if (!c?.decisionId) return;
    setBusyDecisionId(c.decisionId);
    try {
      if (c.action === 'approve') {
        await postJson('/api/admin/csuite/decisions/approve', { decision_id: c.decisionId });
        toast.success('Decisão aprovada.');
      } else {
        await postJson('/api/admin/csuite/decisions/reject', { decision_id: c.decisionId });
        toast.success('Decisão rejeitada.');
      }
      await load();
    } catch (e: any) {
      toast.error(String(e?.message || 'Falha'));
    } finally {
      setBusyDecisionId(null);
      setConfirmDecision(null);
    }
  };

  const generateDraftsFromDecision = async (decisionId: string) => {
    if (!decisionId) return;
    setBusyDecisionId(decisionId);
    try {
      const res = await postJson('/api/admin/csuite/decisions/drafts/generate', { decision_id: decisionId });
      const created = Number(res?.created || 0);
      if (created > 0) toast.success(`Rascunhos gerados: ${created}`);
      else toast.message('Nada novo para gerar (já existe para esta decisão).');
      await load();
    } catch (e: any) {
      toast.error(String(e?.message || 'Falha ao gerar rascunhos'));
    } finally {
      setBusyDecisionId(null);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Histórico C‑Suite</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Auditoria de <b>reuniões</b>, <b>decisões</b> e <b>rascunhos de ações</b> (modo consultivo).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              value={role}
              onChange={(e) => {
                const v = e.target.value;
                setRole(v);
                void load(v);
              }}
            >
              {roleOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

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

        {err ? (
          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{err}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Reuniões */}
          <div className="p-5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Reuniões</h2>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{(data?.meetings || []).length} itens</span>
            </div>
            <div className="space-y-3">
              {(data?.meetings || []).slice(0, 12).map((m: any) => (
                <div key={m.id} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.title}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {fmtDate(m.created_at)} • {String(m.meeting_type || '').toUpperCase()}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full border text-xs ${pill(m.status)}`}>{String(m.status || '')}</span>
                  </div>
                  {m.outcome_summary ? (
                    <p className="text-xs mt-2 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{m.outcome_summary}</p>
                  ) : null}
                </div>
              ))}
              {!loading && (data?.meetings || []).length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sem reuniões ainda.</p>
              ) : null}
            </div>
          </div>

          {/* Decisões */}
          <div className="p-5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Decisões</h2>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{(data?.decisions || []).length} itens</span>
            </div>
            <div className="space-y-3">
              {(data?.decisions || []).slice(0, 12).map((d: any) => (
                <div key={d.id} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{d.title}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {fmtDate(d.created_at)} • {String(d.decision_type || '').toUpperCase()}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full border text-xs ${pill(d.status)}`}>{String(d.status || '')}</span>
                  </div>
                  {d.description ? (
                    <p className="text-xs mt-2 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{d.description}</p>
                  ) : null}
                  {String(d.status || '').toLowerCase() === 'proposed' && d.human_approval_required !== false ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busyDecisionId === d.id}
                        onClick={() => askDecisionApprove(String(d.id))}
                        className="px-3 py-1.5 rounded-lg border text-xs hover:opacity-90 disabled:opacity-60"
                        style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                      >
                        {busyDecisionId === d.id ? 'Processando...' : 'Aprovar'}
                      </button>
                      <button
                        type="button"
                        disabled={busyDecisionId === d.id}
                        onClick={() => askDecisionReject(String(d.id))}
                        className="px-3 py-1.5 rounded-lg border text-xs hover:opacity-90 disabled:opacity-60"
                        style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                      >
                        Rejeitar
                      </button>
                    </div>
                  ) : null}
                  {String(d.status || '').toLowerCase() === 'approved' ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busyDecisionId === d.id}
                        onClick={() => generateDraftsFromDecision(String(d.id))}
                        className="px-3 py-1.5 rounded-lg border text-xs hover:opacity-90 disabled:opacity-60"
                        style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                        title="Gera rascunhos consultivos (tasks/reunião) a partir do plano da decisão"
                      >
                        {busyDecisionId === d.id ? 'Gerando...' : 'Gerar rascunhos (CTAs)'}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
              {!loading && (data?.decisions || []).length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sem decisões ainda.</p>
              ) : null}
            </div>
          </div>

          {/* Rascunhos */}
          <div className="p-5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Rascunhos de Ações</h2>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{(data?.drafts || []).length} itens</span>
            </div>
            <div className="space-y-3">
              {(data?.drafts || []).slice(0, 12).map((a: any) => (
                <div key={a.id} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {a?.executive?.role ? String(a.executive.role).toUpperCase() : 'C‑Suite'} • {String(a.action_type || 'ação')}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {fmtDate(a.created_at)} • risco: {String(a.risk_level || 'medium')}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full border text-xs ${pill(a.status)}`}>{String(a.status || '')}</span>
                  </div>
                  {extractDraftError(a) ? (
                    <p className="text-xs mt-2 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-semibold">Erro:</span> {extractDraftError(a)}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openPreview(a)}
                      className="px-3 py-1.5 rounded-lg border text-xs hover:opacity-90"
                      style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                    >
                      Ver preview
                    </button>
                    {String(a.status || '').toLowerCase() === 'draft' ? (
                      <>
                        <button
                          type="button"
                          disabled={busyDraftId === a.id}
                          onClick={() => askExecute(String(a.id))}
                          className="px-3 py-1.5 rounded-lg border text-xs hover:opacity-90 disabled:opacity-60"
                          style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                          title="Executa apenas ações internas suportadas (consultivo → confirmação)"
                        >
                          {busyDraftId === a.id ? 'Executando...' : 'Executar (confirmar)'}
                        </button>
                        <button
                          type="button"
                          disabled={busyDraftId === a.id}
                          onClick={() => askCancel(String(a.id))}
                          className="px-3 py-1.5 rounded-lg border text-xs hover:opacity-90 disabled:opacity-60"
                          style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        {kanbanLinkForDraft(a) ? (
                          <Link
                            href={kanbanLinkForDraft(a) as string}
                            className="px-3 py-1.5 rounded-lg border text-xs hover:opacity-90"
                            style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                            title="Abrir Kanban (task criada por este rascunho)"
                          >
                            Abrir no Kanban
                          </Link>
                        ) : null}

                        {String(a.status || '').toLowerCase() === 'failed' ? (
                          <button
                            type="button"
                            disabled={busyCloneDraftId === a.id}
                            onClick={() => cloneDraft(a)}
                            className="px-3 py-1.5 rounded-lg border text-xs hover:opacity-90 disabled:opacity-60"
                            style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                            title="Cria um novo rascunho idêntico para tentar executar novamente"
                          >
                            {busyCloneDraftId === a.id ? 'Clonando...' : 'Tentar novamente'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busyCloneDraftId === a.id}
                            onClick={() => cloneDraft(a)}
                            className="px-3 py-1.5 rounded-lg border text-xs hover:opacity-90 disabled:opacity-60"
                            style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                            title="Clona este rascunho"
                          >
                            {busyCloneDraftId === a.id ? 'Clonando...' : 'Clonar'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              {!loading && (data?.drafts || []).length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sem rascunhos ainda.</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Preview modal (consultivo) */}
        {previewOpen ? (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <div
              className="w-full max-w-3xl rounded-2xl border p-4"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    Preview do rascunho
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {previewItem?.executive?.role ? String(previewItem.executive.role).toUpperCase() : 'C‑Suite'} • {String(previewItem?.action_type || '')} • {fmtDate(previewItem?.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePreview}
                  className="px-3 py-1.5 rounded-lg border text-xs hover:opacity-90"
                  style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
                >
                  Fechar
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Preview</p>
                  <pre className="text-xs whitespace-pre-wrap break-words" style={{ color: 'var(--text-secondary)' }}>
                    {JSON.stringify(previewItem?.preview ?? {}, null, 2)}
                  </pre>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Payload</p>
                  <pre className="text-xs whitespace-pre-wrap break-words" style={{ color: 'var(--text-secondary)' }}>
                    {JSON.stringify(previewItem?.action_payload ?? {}, null, 2)}
                  </pre>
                </div>
              </div>

              {String(previewItem?.status || '').toLowerCase() === 'draft' ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busyDraftId === String(previewItem?.id || '')}
                    onClick={() => askExecute(String(previewItem?.id || ''))}
                    className="px-3 py-2 rounded-xl border text-sm hover:opacity-90 disabled:opacity-60"
                    style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    {busyDraftId === String(previewItem?.id || '') ? 'Executando...' : 'Executar (confirmar)'}
                  </button>
                  <button
                    type="button"
                    disabled={busyDraftId === String(previewItem?.id || '')}
                    onClick={() => askCancel(String(previewItem?.id || ''))}
                    className="px-3 py-2 rounded-xl border text-sm hover:opacity-90 disabled:opacity-60"
                    style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <ConfirmModal
          isOpen={Boolean(confirm?.open)}
          onClose={() => setConfirm(null)}
          onConfirm={runConfirmed}
          title={confirm?.action === 'execute' ? 'Confirmar execução' : 'Confirmar cancelamento'}
          message={
            confirm?.action === 'execute'
              ? 'Você quer executar este rascunho agora? (Apenas ações internas suportadas; sem terceiros)'
              : 'Você quer cancelar este rascunho?'
          }
          confirmText={confirm?.action === 'execute' ? 'Executar' : 'Cancelar rascunho'}
          cancelText="Voltar"
          variant={confirm?.action === 'execute' ? 'warning' : 'danger'}
          loading={Boolean(confirm?.draftId && busyDraftId === confirm.draftId)}
        />

        <ConfirmModal
          isOpen={Boolean(confirmDecision?.open)}
          onClose={() => setConfirmDecision(null)}
          onConfirm={runDecisionConfirmed}
          title={confirmDecision?.action === 'approve' ? 'Aprovar decisão' : 'Rejeitar decisão'}
          message={
            confirmDecision?.action === 'approve'
              ? 'Você quer aprovar esta decisão agora?'
              : 'Você quer rejeitar esta decisão?'
          }
          confirmText={confirmDecision?.action === 'approve' ? 'Aprovar' : 'Rejeitar'}
          cancelText="Voltar"
          variant={confirmDecision?.action === 'approve' ? 'warning' : 'danger'}
          loading={Boolean(confirmDecision?.decisionId && busyDecisionId === confirmDecision.decisionId)}
        />
      </div>
    </div>
  );
}

