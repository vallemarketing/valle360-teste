'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Search, Filter, CheckCircle, Clock, AlertTriangle,
  X, Download, Eye, MessageSquare, Calendar, User, Building,
  Sparkles, ArrowRight, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { fetchProfilesMapByAuthIds } from '@/lib/messaging/userProfiles';
import { toast } from 'sonner';

interface MaterialRequest {
  id: string;
  title: string;
  description: string;
  client: string;
  type: 'arte' | 'video' | 'texto' | 'outro';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'review' | 'approved' | 'delivered';
  requestedAt: string;
  deadline: string;
  assignee: string;
  attachments: number;
  comments: number;
}

type ClientRow = { id: string; company_name?: string | null };
type BoardRow = { id: string; area_key?: string | null; name?: string | null };
type ColumnRow = { id: string; stage_key?: string | null; name?: string | null };

export default function SolicitacoesMaterialPage() {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [boards, setBoards] = useState<BoardRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);

  const [newForm, setNewForm] = useState<{
    title: string;
    description: string;
    type: MaterialRequest['type'];
    priority: MaterialRequest['priority'];
    deadline: string;
    clientId: string;
  }>({
    title: '',
    description: '',
    type: 'arte',
    priority: 'medium',
    deadline: '',
    clientId: '',
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pending: { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: <Clock className="w-3 h-3" />, label: 'Pendente' },
      in_progress: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: <Sparkles className="w-3 h-3" />, label: 'Em Produção' },
      review: { color: 'bg-purple-100 text-purple-700 border-purple-300', icon: <Eye className="w-3 h-3" />, label: 'Em Revisão' },
      approved: { color: 'bg-green-100 text-green-700 border-green-300', icon: <CheckCircle className="w-3 h-3" />, label: 'Aprovado' },
      delivered: { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: <ArrowRight className="w-3 h-3" />, label: 'Entregue' }
    };
    const c = config[status] || config.pending;
    return (
      <Badge className={`${c.color} border flex items-center gap-1`}>
        {c.icon}
        {c.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { color: string; label: string }> = {
      low: { color: 'bg-gray-100 text-gray-600', label: 'Baixa' },
      medium: { color: 'bg-blue-100 text-blue-600', label: 'Média' },
      high: { color: 'bg-amber-100 text-primary', label: 'Alta' },
      urgent: { color: 'bg-red-100 text-red-600', label: 'Urgente' }
    };
    const c = config[priority] || config.low;
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.color}`}>{c.label}</span>;
  };

  const materialAreaKeys = useMemo(
    () => ['designer_grafico', 'video_maker', 'social_media', 'head_marketing', 'web_designer'],
    []
  );

  const normalizePriority = (p: any): MaterialRequest['priority'] => {
    const s = String(p || '').toLowerCase();
    if (s === 'urgent' || s === 'urgente') return 'urgent';
    if (s === 'high' || s === 'alta') return 'high';
    if (s === 'low' || s === 'baixa') return 'low';
    return 'medium';
  };

  const normalizeStatus = (stageKey: any): MaterialRequest['status'] => {
    const s = String(stageKey || '').toLowerCase();
    if (!s) return 'pending';
    if (s.includes('aprov')) return 'review';
    if (s.includes('demanda') || s.includes('backlog')) return 'pending';
    if (s.includes('escopo') || s.includes('produc') || s.includes('execu')) return 'in_progress';
    if (s.includes('concl') || s.includes('entreg') || s.includes('done')) return 'delivered';
    return 'in_progress';
  };

  const inferTypeFromAreaKey = (areaKey: string): MaterialRequest['type'] => {
    const s = String(areaKey || '').toLowerCase();
    if (s.includes('video')) return 'video';
    if (s.includes('designer') || s.includes('design')) return 'arte';
    if (s.includes('head') || s.includes('social')) return 'texto';
    return 'outro';
  };

  const mapTypeToAreaKey = (t: MaterialRequest['type']) => {
    if (t === 'video') return 'video_maker';
    if (t === 'texto') return 'head_marketing';
    if (t === 'arte') return 'designer_grafico';
    return 'social_media';
  };

  const mapPriorityToDb = (p: MaterialRequest['priority']) => {
    if (p === 'urgent') return 'urgente';
    if (p === 'high') return 'alta';
    if (p === 'low') return 'baixa';
    return 'media';
  };

  const loadBaseLookups = async () => {
    const [{ data: clientsData }, { data: boardsData }] = await Promise.all([
      supabase.from('clients').select('id, company_name').order('company_name').limit(500),
      supabase.from('kanban_boards').select('id, area_key, name').limit(500),
    ]);
    setClients((clientsData || []) as any);
    setBoards((boardsData || []) as any);
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      await loadBaseLookups();

      // Usar o resultado mais recente do state (ou buscar no banco caso ainda não tenha)
      const localBoards = boards.length ? boards : ((await supabase.from('kanban_boards').select('id, area_key, name').limit(500)).data || []);
      const boardsForMaterial = (localBoards as any[]).filter((b) => materialAreaKeys.includes(String(b.area_key || '')));
      const boardIds = boardsForMaterial.map((b) => b.id).filter(Boolean);

      const { data: tasks, error } = await supabase
        .from('kanban_tasks')
        .select('id,title,description,priority,created_at,due_date,attachments_count,comments_count,client_id,board_id,column_id,assigned_to')
        .in('board_id', boardIds.length ? boardIds : ['00000000-0000-0000-0000-000000000000'])
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      const clientIds = Array.from(new Set((tasks || []).map((t: any) => t.client_id).filter(Boolean))) as string[];
      const colIds = Array.from(new Set((tasks || []).map((t: any) => t.column_id).filter(Boolean))) as string[];

      const [{ data: clientsRows }, { data: colsRows }] = await Promise.all([
        clientIds.length
          ? supabase.from('clients').select('id, company_name').in('id', clientIds)
          : Promise.resolve({ data: [] as any[] } as any),
        colIds.length
          ? supabase.from('kanban_columns').select('id, stage_key, name').in('id', colIds)
          : Promise.resolve({ data: [] as any[] } as any),
      ]);

      const clientById = new Map<string, ClientRow>((clientsRows || []).map((c: any) => [String(c.id), c]));
      const colById = new Map<string, ColumnRow>((colsRows || []).map((c: any) => [String(c.id), c]));
      const boardById = new Map<string, BoardRow>((localBoards as any[]).map((b: any) => [String(b.id), b]));

      const firstAssigneeIds: string[] = [];
      for (const t of tasks || []) {
        const a = (t as any).assigned_to;
        const id =
          typeof a === 'string'
            ? a
            : Array.isArray(a) && a.length
              ? String(a[0])
              : '';
        if (id) firstAssigneeIds.push(id);
      }
      const assigneeMap = firstAssigneeIds.length
        ? await fetchProfilesMapByAuthIds(supabase as any, Array.from(new Set(firstAssigneeIds)))
        : new Map();

      const mapped: MaterialRequest[] = (tasks || []).map((t: any) => {
        const board = boardById.get(String(t.board_id));
        const col = colById.get(String(t.column_id));
        const client = t.client_id ? clientById.get(String(t.client_id)) : null;
        const stageKey = col?.stage_key || '';

        const a = t.assigned_to;
        const firstId = typeof a === 'string' ? a : Array.isArray(a) && a.length ? String(a[0]) : '';
        const assigneeName = firstId ? assigneeMap.get(String(firstId))?.full_name || 'Atribuído' : 'Não atribuído';

        const createdAt = t.created_at ? String(t.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10);
        const due = t.due_date ? String(t.due_date).slice(0, 10) : new Date().toISOString().slice(0, 10);

        return {
          id: String(t.id),
          title: String(t.title || 'Sem título'),
          description: String(t.description || ''),
          client: String(client?.company_name || '—'),
          type: inferTypeFromAreaKey(String(board?.area_key || '')),
          priority: normalizePriority(t.priority),
          status: normalizeStatus(stageKey),
          requestedAt: createdAt,
          deadline: due,
          assignee: assigneeName,
          attachments: Number(t.attachments_count || 0) || 0,
          comments: Number(t.comments_count || 0) || 0,
        };
      });

      setRequests(mapped);
    } catch (e) {
      console.error('Erro ao carregar solicitações (kanban_tasks):', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateRequest = async () => {
    try {
      if (!newForm.title.trim()) {
        toast.error('Título é obrigatório');
        return;
      }

      const areaKey = mapTypeToAreaKey(newForm.type);
      const board = boards.find((b) => String(b.area_key) === areaKey) || null;
      if (!board?.id) {
        toast.error('Board da área não encontrado');
        return;
      }

      const { data: demandCol, error: colErr } = await supabase
        .from('kanban_columns')
        .select('id, stage_key')
        .eq('board_id', board.id)
        .eq('stage_key', 'demanda')
        .maybeSingle();
      if (colErr || !demandCol?.id) {
        toast.error('Coluna "Demanda" não encontrada no board de destino');
        return;
      }

      const dueIso = newForm.deadline ? new Date(`${newForm.deadline}T23:59:00.000Z`).toISOString() : null;

      const { error: insErr } = await supabase.from('kanban_tasks').insert({
        board_id: board.id,
        column_id: demandCol.id,
        title: newForm.title.trim(),
        description: newForm.description?.trim() || null,
        priority: mapPriorityToDb(newForm.priority),
        due_date: dueIso,
        client_id: newForm.clientId || null,
      } as any);
      if (insErr) throw insErr;

      setShowNewModal(false);
      setNewForm({ title: '', description: '', type: 'arte', priority: 'medium', deadline: '', clientId: '' });
      await loadRequests();
      toast.success('Solicitação criada com sucesso!');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao criar solicitação');
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || req.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    urgent: requests.filter(r => r.priority === 'urgent').length
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Solicitações de Material
              </h1>
              <p className="text-gray-500">
                Gerencie solicitações de artes, vídeos e conteúdos
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowNewModal(true)}
            className="bg-[#1672d6] hover:bg-[#1260b5]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Solicitação
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
                  <p className="text-sm text-gray-500">Em Produção</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                  <p className="text-sm text-gray-500">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.urgent}</p>
                  <p className="text-sm text-gray-500">Urgentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1672d6] bg-white dark:bg-gray-800"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1672d6] bg-white dark:bg-gray-800"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Produção</option>
            <option value="review">Em Revisão</option>
            <option value="approved">Aprovado</option>
            <option value="delivered">Entregue</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1672d6] bg-white dark:bg-gray-800"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Carregando solicitações...</p>
              </CardContent>
            </Card>
          )}
          {filteredRequests.map((request, idx) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="hover:border-[#1672d6]/30 transition-all cursor-pointer" onClick={() => setSelectedRequest(request)}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{request.title}</h3>
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{request.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {request.client}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {request.assignee}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Prazo: {new Date(request.deadline).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {request.comments}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.message('Para baixar anexos, abra o card no Kanban (os arquivos ficam nos anexos do card).');
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedRequest(request); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {!loading && filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhuma solicitação encontrada</p>
          </div>
        )}

        {/* Modal de Nova Solicitação */}
        <AnimatePresence>
          {showNewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowNewModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl"
              >
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-xl font-bold">Nova Solicitação</h2>
                  <button onClick={() => setShowNewModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Título</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ex: Banner para Instagram"
                      value={newForm.title}
                      onChange={(e) => setNewForm((p) => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Descrição</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                      placeholder="Descreva o que precisa..."
                      value={newForm.description}
                      onChange={(e) => setNewForm((p) => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cliente (opcional)</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={newForm.clientId}
                      onChange={(e) => setNewForm((p) => ({ ...p, clientId: e.target.value }))}
                    >
                      <option value="">—</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name || c.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo</label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg"
                        value={newForm.type}
                        onChange={(e) => setNewForm((p) => ({ ...p, type: e.target.value as any }))}
                      >
                        <option value="arte">Arte/Design</option>
                        <option value="video">Vídeo</option>
                        <option value="texto">Texto/Copy</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Prioridade</label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg"
                        value={newForm.priority}
                        onChange={(e) => setNewForm((p) => ({ ...p, priority: e.target.value as any }))}
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Prazo</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={newForm.deadline}
                      onChange={(e) => setNewForm((p) => ({ ...p, deadline: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="p-6 border-t flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancelar</Button>
                  <Button className="bg-[#1672d6]" onClick={handleCreateRequest}>
                    Criar Solicitação
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Detalhes */}
        <AnimatePresence>
          {selectedRequest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setSelectedRequest(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedRequest.title}</h2>
                    <p className="text-sm text-gray-500">{selectedRequest.client}</p>
                  </div>
                  <button onClick={() => setSelectedRequest(null)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedRequest.status)}
                    {getPriorityBadge(selectedRequest.priority)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Descrição</label>
                    <p className="text-gray-900 dark:text-white">{selectedRequest.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Responsável</label>
                      <p className="text-gray-900 dark:text-white">{selectedRequest.assignee}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Prazo</label>
                      <p className="text-gray-900 dark:text-white">{new Date(selectedRequest.deadline).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
      <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Arquivos Anexados ({selectedRequest.attachments})</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.message('Para baixar anexos, abra o card no Kanban (os arquivos ficam nos anexos do card).')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Baixar Todos
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => toast.message('Atualize o status pelo Kanban (mover coluna/etapa).')}
                  >
                    Atualizar Status
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => toast.message('Comentários ficam no card do Kanban (campo de comentários).')}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Comentar
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={async () => {
                        try {
                          // Best-effort: marcar tarefa como concluída (done) e mover para coluna finalizado se existir.
                          const { data: task } = await supabase
                            .from('kanban_tasks')
                            .select('id, board_id')
                            .eq('id', selectedRequest.id)
                            .maybeSingle();

                          const boardId = task?.board_id ? String((task as any).board_id) : null;
                          let finalColId: string | null = null;
                          if (boardId) {
                            const { data: finalCol } = await supabase
                              .from('kanban_columns')
                              .select('id')
                              .eq('board_id', boardId)
                              .eq('stage_key', 'finalizado')
                              .maybeSingle();
                            if (finalCol?.id) finalColId = String((finalCol as any).id);
                          }

                          const payload: any = { status: 'done', updated_at: new Date().toISOString() };
                          if (finalColId) payload.column_id = finalColId;

                          const { error: upErr } = await supabase.from('kanban_tasks').update(payload).eq('id', selectedRequest.id);
                          if (upErr) throw upErr;

                          toast.success('Solicitação marcada como concluída.');
                          setSelectedRequest(null);
                          await loadRequests();
                        } catch (e: any) {
                          toast.error(e?.message || 'Falha ao atualizar solicitação');
                        }
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
