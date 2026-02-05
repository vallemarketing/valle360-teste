'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingDown, Calendar, DollarSign, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ChurnActionModal } from '@/components/predictions/ChurnActionModal';
import { useRouter } from 'next/navigation';

interface ChurnPrediction {
  id: string;
  client_id: string;
  churn_probability: number;
  risk_level: string;
  days_until_churn: number;
  predicted_churn_date: string;
  contributing_factors: any;
  warning_signals: string[];
  recommended_actions: string[];
  confidence_level: number;
  clients: {
    id: string;
    company_name: string;
    contact_name: string;
    contact_email: string;
    monthly_value: number;
    status: string;
  };
}

export default function ChurnPredictionsPage() {
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'high', 'critical'
  const [selectedPrediction, setSelectedPrediction] = useState<ChurnPrediction | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPredictions();
  }, [filter]);

  const fetchPredictions = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/admin/predictions/churn'
        : `/api/admin/predictions/churn?riskLevel=${filter}`;
      
      const res = await fetch(url);
      const result = await res.json();
      
      if (result.success) {
        setPredictions(result.predictions);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error fetching churn predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#10b981';
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Carregando predições...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/predictions"
          className="flex items-center text-sm mb-4 hover:underline"
          style={{ color: 'var(--primary-500)' }}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          ⚠️ Predições de Churn de Clientes
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Identifique clientes em risco e tome ações preventivas
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className="p-6 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Analisado</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
          </div>
          <div
            className="p-6 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Risco Alto</p>
            <p className="text-3xl font-bold text-orange-500">{stats.high_risk}</p>
          </div>
          <div
            className="p-6 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Risco Crítico</p>
            <p className="text-3xl font-bold text-red-500">{stats.critical_risk}</p>
          </div>
          <div
            className="p-6 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Receita em Risco</p>
            <p className="text-2xl font-bold text-red-500">
              R$ {(stats.total_revenue_at_risk / 1000).toFixed(0)}k
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          Todos ({stats?.total || 0})
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'high' ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          Alto Risco ({stats?.high_risk || 0})
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'critical' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          Crítico ({stats?.critical_risk || 0})
        </button>
      </div>

      {/* Predictions List */}
      <div className="space-y-4">
        {predictions.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-secondary)' }}>Nenhuma predição encontrada</p>
          </div>
        ) : (
          predictions.map((prediction) => (
            <div
              key={prediction.id}
              className="p-6 rounded-xl border"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {prediction.clients?.company_name || 'Cliente'}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {prediction.clients?.contact_name} • {prediction.clients?.contact_email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4">
                    <p className="text-3xl font-bold" style={{ color: getRiskColor(prediction.risk_level) }}>
                      {prediction.churn_probability}%
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      probabilidade
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadge(prediction.risk_level)}`}>
                    {prediction.risk_level.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Dias até churn</p>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {prediction.days_until_churn || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Valor mensal</p>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      R$ {prediction.clients?.monthly_value || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Confiança</p>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {prediction.confidence_level}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning Signals */}
              {prediction.warning_signals && prediction.warning_signals.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    ⚠️ Sinais de Alerta:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {prediction.warning_signals.map((signal, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs"
                        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              {prediction.recommended_actions && prediction.recommended_actions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    💡 Ações Recomendadas:
                  </h4>
                  <ul className="space-y-1">
                    {prediction.recommended_actions.map((action, idx) => (
                      <li key={idx} className="text-sm flex items-start">
                        <span className="mr-2" style={{ color: 'var(--primary-500)' }}>•</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setSelectedPrediction(prediction);
                    setShowActionModal(true);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80"
                  style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
                >
                  Iniciar Retenção
                </button>
                <button
                  onClick={() => {
                    router.push(`/admin/clientes?id=${prediction.client_id}`);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-gray-50 dark:hover:bg-gray-800"
                  style={{ backgroundColor: 'transparent', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                >
                  Ver Histórico
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Ações de Retenção */}
      <ChurnActionModal
        clientId={selectedPrediction?.client_id || null}
        churnData={selectedPrediction}
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedPrediction(null);
          // Recarregar dados após criar tarefa
          fetchPredictions();
        }}
      />
    </div>
  );
}
