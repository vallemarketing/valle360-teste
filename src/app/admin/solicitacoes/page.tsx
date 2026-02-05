'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Search, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';

type RequestStatus = 'pending' | 'approved' | 'rejected';

type RequestRow = {
  id: string;
  title?: string;
  type: string;
  start_date?: string | null;
  end_date?: string | null;
  reason?: string | null;
  amount?: string | null;
  status: RequestStatus;
  employee_request_id?: string | null;
  requester_name?: string | null;
  created_at?: string;
};

export default function AdminSolicitacoesPage() {
  const [items, setItems] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | RequestStatus>('all');
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/requests?all=1');
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao carregar solicitações');
      setItems((data.requests || []) as RequestRow[]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao carregar';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (items || []).filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (!term) return true;
      const hay = [r.title, r.type, r.reason, r.start_date, r.end_date, r.amount].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(term);
    });
  }, [items, q, status]);

  const badgeCls = (s: RequestStatus) => {
    if (s === 'approved') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (s === 'rejected') return 'bg-red-500/10 text-red-600 border-red-500/20';
    return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  };

  const setRequestStatus = async (taskId: string, next: 'approved' | 'rejected') => {
    const rejectionReason =
      next === 'rejected'
        ? window.prompt('Motivo da rejeição (mínimo 10 caracteres):') || ''
        : '';
    if (next === 'rejected' && rejectionReason.trim().length < 10) {
      return toast.error('Motivo muito curto (mínimo 10 caracteres).');
    }

    setActing(taskId);
    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          status: next,
          rejection_reason: next === 'rejected' ? rejectionReason.trim() : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao atualizar');
      toast.success(next === 'approved' ? 'Solicitação aprovada!' : 'Solicitação rejeitada!');
      await load();
    } catch (e: any) {
      toast.error(String(e?.message || e));
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Solicitações (RH / Operação)</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Dados reais (sem mock): vem de <code>/api/requests</code> e gera tarefas no Kanban.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/kanban-app"
              className="px-4 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            >
              Abrir Kanban
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
          className="rounded-2xl border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <div className="flex items-center gap-2 w-full md:w-[420px]">
            <Search className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por tipo, motivo, datas…"
              className="w-full bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className="px-3 py-1.5 rounded-xl text-xs border"
                style={{
                  backgroundColor: status === s ? 'var(--primary-50)' : 'transparent',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)',
                }}
              >
                {s === 'all' ? 'Todas' : s === 'pending' ? 'Pendentes' : s === 'approved' ? 'Aprovadas' : 'Rejeitadas'}
              </button>
            ))}
          </div>
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
              <EmptyState
                type="default"
                title="Não foi possível carregar"
                description={error}
                animated={false}
                action={{ label: 'Tentar novamente', onClick: load }}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                type="tasks"
                title="Nenhuma solicitação encontrada"
                description="Quando colaboradores enviarem solicitações, elas aparecerão aqui."
                animated={false}
                action={{ label: 'Abrir Kanban', onClick: () => (window.location.href = '/admin/kanban-app') }}
              />
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
              {filtered.map((r) => (
                <div key={r.id} className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {r.title || `Solicitação (${r.type})`}
                      {r.requester_name ? (
                        <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>
                          • {r.requester_name}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {r.start_date ? `${r.start_date}${r.end_date ? ` → ${r.end_date}` : ''}` : ''}
                      {r.created_at ? ` • criado em ${String(r.created_at).slice(0, 10)}` : ''}
                    </div>
                    {r.reason ? (
                      <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {r.reason}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${badgeCls(r.status)}`}>{r.status}</span>
                    {r.status === 'pending' ? (
                      <>
                        <button
                          disabled={acting === r.id}
                          onClick={() => setRequestStatus(r.id, 'approved')}
                          className="px-3 py-1.5 rounded-xl text-xs border flex items-center gap-1"
                          style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          disabled={acting === r.id}
                          onClick={() => setRequestStatus(r.id, 'rejected')}
                          className="px-3 py-1.5 rounded-xl text-xs border flex items-center gap-1"
                          style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </>
                    ) : null}
                    <Link
                      href="/admin/kanban-app"
                      className="text-xs underline"
                      style={{ color: 'var(--primary-500)' }}
                    >
                      Ver no Kanban
                    </Link>
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


