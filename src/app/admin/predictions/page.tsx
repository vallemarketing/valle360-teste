'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Users, DollarSign, UserPlus, Target, ArrowUpRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ChurnActionModal } from '@/components/predictions/ChurnActionModal';

interface DashboardData {
  churn: {
    high_risk_count: number;
    total_revenue_at_risk: number;
    clients: any[];
  };
  ltv: {
    upsell_opportunities: number;
    total_upsell_potential: number;
    clients: any[];
  };
  revenue: {
    predicted_mrr: number;
    predicted_arr: number;
    growth_rate: number;
    trend: string;
    confidence: number;
  };
  hiring: {
    recommended_hires: number;
    priority_level: string;
    capacity_utilization: number;
    capacity_status: string;
  };
  general: {
    total_clients: number;
    total_employees: number;
  };
}

export default function PredictionsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/predictions/dashboard');
      const result = await res.json();
      if (result.success) {
        setData(result.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAllPredictions = async () => {
    if (!confirm('Deseja calcular predições para todos os clientes? Isso pode demorar alguns segundos.')) {
      return;
    }

    setCalculating(true);
    try {
      const res = await fetch('/api/admin/predictions/calculate-all', {
        method: 'POST',
      });
      const result = await res.json();
      
      if (result.success) {
        alert(`✅ Sucesso! ${result.stats?.total || 0} predições calculadas.`);
        fetchDashboard(); // Recarregar dados
      } else {
        alert(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      console.error('Error calculating predictions:', error);
      alert('❌ Erro ao calcular predições');
    } finally {
      setCalculating(false);
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

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--text-secondary)' }}>Erro ao carregar dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            🔮 Predições & Inteligência de Negócio
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Análises preditivas para tomada de decisão estratégica
          </p>
        </div>
        <button
          onClick={calculateAllPredictions}
          disabled={calculating}
          className="px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
        >
          {calculating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Calculando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Calcular Predições
            </>
          )}
        </button>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Churn Risk */}
        <div
          className="p-6 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            {data.churn.high_risk_count > 0 && (
              <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-500 text-white">
                ATENÇÃO
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Risco de Churn
          </h3>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {data.churn.high_risk_count}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            clientes em alto risco
          </p>
          <p className="text-xs mt-2 text-red-500">
            R$ {(data.churn.total_revenue_at_risk / 1000).toFixed(0)}k em risco
          </p>
          <Link
            href="/admin/predictions/churn"
            className="mt-4 text-sm flex items-center hover:underline"
            style={{ color: 'var(--primary-500)' }}
          >
            Ver detalhes <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Upsell Opportunities */}
        <div
          className="p-6 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            {data.ltv.upsell_opportunities > 0 && (
              <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-500 text-white">
                {data.ltv.upsell_opportunities}
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Oportunidades de Upsell
          </h3>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {data.ltv.upsell_opportunities}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            clientes prontos para upgrade
          </p>
          <p className="text-xs mt-2 text-green-500">
            Potencial: R$ {(data.ltv.total_upsell_potential / 1000).toFixed(0)}k
          </p>
          <Link
            href="/admin/predictions/ltv"
            className="mt-4 text-sm flex items-center hover:underline"
            style={{ color: 'var(--primary-500)' }}
          >
            Ver oportunidades <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Revenue Prediction */}
        <div
          className="p-6 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <DollarSign className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex items-center text-xs">
              {data.revenue.trend === 'upward' ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : data.revenue.trend === 'downward' ? (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              ) : (
                <span className="w-4 h-4 mr-1">→</span>
              )}
              <span style={{ color: data.revenue.trend === 'upward' ? '#10b981' : data.revenue.trend === 'downward' ? '#ef4444' : 'var(--text-secondary)' }}>
                {data.revenue.growth_rate > 0 ? '+' : ''}{data.revenue.growth_rate.toFixed(1)}%
              </span>
            </div>
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            MRR Previsto
          </h3>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            R$ {(data.revenue.predicted_mrr / 1000).toFixed(0)}k
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            ARR: R$ {(data.revenue.predicted_arr / 1000).toFixed(0)}k
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Confiança: {data.revenue.confidence}%
          </p>
          <Link
            href="/admin/predictions/revenue"
            className="mt-4 text-sm flex items-center hover:underline"
            style={{ color: 'var(--primary-500)' }}
          >
            Ver detalhes <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Hiring Needs */}
        <div
          className="p-6 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <UserPlus className="w-6 h-6 text-purple-500" />
            </div>
            {data.hiring.priority_level === 'urgent' || data.hiring.priority_level === 'high' ? (
              <span className="px-2 py-1 text-xs font-bold rounded-full bg-orange-500 text-white">
                URGENTE
              </span>
            ) : null}
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Necessidade de Contratação
          </h3>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {data.hiring.recommended_hires}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {data.hiring.recommended_hires === 0 ? 'equipe adequada' : 'contratações recomendadas'}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Capacidade: {data.hiring.capacity_utilization.toFixed(0)}%
          </p>
          <Link
            href="/admin/predictions/hiring"
            className="mt-4 text-sm flex items-center hover:underline"
            style={{ color: 'var(--primary-500)' }}
          >
            Ver análise <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* Clientes em Alto Risco */}
      {data.churn.clients.length > 0 && (
        <div
          className="p-6 rounded-xl border mb-8"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              ⚠️ Clientes em Alto Risco de Churn
            </h2>
            <Link
              href="/admin/predictions/churn"
              className="text-sm hover:underline"
              style={{ color: 'var(--primary-500)' }}
            >
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {data.churn.clients.slice(0, 5).map((client: any) => (
              <div
                key={client.id}
                className="p-4 rounded-lg border flex items-center justify-between"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
              >
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {client.clients?.company_name || 'Cliente'}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Probabilidade de churn: {client.churn_probability}%
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    client.risk_level === 'critical' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {client.risk_level === 'critical' ? 'CRÍTICO' : 'ALTO RISCO'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedClient(client);
                      setShowActionModal(true);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80"
                    style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
                  >
                    Tomar Ação
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Oportunidades de Upsell */}
      {data.ltv.clients.length > 0 && (
        <div
          className="p-6 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              💰 Top Oportunidades de Upsell
            </h2>
            <Link
              href="/admin/predictions/ltv"
              className="text-sm hover:underline"
              style={{ color: 'var(--primary-500)' }}
            >
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {data.ltv.clients.slice(0, 5).map((client: any) => (
              <div
                key={client.id}
                className="p-4 rounded-lg border flex items-center justify-between"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
              >
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {client.clients?.company_name || 'Cliente'}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Probabilidade: {client.upsell_probability}% • Valor atual: R$ {client.clients?.monthly_value || 0}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-500">
                      +R$ {client.estimated_upsell_value || 0}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      potencial
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80"
                    style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
                  >
                    Propor Upgrade
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Ações de Retenção */}
      <ChurnActionModal
        clientId={selectedClient?.client_id || null}
        churnData={selectedClient}
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedClient(null);
          // Recarregar dados após criar tarefa
          fetchDashboard();
        }}
      />
    </div>
  );
}
