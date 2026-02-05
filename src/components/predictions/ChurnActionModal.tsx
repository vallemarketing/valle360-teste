'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  X,
  AlertTriangle,
  TrendingDown,
  Calendar,
  DollarSign,
  CheckCircle,
  Loader2,
  ExternalLink,
  User,
  Mail,
  Phone,
  Building,
  Target,
  Clock,
  Zap,
} from 'lucide-react';

interface ChurnData {
  id: string;
  client_id: string;
  churn_probability: number;
  risk_level: string;
  days_until_churn: number;
  predicted_churn_date: string;
  contributing_factors?: any;
  warning_signals?: string[];
  recommended_actions?: string[];
  confidence_level?: number;
  clients?: {
    id: string;
    company_name: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    monthly_value?: number;
    status?: string;
  };
}

interface ChurnActionModalProps {
  clientId: string | null;
  churnData: ChurnData | null;
  onClose: () => void;
  isOpen: boolean;
}

export function ChurnActionModal({ clientId, churnData, onClose, isOpen }: ChurnActionModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'actions' | 'factors'>('overview');
  const [loading, setLoading] = useState(false);
  const [detailedData, setDetailedData] = useState<ChurnData | null>(churnData);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [customAction, setCustomAction] = useState('');
  const [creating, setCreating] = useState(false);

  // Buscar dados detalhados quando abrir o modal
  useEffect(() => {
    if (isOpen && clientId && !churnData) {
      fetchDetailedData();
    } else if (churnData) {
      setDetailedData(churnData);
      // Pre-selecionar todas as ações recomendadas
      if (churnData.recommended_actions) {
        setSelectedActions(churnData.recommended_actions);
      }
    }
  }, [isOpen, clientId, churnData]);

  const fetchDetailedData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/predictions/churn?clientId=${clientId}`);
      const result = await res.json();
      
      if (result.success && result.predictions?.length > 0) {
        const prediction = result.predictions[0];
        setDetailedData(prediction);
        if (prediction.recommended_actions) {
          setSelectedActions(prediction.recommended_actions);
        }
      }
    } catch (error) {
      console.error('Error fetching churn data:', error);
      toast.error('Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const toggleAction = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) 
        ? prev.filter(a => a !== action)
        : [...prev, action]
    );
  };

  const addCustomAction = () => {
    if (customAction.trim()) {
      setSelectedActions(prev => [...prev, customAction.trim()]);
      setCustomAction('');
    }
  };

  const handleCreateTask = async () => {
    if (selectedActions.length === 0) {
      toast.error('Selecione pelo menos uma ação');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/predictions/actions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          prediction_id: detailedData?.id,
          selected_actions: selectedActions,
          risk_level: detailedData?.risk_level,
          churn_probability: detailedData?.churn_probability,
          days_until_churn: detailedData?.days_until_churn,
          company_name: detailedData?.clients?.company_name,
          monthly_value: detailedData?.clients?.monthly_value,
        }),
      });

      const result = await res.json();
      
      if (result.success) {
        toast.success('Tarefa criada no Kanban!', {
          description: result.kanban_url ? 'Clique para visualizar' : undefined,
          action: result.kanban_url ? {
            label: 'Ver Tarefa',
            onClick: () => window.location.href = result.kanban_url,
          } : undefined,
        });
        onClose();
      } else {
        throw new Error(result.error || 'Erro ao criar tarefa');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Erro ao criar tarefa no Kanban');
    } finally {
      setCreating(false);
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#10b981';
    }
  };

  const getRiskBadge = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical': return { label: 'CRÍTICO', class: 'bg-red-500' };
      case 'high': return { label: 'ALTO RISCO', class: 'bg-orange-500' };
      case 'medium': return { label: 'MÉDIO RISCO', class: 'bg-yellow-500' };
      default: return { label: 'BAIXO RISCO', class: 'bg-green-500' };
    }
  };

  if (!isOpen) return null;

  const risk = getRiskBadge(detailedData?.risk_level);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-4xl w-full max-h-[90vh] overflow-auto rounded-2xl shadow-2xl"
          style={{ backgroundColor: 'var(--bg-primary)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 p-6 border-b" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-6 h-6" style={{ color: getRiskColor(detailedData?.risk_level) }} />
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Ação de Retenção
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${risk.class}`}>
                    {risk.label}
                  </span>
                </div>
                <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {detailedData?.clients?.company_name || 'Cliente'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary-500)' }} />
              <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Carregando dados...</span>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b px-6" style={{ borderColor: 'var(--border-light)' }}>
                {[
                  { id: 'overview', label: 'Visão Geral', icon: Target },
                  { id: 'signals', label: 'Sinais de Alerta', icon: AlertTriangle },
                  { id: 'actions', label: 'Ações Recomendadas', icon: CheckCircle },
                  { id: 'factors', label: 'Fatores', icon: TrendingDown },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent'
                      }`}
                      style={activeTab !== tab.id ? { color: 'var(--text-secondary)' } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Métricas Principais */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingDown className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Probabilidade</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: getRiskColor(detailedData?.risk_level) }}>
                          {detailedData?.churn_probability || 0}%
                        </p>
                      </div>

                      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Dias até Churn</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          {detailedData?.days_until_churn || 0}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Valor Mensal</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          R$ {detailedData?.clients?.monthly_value?.toLocaleString('pt-BR') || '0'}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Confiança</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          {detailedData?.confidence_level || 0}%
                        </p>
                      </div>
                    </div>

                    {/* Informações do Cliente */}
                    <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Building className="w-4 h-4" />
                        Informações do Cliente
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {detailedData?.clients?.contact_name && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {detailedData.clients.contact_name}
                            </span>
                          </div>
                        )}
                        
                        {detailedData?.clients?.contact_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {detailedData.clients.contact_email}
                            </span>
                          </div>
                        )}
                        
                        {detailedData?.clients?.contact_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {detailedData.clients.contact_phone}
                            </span>
                          </div>
                        )}
                        
                        {detailedData?.predicted_churn_date && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              Churn previsto: {new Date(detailedData.predicted_churn_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Signals Tab */}
                {activeTab === 'signals' && (
                  <div>
                    {detailedData?.warning_signals && detailedData.warning_signals.length > 0 ? (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                          ⚠️ Sinais de Alerta Identificados
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {detailedData.warning_signals.map((signal, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 rounded-lg text-sm font-medium"
                              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            >
                              {signal}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                        Nenhum sinal de alerta específico identificado
                      </p>
                    )}
                  </div>
                )}

                {/* Actions Tab */}
                {activeTab === 'actions' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      💡 Selecione as ações que deseja executar
                    </h3>
                    
                    <div className="space-y-2">
                      {detailedData?.recommended_actions && detailedData.recommended_actions.length > 0 ? (
                        detailedData.recommended_actions.map((action, idx) => (
                          <label
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedActions.includes(action)}
                              onChange={() => toggleAction(action)}
                              className="mt-1 w-4 h-4 rounded"
                            />
                            <span className="flex-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {action}
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                          Nenhuma ação recomendada disponível
                        </p>
                      )}
                    </div>

                    {/* Custom Action */}
                    <div className="pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Adicionar ação customizada
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customAction}
                          onChange={(e) => setCustomAction(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCustomAction()}
                          placeholder="Digite uma ação específica..."
                          className="flex-1 px-4 py-2 rounded-lg border"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            borderColor: 'var(--border-light)',
                            color: 'var(--text-primary)',
                          }}
                        />
                        <button
                          onClick={addCustomAction}
                          className="px-4 py-2 rounded-lg text-white transition-colors"
                          style={{ backgroundColor: 'var(--primary-500)' }}
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>

                    {/* Selected Actions Summary */}
                    {selectedActions.length > 0 && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                          {selectedActions.length} {selectedActions.length === 1 ? 'ação selecionada' : 'ações selecionadas'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Factors Tab */}
                {activeTab === 'factors' && (
                  <div>
                    {detailedData?.contributing_factors ? (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                          📊 Fatores Contribuintes
                        </h3>
                        <pre className="p-4 rounded-lg overflow-auto text-xs" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                          {JSON.stringify(detailedData.contributing_factors, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                        Nenhum fator contribuinte detalhado disponível
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 p-6 border-t flex items-center justify-between gap-4" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {selectedActions.length > 0 && (
                    <span>{selectedActions.length} {selectedActions.length === 1 ? 'ação' : 'ações'} será(ão) incluída(s) na tarefa</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-lg border font-medium transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateTask}
                    disabled={creating || selectedActions.length === 0}
                    className="px-6 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ backgroundColor: 'var(--primary-500)' }}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Criar Tarefa no Kanban
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
