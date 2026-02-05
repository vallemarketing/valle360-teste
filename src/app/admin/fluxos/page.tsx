'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Play, Eye, KanbanSquare, RotateCcw, History, Copy } from 'lucide-react';

type WorkflowStatus = 'pending' | 'completed' | 'error';

type WorkflowTransitionRow = {
  id: string;
  from_area: string;
  to_area: string;
  trigger_event: string;
  data_payload: any;
  status: WorkflowStatus | string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  created_by: string | null;
};

type EventRow = {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  actor_user_id: string | null;
  payload: any;
  status: string;
  error_message: string | null;
  correlation_id: string | null;
  created_at: string;
  processed_at: string | null;
};

function statusBadge(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'pending') return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">Pendente</Badge>;
  if (s === 'completed' || s === 'processed') return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">OK</Badge>;
  if (s === 'error') return <Badge className="bg-red-500/10 text-red-700 border-red-500/30">Erro</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function normalizeStatusForTab(tab: 'transitions' | 'events', status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'all' || s === 'pending' || s === 'error') return s;
  if (tab === 'events') {
    if (s === 'completed') return 'processed';
    if (s === 'processed') return 'processed';
    return s;
  }
  // transitions
  if (s === 'processed') return 'completed';
  if (s === 'completed') return 'completed';
  return s;
}

function getKanbanLinkFromTransition(t: WorkflowTransitionRow): string | null {
  const p: any = t?.data_payload || {};
  const boardId = p.kanban_board_id || p.board_id;
  const taskId = p.kanban_task_id || p.task_id;
  if (!boardId || !taskId) return null;
  return `/admin/meu-kanban?boardId=${encodeURIComponent(String(boardId))}&taskId=${encodeURIComponent(String(taskId))}`;
}

function extractIdsFromPayload(payload: any) {
  const p: any = payload || {};
  return {
    client_id: p.client_id || p.clientId || null,
    proposal_id: p.proposal_id || null,
    contract_id: p.contract_id || null,
    invoice_id: p.invoice_id || null,
    correlation_id: p.correlation_id || null,
    executed_at: p.executed_at || null,
    executed_by: p.executed_by || null,
    completed_note: p.completed_note || null,
    completed_at: p.completed_at || null,
    completed_by: p.completed_by || null,
    reopened_note: p.reopened_note || null,
    reopened_at: p.reopened_at || null,
    reopened_by: p.reopened_by || null,
    error_resolved_note: p.error_resolved_note || null,
    error_resolved_at: p.error_resolved_at || null,
    error_resolved_by: p.error_resolved_by || null,
    marked_error_note: p.marked_error_note || null,
    marked_error_at: p.marked_error_at || null,
    marked_error_by: p.marked_error_by || null,
    rerouted_note: p.rerouted_note || null,
    rerouted_at: p.rerouted_at || null,
    rerouted_by: p.rerouted_by || null,
    rerouted_from_area: p.rerouted_from_area || null,
    rerouted_to_area: p.rerouted_to_area || null,
    previous_executions: Array.isArray(p.previous_executions) ? p.previous_executions : null,
    reroute_history: Array.isArray(p.reroute_history) ? p.reroute_history : null,
    source_event_id: p.source_event_id || null,
  };
}

function shortUser(u: any) {
  if (!u) return null;
  const s = String(u);
  return s.length > 10 ? `${s.slice(0, 8)}…` : s;
}

function safeDateLabel(v: any) {
  if (!v) return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('pt-BR');
}

function buildTransitionHistory(t: WorkflowTransitionRow) {
  const p: any = t?.data_payload || {};
  const ids = extractIdsFromPayload(p);

  const items: Array<{ at: any; label: string; by?: any; note?: any; extra?: any }> = [];

  items.push({ at: t.created_at, label: 'Criado', by: t.created_by, extra: { from: t.from_area, to: t.to_area, trigger: t.trigger_event } });

  if (ids.marked_error_at || ids.marked_error_note) {
    items.push({ at: ids.marked_error_at, label: 'Marcado como erro', by: ids.marked_error_by, note: ids.marked_error_note });
  }
  if (ids.error_resolved_at || ids.error_resolved_note) {
    items.push({ at: ids.error_resolved_at, label: 'Erro resolvido (volta p/ pendente)', by: ids.error_resolved_by, note: ids.error_resolved_note });
  }
  if (ids.reopened_at || ids.reopened_note) {
    items.push({ at: ids.reopened_at, label: 'Reaberto', by: ids.reopened_by, note: ids.reopened_note });
  }
  if (ids.rerouted_at || ids.rerouted_note) {
    items.push({
      at: ids.rerouted_at,
      label: 'Encaminhado',
      by: ids.rerouted_by,
      note: ids.rerouted_note,
      extra: { from: ids.rerouted_from_area, to: ids.rerouted_to_area },
    });
  }

  if (ids.executed_at || p.kanban_task_id || p.kanban_board_id) {
    items.push({
      at: ids.executed_at,
      label: 'Executado (Kanban)',
      by: ids.executed_by,
      extra: { kanban_task_id: p.kanban_task_id, kanban_board_id: p.kanban_board_id },
    });
  }

  if (ids.completed_note || t.completed_at) {
    items.push({
      at: ids.completed_at || t.completed_at,
      label: 'Concluído (manual)',
      by: ids.completed_by || p.completed_by,
      note: ids.completed_note,
    });
  }

  const prevExec = ids.previous_executions || [];
  for (const ex of prevExec) {
    if (!ex) continue;
    items.push({
      at: ex.executed_at || ex.at,
      label: 'Execução anterior (resetada)',
      by: ex.executed_by || ex.by,
      note: ex.note,
      extra: { kanban_task_id: ex.kanban_task_id, kanban_board_id: ex.kanban_board_id, reason: ex.reason, action: ex.action },
    });
  }

  const reroutes = ids.reroute_history || [];
  for (const r of reroutes) {
    if (!r) continue;
    items.push({
      at: r.rerouted_at || r.at,
      label: 'Encaminhamento (histórico)',
      by: r.rerouted_by || r.by,
      note: r.rerouted_note || r.note,
      extra: { from: r.from_area || r.from, to: r.to_area || r.to },
    });
  }

  // ordena por data (se inválida, joga p/ fim)
  const withTime = items.map((it) => {
    const dt = it.at ? new Date(String(it.at)).getTime() : NaN;
    return { ...it, __ts: dt };
  });
  withTime.sort((a, b) => {
    const ta = Number.isNaN(a.__ts) ? Number.POSITIVE_INFINITY : a.__ts;
    const tb = Number.isNaN(b.__ts) ? Number.POSITIVE_INFINITY : b.__ts;
    return ta - tb;
  });
  return { ids, items: withTime };
}

function FluxosContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'transitions' | 'events'>('transitions');
  const [loading, setLoading] = useState(false);

  const [transitions, setTransitions] = useState<WorkflowTransitionRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);

  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterText, setFilterText] = useState('');

  const [openPayload, setOpenPayload] = useState<{ title: string; json: any } | null>(null);
  const [openHistory, setOpenHistory] = useState<WorkflowTransitionRow | null>(null);
  const [completeDialog, setCompleteDialog] = useState<{ id: string; note: string } | null>(null);
  const [reopenDialog, setReopenDialog] = useState<{ id: string; note: string } | null>(null);
  const [resolveErrorDialog, setResolveErrorDialog] = useState<{ id: string; note: string } | null>(null);
  const [markErrorDialog, setMarkErrorDialog] = useState<{ id: string; note: string } | null>(null);
  const [rerouteDialog, setRerouteDialog] = useState<{ id: string; toArea: string; note: string } | null>(null);

  const availableAreas = useMemo(() => {
    const defaults = [
      'Comercial',
      'Jurídico',
      'Contratos',
      'Financeiro',
      'Operacao',
      'Admin',
      'RH',
      'Social Media',
      'Tráfego',
      'Design',
      'Vídeo',
    ];
    const fromTo = (transitions || [])
      .flatMap((t) => [t.from_area, t.to_area])
      .filter(Boolean)
      .map((s) => String(s));
    const set = new Set<string>([...defaults, ...fromTo]);

    // preserva ordem dos defaults e adiciona o resto em ordem alfabética
    const rest = Array.from(set).filter((x) => !defaults.includes(x));
    rest.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return [...defaults, ...rest];
  }, [transitions]);

  const filteredTransitions = useMemo(() => {
    const t = filterText.trim().toLowerCase();
    return (transitions || [])
      .filter((r) => (filterStatus === 'all' ? true : String(r.status).toLowerCase() === filterStatus))
      .filter((r) => {
        if (!t) return true;
        const payloadStr = (() => {
          try {
            return JSON.stringify(r.data_payload || {}).toLowerCase();
          } catch {
            return '';
          }
        })();
        return (
          String(r.from_area || '').toLowerCase().includes(t) ||
          String(r.to_area || '').toLowerCase().includes(t) ||
          String(r.trigger_event || '').toLowerCase().includes(t) ||
          String(r.error_message || '').toLowerCase().includes(t) ||
          payloadStr.includes(t)
        );
      });
  }, [transitions, filterStatus, filterText]);

  const filteredEvents = useMemo(() => {
    const t = filterText.trim().toLowerCase();
    return (events || [])
      .filter((r) => (filterStatus === 'all' ? true : String(r.status).toLowerCase() === filterStatus))
      .filter((r) => {
        if (!t) return true;
        const payloadStr = (() => {
          try {
            return JSON.stringify(r.payload || {}).toLowerCase();
          } catch {
            return '';
          }
        })();
        return (
          String(r.event_type || '').toLowerCase().includes(t) ||
          String(r.entity_type || '').toLowerCase().includes(t) ||
          String(r.error_message || '').toLowerCase().includes(t) ||
          payloadStr.includes(t)
        );
      });
  }, [events, filterStatus, filterText]);

  const stats = useMemo(() => {
    const t = transitions || [];
    const e = events || [];
    const count = (arr: any[], status: string) => arr.filter((x) => String(x.status).toLowerCase() === status).length;
    return {
      transitions: {
        pending: count(t, 'pending'),
        error: count(t, 'error'),
        completed: count(t, 'completed'),
        total: t.length,
      },
      events: {
        pending: count(e, 'pending'),
        error: count(e, 'error'),
        processed: count(e, 'processed'),
        total: e.length,
      },
    };
  }, [transitions, events]);

  const loadTransitions = useCallback(async () => {
    const res = await fetch(`/api/admin/workflow-transitions?limit=200`);
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || `Erro ao carregar fluxos [${res.status}]`);
    setTransitions(json?.transitions || []);
  }, []);

  const loadEvents = useCallback(async () => {
    const res = await fetch(`/api/admin/events?limit=200`);
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || `Erro ao carregar eventos [${res.status}]`);
    setEvents(json?.events || []);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadTransitions(), loadEvents()]);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao atualizar');
    } finally {
      setLoading(false);
    }
  }, [loadTransitions, loadEvents]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Permite deep-link: /admin/fluxos?tab=events&status=error&q=invoice.paid
  useEffect(() => {
    const tabParam = (searchParams.get('tab') || '').toLowerCase();
    const statusParam = (searchParams.get('status') || '').toLowerCase();
    const qParam = searchParams.get('q') || '';

    if (tabParam === 'events' || tabParam === 'transitions') {
      setTab(tabParam as any);
    }
    if (statusParam) {
      const normalized = normalizeStatusForTab(
        (tabParam === 'events' || tabParam === 'transitions') ? (tabParam as any) : tab,
        statusParam
      );
      setFilterStatus(normalized);
    }
    if (qParam) {
      setFilterText(qParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Se o usuário trocar aba, ajustar status "OK" para o equivalente correto.
  useEffect(() => {
    setFilterStatus((prev) => normalizeStatusForTab(tab, prev));
  }, [tab]);

  const updateTransitionStatus = async (id: string, status: WorkflowStatus, error_message?: string) => {
    try {
      const res = await fetch('/api/admin/workflow-transitions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, error_message }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Falha ao atualizar [${res.status}]`);
      toast.success('Fluxo atualizado');
      await loadTransitions();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao atualizar fluxo');
    }
  };

  const completeTransitionWithNote = async (id: string, note: string) => {
    try {
      const res = await fetch('/api/admin/workflow-transitions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'completed', note }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Falha ao concluir [${res.status}]`);
      toast.success('Transição concluída');
      await loadTransitions();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao concluir transição');
    }
  };

  const reopenTransitionWithNote = async (id: string, note: string) => {
    try {
      const res = await fetch('/api/admin/workflow-transitions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'pending', action: 'reopen', note }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Falha ao reabrir [${res.status}]`);
      toast.success('Transição reaberta');
      await loadTransitions();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao reabrir transição');
    }
  };

  const resolveErrorWithNote = async (id: string, note: string) => {
    try {
      const res = await fetch('/api/admin/workflow-transitions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'pending', action: 'resolve_error', note }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Falha ao resolver erro [${res.status}]`);
      toast.success('Erro resolvido (voltou para pendente)');
      await loadTransitions();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao resolver erro');
    }
  };

  const markErrorWithNote = async (id: string, note: string) => {
    try {
      const res = await fetch('/api/admin/workflow-transitions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'error', action: 'mark_error', note }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Falha ao marcar erro [${res.status}]`);
      toast.success('Transição marcada como erro');
      await loadTransitions();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao marcar erro');
    }
  };

  const rerouteTransition = async (id: string, toArea: string, note: string) => {
    try {
      const res = await fetch('/api/admin/workflow-transitions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'pending', action: 'reroute', to_area: toArea, note }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Falha ao encaminhar [${res.status}]`);
      toast.success('Transição encaminhada');
      await loadTransitions();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao encaminhar');
    }
  };

  const processPendingEvents = async () => {
    try {
      const res = await fetch('/api/admin/events/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Falha ao processar eventos [${res.status}]`);
      toast.success(`Eventos processados: ${json?.processed || 0} (falhas: ${json?.failed || 0})`);
      await refreshAll();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao processar eventos');
    }
  };

  const reprocessEvent = async (id: string) => {
    try {
      const res = await fetch('/api/admin/events/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Falha ao reprocessar [${res.status}]`);
      toast.success('Evento reprocessado');
      await refreshAll();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao reprocessar evento');
    }
  };

  const sendTransitionToKanban = async (id: string) => {
    try {
      const res = await fetch('/api/admin/workflow-transitions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Falha ao enviar para Kanban [${res.status}]`);
      toast.success('Enviado para Kanban e marcado como concluído');
      await refreshAll();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao enviar para Kanban');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f1a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#001533] dark:text-white">Central de Fluxos</h1>
            <p className="text-[#001533]/60 dark:text-white/60">
              Visualize a conversa entre áreas (eventos → transições → execução).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refreshAll} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={processPendingEvents} disabled={loading}>
              <Play className="w-4 h-4 mr-2" />
              Processar eventos pendentes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-[#001533]/10 dark:border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#001533]/70 dark:text-white/70">Transições</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold text-[#001533] dark:text-white">{stats.transitions.total}</div>
              <div className="flex gap-2">
                {statusBadge('pending')}
                <span className="text-sm text-[#001533]/60 dark:text-white/60">{stats.transitions.pending}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#001533]/10 dark:border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#001533]/70 dark:text-white/70">Eventos</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold text-[#001533] dark:text-white">{stats.events.total}</div>
              <div className="flex gap-2">
                {statusBadge('pending')}
                <span className="text-sm text-[#001533]/60 dark:text-white/60">{stats.events.pending}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#001533]/10 dark:border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#001533]/70 dark:text-white/70">Erros</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold text-[#001533] dark:text-white">
                {stats.transitions.error + stats.events.error}
              </div>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('pending')}
            >
              Pendentes
            </Button>
            <Button
              variant={filterStatus === 'error' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('error')}
            >
              Erros
            </Button>
            <Button
              variant={filterStatus === 'completed' || filterStatus === 'processed' ? 'default' : 'outline'}
              onClick={() => setFilterStatus(tab === 'transitions' ? 'completed' : 'processed')}
            >
              OK
            </Button>
            <Button variant={filterStatus === 'all' ? 'default' : 'outline'} onClick={() => setFilterStatus('all')}>
              Todos
            </Button>
          </div>
          <Input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Buscar (área, evento, erro...)"
            className="max-w-md"
          />
        </div>

        <Tabs
          value={tab}
          defaultValue={tab}
          onValueChange={(v) => setTab(v as 'events' | 'transitions')}
        >
          <TabsList>
            <TabsTrigger value="transitions">Transições</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
          </TabsList>

          <TabsContent value="transitions" className="mt-4">
            <Card className="border-[#001533]/10 dark:border-white/10">
              <CardHeader>
                <CardTitle>Workflow Transitions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredTransitions.length === 0 ? (
                  <div className="text-sm text-[#001533]/60 dark:text-white/60">Nenhuma transição encontrada.</div>
                ) : (
                  <div className="space-y-2">
                    {filteredTransitions.map((t) => (
                      (() => {
                        const kanbanLink = getKanbanLinkFromTransition(t);
                        const ids = extractIdsFromPayload(t.data_payload);
                        const execLabel =
                          ids.executed_at || ids.executed_by
                            ? `Executado${ids.executed_at ? ` em ${new Date(ids.executed_at).toLocaleString('pt-BR')}` : ''}${
                                ids.executed_by ? ` por ${String(ids.executed_by).slice(0, 8)}…` : ''
                              }`
                            : null;
                        const reopenLabel =
                          ids.reopened_at || ids.reopened_by
                            ? `Reaberto${ids.reopened_at ? ` em ${new Date(ids.reopened_at).toLocaleString('pt-BR')}` : ''}${
                                ids.reopened_by ? ` por ${String(ids.reopened_by).slice(0, 8)}…` : ''
                              }`
                            : null;
                        const resolvedLabel =
                          ids.error_resolved_at || ids.error_resolved_by
                            ? `Erro resolvido${ids.error_resolved_at ? ` em ${new Date(ids.error_resolved_at).toLocaleString('pt-BR')}` : ''}${
                                ids.error_resolved_by ? ` por ${String(ids.error_resolved_by).slice(0, 8)}…` : ''
                              }`
                            : null;
                        const markedErrorLabel =
                          ids.marked_error_at || ids.marked_error_by
                            ? `Marcado erro${ids.marked_error_at ? ` em ${new Date(ids.marked_error_at).toLocaleString('pt-BR')}` : ''}${
                                ids.marked_error_by ? ` por ${String(ids.marked_error_by).slice(0, 8)}…` : ''
                              }`
                            : null;
                        const reroutedLabel =
                          ids.rerouted_at || ids.rerouted_by
                            ? `Encaminhado${ids.rerouted_at ? ` em ${new Date(ids.rerouted_at).toLocaleString('pt-BR')}` : ''}${
                                ids.rerouted_by ? ` por ${String(ids.rerouted_by).slice(0, 8)}…` : ''
                              }`
                            : null;
                        return (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl border border-[#001533]/10 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#001533] dark:text-white">
                              {t.from_area} → {t.to_area}
                            </span>
                            {statusBadge(String(t.status))}
                            <Badge variant="outline">{t.trigger_event}</Badge>
                            {ids.client_id ? <Badge variant="outline">Cliente</Badge> : null}
                            {ids.proposal_id ? <Badge variant="outline">Proposta</Badge> : null}
                            {ids.contract_id ? <Badge variant="outline">Contrato</Badge> : null}
                            {ids.invoice_id ? <Badge variant="outline">Fatura</Badge> : null}
                          </div>
                          <div className="text-xs text-[#001533]/60 dark:text-white/60">
                            {new Date(t.created_at).toLocaleString('pt-BR')}
                            {t.error_message ? ` • ${t.error_message}` : ''}
                            {execLabel ? ` • ${execLabel}` : ''}
                            {ids.completed_note ? ` • Nota: ${String(ids.completed_note).slice(0, 120)}` : ''}
                            {reopenLabel ? ` • ${reopenLabel}` : ''}
                            {ids.reopened_note ? ` • Motivo: ${String(ids.reopened_note).slice(0, 120)}` : ''}
                            {resolvedLabel ? ` • ${resolvedLabel}` : ''}
                            {ids.error_resolved_note ? ` • Motivo: ${String(ids.error_resolved_note).slice(0, 120)}` : ''}
                            {markedErrorLabel ? ` • ${markedErrorLabel}` : ''}
                            {ids.marked_error_note ? ` • Motivo: ${String(ids.marked_error_note).slice(0, 120)}` : ''}
                            {reroutedLabel ? ` • ${reroutedLabel}` : ''}
                            {ids.rerouted_to_area ? ` • Para: ${String(ids.rerouted_to_area)}` : ''}
                            {ids.rerouted_note ? ` • Motivo: ${String(ids.rerouted_note).slice(0, 120)}` : ''}
                          </div>
                          {(ids.client_id || ids.proposal_id || ids.contract_id || ids.invoice_id || ids.correlation_id) ? (
                            <div className="text-[11px] text-[#001533]/50 dark:text-white/50 space-x-2">
                              {ids.client_id ? <span>client_id: {String(ids.client_id).slice(0, 10)}…</span> : null}
                              {ids.proposal_id ? <span>proposal_id: {String(ids.proposal_id).slice(0, 10)}…</span> : null}
                              {ids.contract_id ? <span>contract_id: {String(ids.contract_id).slice(0, 10)}…</span> : null}
                              {ids.invoice_id ? <span>invoice_id: {String(ids.invoice_id).slice(0, 10)}…</span> : null}
                              {ids.correlation_id ? <span>corr: {String(ids.correlation_id).slice(0, 10)}…</span> : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={async () => {
                              try {
                                const p: any = t.data_payload || {};
                                const idsToCopy = {
                                  transition_id: t.id,
                                  from_area: t.from_area,
                                  to_area: t.to_area,
                                  trigger_event: t.trigger_event,
                                  client_id: ids.client_id,
                                  proposal_id: ids.proposal_id,
                                  contract_id: ids.contract_id,
                                  invoice_id: ids.invoice_id,
                                  correlation_id: ids.correlation_id,
                                  source_event_id: ids.source_event_id,
                                  kanban_task_id: p.kanban_task_id || p.task_id || null,
                                  kanban_board_id: p.kanban_board_id || p.board_id || null,
                                };
                                await navigator.clipboard.writeText(JSON.stringify(idsToCopy, null, 2));
                                toast.success('IDs copiados');
                              } catch {
                                toast.error('Falha ao copiar');
                              }
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar IDs
                          </Button>
                          <Button variant="outline" onClick={() => setOpenHistory(t)}>
                            <History className="w-4 h-4 mr-2" />
                            Histórico
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setOpenPayload({ title: `Payload • ${t.trigger_event}`, json: t.data_payload })}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Payload
                          </Button>
                          {kanbanLink ? (
                            <Button variant="outline" onClick={() => window.location.assign(kanbanLink)}>
                              <KanbanSquare className="w-4 h-4 mr-2" />
                              Abrir no Kanban
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            onClick={() => sendTransitionToKanban(t.id)}
                            disabled={String(t.status).toLowerCase() !== 'pending'}
                          >
                            <KanbanSquare className="w-4 h-4 mr-2" />
                            Enviar para Kanban
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setCompleteDialog({ id: t.id, note: String(ids.completed_note || '') })}
                            disabled={String(t.status).toLowerCase() === 'completed'}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Concluir
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setReopenDialog({ id: t.id, note: String(ids.reopened_note || '') })}
                            disabled={String(t.status).toLowerCase() !== 'completed'}
                          >
                            Reabrir
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setResolveErrorDialog({ id: t.id, note: String(ids.error_resolved_note || '') })}
                            disabled={String(t.status).toLowerCase() !== 'error'}
                          >
                            Resolver erro
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setRerouteDialog({ id: t.id, toArea: String(t.to_area || ''), note: String(ids.rerouted_note || '') })
                            }
                            disabled={String(t.status).toLowerCase() !== 'pending'}
                          >
                            Encaminhar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setMarkErrorDialog({ id: t.id, note: String(ids.marked_error_note || '') })}
                            disabled={String(t.status).toLowerCase() === 'error'}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Erro
                          </Button>
                        </div>
                      </div>
                        );
                      })()
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <Card className="border-[#001533]/10 dark:border-white/10">
              <CardHeader>
                <CardTitle>Event Log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredEvents.length === 0 ? (
                  <div className="text-sm text-[#001533]/60 dark:text-white/60">Nenhum evento encontrado.</div>
                ) : (
                  <div className="space-y-2">
                    {filteredEvents.map((e) => (
                      <div
                        key={e.id}
                        className="p-4 rounded-xl border border-[#001533]/10 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#001533] dark:text-white">{e.event_type}</span>
                            {statusBadge(String(e.status))}
                            {e.entity_type ? <Badge variant="outline">{e.entity_type}</Badge> : null}
                          </div>
                          <div className="text-xs text-[#001533]/60 dark:text-white/60">
                            {new Date(e.created_at).toLocaleString('pt-BR')}
                            {e.error_message ? ` • ${e.error_message}` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setOpenPayload({ title: `Payload • ${e.event_type}`, json: e.payload })}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Payload
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => reprocessEvent(e.id)}
                            disabled={String(e.status).toLowerCase() !== 'error'}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reprocessar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!openHistory} onOpenChange={(o) => (!o ? setOpenHistory(null) : null)}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Histórico da transição</DialogTitle>
            </DialogHeader>
            {openHistory ? (
              (() => {
                const { ids, items } = buildTransitionHistory(openHistory);
                const kanbanLink = getKanbanLinkFromTransition(openHistory);
                const p: any = openHistory.data_payload || {};
                return (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-[#001533]/60 dark:text-white/60">
                        <span className="font-semibold text-[#001533] dark:text-white">
                          {openHistory.from_area} → {openHistory.to_area}
                        </span>{' '}
                        • {openHistory.trigger_event} • {statusBadge(String(openHistory.status))}
                      </div>
                      <div className="flex gap-2">
                        {kanbanLink ? (
                          <Button variant="outline" onClick={() => window.location.assign(kanbanLink)}>
                            <KanbanSquare className="w-4 h-4 mr-2" />
                            Abrir no Kanban
                          </Button>
                        ) : null}
                        <Button variant="outline" onClick={() => setOpenPayload({ title: `Payload • ${openHistory.trigger_event}`, json: p })}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver payload
                        </Button>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#001533]/50 dark:text-white/50 space-x-2">
                      <span>transition_id: {openHistory.id.slice(0, 10)}…</span>
                      {ids.client_id ? <span>client_id: {String(ids.client_id).slice(0, 10)}…</span> : null}
                      {ids.proposal_id ? <span>proposal_id: {String(ids.proposal_id).slice(0, 10)}…</span> : null}
                      {ids.contract_id ? <span>contract_id: {String(ids.contract_id).slice(0, 10)}…</span> : null}
                      {ids.invoice_id ? <span>invoice_id: {String(ids.invoice_id).slice(0, 10)}…</span> : null}
                      {ids.correlation_id ? <span>corr: {String(ids.correlation_id).slice(0, 10)}…</span> : null}
                      {ids.source_event_id ? <span>source_event_id: {String(ids.source_event_id).slice(0, 10)}…</span> : null}
                    </div>

                    <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                      {items.length === 0 ? (
                        <div className="text-sm text-[#001533]/60 dark:text-white/60">Sem histórico.</div>
                      ) : (
                        items.map((it, idx) => (
                          <div key={idx} className="rounded-lg border border-[#001533]/10 dark:border-white/10 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="text-sm font-semibold text-[#001533] dark:text-white">{it.label}</div>
                              <div className="text-xs text-[#001533]/60 dark:text-white/60">
                                {safeDateLabel(it.at) ? safeDateLabel(it.at) : '—'}
                                {it.by ? ` • ${shortUser(it.by)}` : ''}
                              </div>
                            </div>
                            {it.note ? (
                              <div className="text-xs text-[#001533]/70 dark:text-white/70 mt-1 whitespace-pre-wrap">
                                {String(it.note)}
                              </div>
                            ) : null}
                            {it.extra ? (
                              <pre className="text-[11px] bg-black/5 dark:bg-white/5 rounded-lg p-2 mt-2 overflow-auto">
{JSON.stringify(it.extra, null, 2)}
                              </pre>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={!!openPayload} onOpenChange={(o) => (!o ? setOpenPayload(null) : null)}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>{openPayload?.title || 'Payload'}</DialogTitle>
            </DialogHeader>
            <pre className="text-xs bg-black/5 dark:bg-white/5 rounded-lg p-4 overflow-auto max-h-[70vh]">
{JSON.stringify(openPayload?.json ?? {}, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>

        <Dialog open={!!completeDialog} onOpenChange={(o) => (!o ? setCompleteDialog(null) : null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Concluir transição</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-[#001533]/70 dark:text-white/70">
                Escreva uma nota curta explicando a resolução (fica salva no Hub).
              </p>
              <textarea
                value={completeDialog?.note || ''}
                onChange={(e) => setCompleteDialog((prev) => (prev ? { ...prev, note: e.target.value } : prev))}
                className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-white/5 dark:border-white/10"
                placeholder="Ex.: revisado com cliente, cláusulas ajustadas e enviado para assinatura."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCompleteDialog(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (!completeDialog) return;
                    const { id, note } = completeDialog;
                    setCompleteDialog(null);
                    await completeTransitionWithNote(id, note || '');
                  }}
                >
                  Concluir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!reopenDialog} onOpenChange={(o) => (!o ? setReopenDialog(null) : null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Reabrir transição</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-[#001533]/70 dark:text-white/70">
                Descreva o motivo da reabertura (fica salvo no Hub).
              </p>
              <textarea
                value={reopenDialog?.note || ''}
                onChange={(e) => setReopenDialog((prev) => (prev ? { ...prev, note: e.target.value } : prev))}
                className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-white/5 dark:border-white/10"
                placeholder="Ex.: pendência de assinatura, cliente pediu ajuste, dados inconsistentes."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReopenDialog(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (!reopenDialog) return;
                    const { id, note } = reopenDialog;
                    setReopenDialog(null);
                    await reopenTransitionWithNote(id, note || '');
                  }}
                >
                  Reabrir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!resolveErrorDialog} onOpenChange={(o) => (!o ? setResolveErrorDialog(null) : null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Resolver erro</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-[#001533]/70 dark:text-white/70">
                Descreva como o erro foi resolvido. A transição volta para <b>pendente</b>.
              </p>
              <textarea
                value={resolveErrorDialog?.note || ''}
                onChange={(e) => setResolveErrorDialog((prev) => (prev ? { ...prev, note: e.target.value } : prev))}
                className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-white/5 dark:border-white/10"
                placeholder="Ex.: corrigido payload, ajustado cliente_id, reprocessado com sucesso."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setResolveErrorDialog(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (!resolveErrorDialog) return;
                    const { id, note } = resolveErrorDialog;
                    setResolveErrorDialog(null);
                    await resolveErrorWithNote(id, note || '');
                  }}
                >
                  Voltar para pendente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!markErrorDialog} onOpenChange={(o) => (!o ? setMarkErrorDialog(null) : null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Marcar como erro</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-[#001533]/70 dark:text-white/70">
                Informe o motivo do erro (fica salvo no Hub e vira o <b>error_message</b> da transição).
              </p>
              <textarea
                value={markErrorDialog?.note || ''}
                onChange={(e) => setMarkErrorDialog((prev) => (prev ? { ...prev, note: e.target.value } : prev))}
                className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-white/5 dark:border-white/10"
                placeholder="Ex.: faltou client_id no payload, erro na criação de contrato, dados inválidos."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMarkErrorDialog(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (!markErrorDialog) return;
                    const { id, note } = markErrorDialog;
                    setMarkErrorDialog(null);
                    await markErrorWithNote(id, note || '');
                  }}
                >
                  Marcar erro
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!rerouteDialog} onOpenChange={(o) => (!o ? setRerouteDialog(null) : null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Encaminhar transição</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-[#001533]/70 dark:text-white/70">
                Selecione a área destino e descreva o motivo. A transição permanece <b>pendente</b>.
              </p>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">Área destino</label>
                <select
                  value={rerouteDialog?.toArea || ''}
                  onChange={(e) => setRerouteDialog((prev) => (prev ? { ...prev, toArea: e.target.value } : prev))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-white/5 dark:border-white/10"
                >
                  {availableAreas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={rerouteDialog?.note || ''}
                onChange={(e) => setRerouteDialog((prev) => (prev ? { ...prev, note: e.target.value } : prev))}
                className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-white/5 dark:border-white/10"
                placeholder="Ex.: análise indica que pertence ao Financeiro, precisa validar cobrança antes de seguir."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRerouteDialog(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (!rerouteDialog) return;
                    const { id, toArea, note } = rerouteDialog;
                    setRerouteDialog(null);
                    await rerouteTransition(id, toArea, note || '');
                  }}
                >
                  Encaminhar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function FluxosPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#001533]/60 dark:text-white/60">Carregando…</div>}>
      <FluxosContent />
    </Suspense>
  );
}


