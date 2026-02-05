'use client';

/**
 * Valle 360 - Página de Feature Flags (Super Admin)
 * Controle de funcionalidades por cliente
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ToggleLeft,
  ToggleRight,
  Search,
  Users,
  Building2,
  Check,
  X,
  Clock,
  History,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Shield,
  FileText,
  RefreshCw,
  Filter,
  Eye,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
  getAllFeatures,
  getAllServices,
  getClientFeatures,
  toggleFeature,
  syncFeaturesFromContract,
  getPendingRequests,
  approveFeatureRequest,
  rejectFeatureRequest,
  getFeatureLogs,
  Feature,
  Service,
  FeatureRequest,
  FeatureLog
} from '@/lib/features';

// =====================================================
// TIPOS
// =====================================================

interface Client {
  id: string;
  company_name: string;
  fantasy_name: string;
  cnpj: string;
  status: string;
}

interface ClientFeatureStatus {
  feature: Feature;
  status: 'enabled' | 'disabled' | 'pending';
  enabled_by?: string;
  enabled_at?: string;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function FeatureFlagsPage() {
  const [activeTab, setActiveTab] = useState<'clients' | 'requests' | 'services'>('clients');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientFeatures, setClientFeatures] = useState<ClientFeatureStatus[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FeatureRequest[]>([]);
  const [logs, setLogs] = useState<FeatureLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [featuresData, servicesData, requestsData] = await Promise.all([
        getAllFeatures(),
        getAllServices(),
        getPendingRequests()
      ]);

      setFeatures(featuresData);
      setServices(servicesData);
      setPendingRequests(requestsData);

      // Carregar clientes
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, company_name, fantasy_name, cnpj, status')
        .order('company_name');

      setClients(clientsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar features de um cliente
  const loadClientFeatures = async (client: Client) => {
    setSelectedClient(client);
    const features = await getClientFeatures(client.id);
    setClientFeatures(features);
    
    const logsData = await getFeatureLogs(client.id);
    setLogs(logsData);
  };

  // Toggle feature
  const handleToggleFeature = async (featureCode: string, enable: boolean) => {
    if (!selectedClient) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await toggleFeature(
        selectedClient.id,
        featureCode,
        enable,
        user.id,
        enable ? 'Habilitado manualmente' : 'Desabilitado manualmente'
      );

      if (result.success) {
        await loadClientFeatures(selectedClient);
      }
    } catch (error) {
      console.error('Erro ao alterar feature:', error);
    } finally {
      setSaving(false);
    }
  };

  // Aprovar solicitação
  const handleApproveRequest = async (requestId: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await approveFeatureRequest(requestId, user.id, 'Aprovado');
      if (result.success) {
        await loadInitialData();
        if (selectedClient) {
          await loadClientFeatures(selectedClient);
        }
      }
    } catch (error) {
      console.error('Erro ao aprovar:', error);
    } finally {
      setSaving(false);
    }
  };

  // Rejeitar solicitação
  const handleRejectRequest = async (requestId: string, notes: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await rejectFeatureRequest(requestId, user.id, notes || 'Não aprovado');
      if (result.success) {
        await loadInitialData();
      }
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
    } finally {
      setSaving(false);
    }
  };

  // Filtrar clientes
  const filteredClients = clients.filter(client =>
    client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.fantasy_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cnpj?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <RefreshCw className="w-8 h-8 animate-spin text-[#1672d6]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
              <ToggleLeft className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#001533] dark:text-white">
                Feature Flags
              </h1>
              <p className="text-gray-500">
                Controle de funcionalidades por cliente
              </p>
            </div>
          </div>

          {pendingRequests.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl">
              <Bell className="w-5 h-5" />
              <span className="font-medium">{pendingRequests.length} solicitações pendentes</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'clients', label: 'Por Cliente', icon: Users },
            { id: 'requests', label: 'Solicitações', icon: Clock, badge: pendingRequests.length },
            { id: 'services', label: 'Serviços x Features', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-[#1672d6] text-[#1672d6]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Por Cliente */}
        {activeTab === 'clients' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Lista de Clientes */}
            <div className="col-span-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1672d6]"
                  />
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {filteredClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => loadClientFeatures(client)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-gray-100 dark:border-gray-700",
                      selectedClient?.id === client.id
                        ? "bg-[#1672d6]/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-bold">
                      {client.company_name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-white truncate">
                        {client.fantasy_name || client.company_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {client.cnpj}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Features do Cliente */}
            <div className="col-span-2">
              {selectedClient ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                        {selectedClient.fantasy_name || selectedClient.company_name}
                      </h2>
                      <p className="text-sm text-gray-500">{selectedClient.cnpj}</p>
                    </div>
                    <button
                      onClick={() => setShowLogs(!showLogs)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        showLogs
                          ? "bg-[#1672d6] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      <History className="w-4 h-4" />
                      Histórico
                    </button>
                  </div>

                  {showLogs ? (
                    /* Histórico de Logs */
                    <div className="p-4 max-h-[500px] overflow-y-auto">
                      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Últimas alterações
                      </h3>
                      <div className="space-y-2">
                        {logs.map(log => (
                          <div
                            key={log.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              log.action === 'enabled' || log.action === 'request_approved'
                                ? "bg-green-100 text-green-600"
                                : log.action === 'disabled' || log.action === 'request_rejected'
                                ? "bg-red-100 text-red-600"
                                : "bg-blue-100 text-blue-600"
                            )}>
                              {log.action === 'enabled' || log.action === 'request_approved' ? (
                                <Check className="w-4 h-4" />
                              ) : log.action === 'disabled' || log.action === 'request_rejected' ? (
                                <X className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {log.feature_code}
                              </p>
                              <p className="text-xs text-gray-500">
                                {log.action === 'enabled' && 'Habilitado'}
                                {log.action === 'disabled' && 'Desabilitado'}
                                {log.action === 'request_created' && 'Solicitação criada'}
                                {log.action === 'request_approved' && 'Solicitação aprovada'}
                                {log.action === 'request_rejected' && 'Solicitação rejeitada'}
                                {' • '}
                                {new Date(log.created_at).toLocaleDateString('pt-BR')}
                              </p>
                              {log.reason && (
                                <p className="text-xs text-gray-400 mt-1">{log.reason}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Lista de Features */
                    <div className="p-4 space-y-3">
                      {clientFeatures.map(({ feature, status, enabled_by }) => (
                        <div
                          key={feature.id}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-colors",
                            status === 'enabled'
                              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                              : status === 'pending'
                              ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                              : "bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              status === 'enabled'
                                ? "bg-green-100 text-green-600"
                                : status === 'pending'
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-gray-200 text-gray-500"
                            )}>
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">
                                {feature.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {feature.description}
                              </p>
                              {status === 'enabled' && enabled_by && (
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                  {enabled_by === 'contract' && 'Por contrato'}
                                  {enabled_by === 'manual' && 'Manual'}
                                  {enabled_by === 'request' && 'Por solicitação'}
                                </span>
                              )}
                              {status === 'pending' && (
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                  <Clock className="w-3 h-3" />
                                  Solicitação pendente
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleFeature(feature.code, status !== 'enabled')}
                            disabled={saving}
                            className={cn(
                              "relative w-14 h-7 rounded-full transition-colors",
                              status === 'enabled'
                                ? "bg-green-500"
                                : "bg-gray-300"
                            )}
                          >
                            <motion.div
                              animate={{ x: status === 'enabled' ? 28 : 4 }}
                              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                    Selecione um cliente
                  </h3>
                  <p className="text-sm text-gray-400">
                    Escolha um cliente na lista para gerenciar suas funcionalidades
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Solicitações */}
        {activeTab === 'requests' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Solicitações Pendentes
              </h2>
              <p className="text-sm text-gray-500">
                Solicitações de liberação de features feitas pelo comercial
              </p>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center">
                <Check className="w-16 h-16 mx-auto text-green-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  Nenhuma solicitação pendente
                </h3>
                <p className="text-sm text-gray-400">
                  Todas as solicitações foram processadas
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {pendingRequests.map(request => (
                  <div key={request.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-white">
                            {request.feature?.name || 'Feature'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Cliente ID: {request.client_id}
                          </p>
                          <p className="text-sm text-gray-500">
                            Solicitado por: {request.requested_by_name}
                          </p>
                          {request.justification && (
                            <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
                              "{request.justification}"
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(request.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectRequest(request.id, '')}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Rejeitar
                        </button>
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Aprovar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Serviços x Features */}
        {activeTab === 'services' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Matriz Serviços x Features
              </h2>
              <p className="text-sm text-gray-500">
                Quais features cada serviço libera automaticamente
              </p>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-tl-lg font-medium text-gray-600 dark:text-gray-300">
                      Serviço
                    </th>
                    {features.map(feature => (
                      <th
                        key={feature.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700 text-center font-medium text-gray-600 dark:text-gray-300 text-xs"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{feature.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => (
                    <tr key={service.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {service.name}
                          </p>
                          <p className="text-xs text-gray-500">{service.description}</p>
                        </div>
                      </td>
                      {features.map(feature => {
                        const hasFeature = service.features?.some(f => f.id === feature.id);
                        return (
                          <td key={feature.id} className="p-3 text-center">
                            {hasFeature ? (
                              <div className="w-6 h-6 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                                <X className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

