'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Loader2,
  Sparkles,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Search,
  ChevronDown,
} from 'lucide-react';
import { ApprovalModal } from '@/components/social/ApprovalModal';

interface DraftMetadata {
  hashtags?: string[];
  cta?: string;
  visualPrompt?: string;
  selectedNetworks?: string[];
  scheduledAt?: string;
  client_id?: string;
  area_key?: string;
  stage_key?: string;
}

interface Draft {
  id: string;
  executive_id: string | null;
  created_by_user_id: string | null;
  action_type: string;
  action_payload: {
    title: string;
    description: string;
    metadata: DraftMetadata;
  };
  preview?: {
    label?: string;
    description?: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
  risk_level?: string;
}

interface Client {
  id: string;
  name?: string;
  company_name?: string;
}

type StatusFilter = 'all' | 'draft' | 'executed' | 'cancelled';

export default function ApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('draft');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar drafts
      const draftsRes = await fetch('/api/admin/csuite/actions/drafts', { 
        cache: 'no-store' 
      });
      const draftsData = await draftsRes.json();
      
      if (draftsRes.ok && draftsData.success) {
        // Filtrar apenas drafts de criação de tarefa de social media
        const socialDrafts = (draftsData.drafts || []).filter(
          (d: Draft) => d.action_type === 'create_kanban_task'
        );
        setDrafts(socialDrafts);
      }

      // Carregar clientes
      const clientsRes = await fetch('/api/admin/clients', { cache: 'no-store' });
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        if (clientsData.success) {
          setClients(clientsData.clients || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar aprovações');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (draftId: string) => {
    const response = await fetch('/api/admin/csuite/actions/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_id: draftId }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro ao aprovar conteúdo');
    }

    // Recarregar lista
    await loadData();
  };

  const handleReject = async (draftId: string, reason: string) => {
    const response = await fetch('/api/admin/csuite/actions/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_id: draftId, reason }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro ao rejeitar conteúdo');
    }

    // Recarregar lista
    await loadData();
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Cliente não especificado';
    const client = clients.find((c) => c.id === clientId);
    return client?.name || client?.company_name || 'Cliente desconhecido';
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Pendente
          </span>
        );
      case 'executed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Aprovado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Rejeitado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
            {status}
          </span>
        );
    }
  };

  const filteredDrafts = drafts.filter((draft) => {
    // Filtro de status
    if (statusFilter !== 'all' && draft.status !== statusFilter) {
      return false;
    }

    // Filtro de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const title = draft.action_payload?.title?.toLowerCase() || '';
      const description = draft.action_payload?.description?.toLowerCase() || '';
      const clientId = draft.action_payload?.metadata?.client_id;
      const clientName = getClientName(clientId).toLowerCase();

      return (
        title.includes(query) ||
        description.includes(query) ||
        clientName.includes(query)
      );
    }

    return true;
  });

  const stats = {
    total: drafts.length,
    pending: drafts.filter((d) => d.status === 'draft').length,
    approved: drafts.filter((d) => d.status === 'executed').length,
    rejected: drafts.filter((d) => d.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando aprovações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Aprovação de Conteúdo
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Revise e aprove conteúdos criados pela IA
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-md transition-colors border border-gray-200 dark:border-gray-700"
            >
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">Atualizar</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.pending}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Aprovados</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.approved}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rejeitados</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.rejected}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por título, descrição ou cliente..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'draft', label: 'Pendentes' },
                  { value: 'executed', label: 'Aprovados' },
                  { value: 'cancelled', label: 'Rejeitados' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value as StatusFilter)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      statusFilter === filter.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drafts List */}
        {filteredDrafts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-md border border-gray-200 dark:border-gray-700">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum conteúdo encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter === 'draft'
                ? 'Não há conteúdos pendentes para aprovação no momento.'
                : 'Nenhum conteúdo corresponde aos filtros selecionados.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredDrafts.map((draft) => {
                const clientId = draft.action_payload?.metadata?.client_id;
                const clientName = getClientName(clientId);
                const createdDate = new Date(draft.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <motion.div
                    key={draft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => setSelectedDraft(draft)}
                  >
                    {/* Card Header */}
                    <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                          {draft.action_payload?.title || 'Sem título'}
                        </h3>
                      </div>
                      {getStatusBadge(draft.status)}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {draft.action_payload?.description || 'Sem descrição'}
                      </p>

                      {/* Hashtags Preview */}
                      {draft.action_payload?.metadata?.hashtags &&
                        draft.action_payload.metadata.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {draft.action_payload.metadata.hashtags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {draft.action_payload.metadata.hashtags.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                                +{draft.action_payload.metadata.hashtags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                      {/* Client Info */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span className="truncate">{clientName}</span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{createdDate}</span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    {draft.status === 'draft' && (
                      <div className="px-4 pb-4">
                        <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all">
                          Revisar e Aprovar
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selectedDraft && (
        <ApprovalModal
          draft={selectedDraft}
          onClose={() => setSelectedDraft(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}
