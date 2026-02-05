'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Users, DollarSign,
  AlertTriangle, Target, Brain, RefreshCw,
  ChevronRight, BarChart3, UserMinus
} from 'lucide-react';
import { predictRevenue, predictChurn, predictHiringNeeds } from '@/lib/ml/predictions';

interface RevenueForecast {
  month: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

interface ChurnPrediction {
  clientId: string;
  clientName: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: any[];
  recommendedActions: string[];
}

interface HiringNeed {
  area: string;
  currentHeadcount: number;
  predictedDemand: number;
  recommendation: string;
  urgency: 'low' | 'medium' | 'high';
}

export function PredictionsPanel() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'churn' | 'hiring'>('revenue');
  const [loading, setLoading] = useState(true);
  const [revenueForecast, setRevenueForecast] = useState<RevenueForecast[]>([]);
  const [churnPredictions, setChurnPredictions] = useState<ChurnPrediction[]>([]);
  const [hiringNeeds, setHiringNeeds] = useState<HiringNeed[]>([]);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const [revenue, churn, hiring] = await Promise.all([
        predictRevenue(6),
        predictChurn(),
        predictHiringNeeds()
      ]);

      setRevenueForecast(revenue);
      setChurnPredictions(churn);
      setHiringNeeds(hiring);
    } catch (error) {
      console.error('Erro ao carregar previsões:', error);
      // Usar dados de exemplo em caso de erro
      setRevenueForecast(SAMPLE_REVENUE);
      setChurnPredictions(SAMPLE_CHURN);
      setHiringNeeds(SAMPLE_HIRING);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toLocaleString('pt-BR')}`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
            >
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Previsões Inteligentes</h3>
              <p className="text-xs text-gray-400">Análise preditiva com Machine Learning</p>
            </div>
          </div>
          <button
            onClick={loadPredictions}
            disabled={loading}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { id: 'revenue', label: 'Faturamento', icon: <DollarSign className="w-4 h-4" /> },
            { id: 'churn', label: 'Risco de Churn', icon: <UserMinus className="w-4 h-4" /> },
            { id: 'hiring', label: 'Contratações', icon: <Users className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeTab === tab.id ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? 'white' : '#9CA3AF'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {revenueForecast.slice(0, 3).map((forecast, index) => (
                    <motion.div
                      key={forecast.month}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <p className="text-xs text-gray-400 mb-1 capitalize">{forecast.month}</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(forecast.predicted)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div 
                          className="h-1 flex-1 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        >
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${forecast.confidence}%`,
                              backgroundColor: '#10B981'
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{forecast.confidence}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Forecast List */}
                <div className="space-y-2">
                  {revenueForecast.map((forecast, index) => (
                    <div 
                      key={forecast.month}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                    >
                      <span className="text-sm text-gray-400 capitalize">{forecast.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">
                          {formatCurrency(forecast.lowerBound)} - {formatCurrency(forecast.upperBound)}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {formatCurrency(forecast.predicted)}
                        </span>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Churn Tab */}
            {activeTab === 'churn' && (
              <div className="space-y-3">
                {churnPredictions.slice(0, 5).map((prediction, index) => (
                  <motion.div
                    key={prediction.clientId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${getRiskColor(prediction.riskLevel)}20` }}
                        >
                          <AlertTriangle 
                            className="w-5 h-5" 
                            style={{ color: getRiskColor(prediction.riskLevel) }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-white">{prediction.clientName}</p>
                          <p className="text-xs text-gray-400">
                            {prediction.factors.length} fatores de risco
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p 
                          className="text-lg font-bold"
                          style={{ color: getRiskColor(prediction.riskLevel) }}
                        >
                          {prediction.churnProbability}%
                        </p>
                        <p 
                          className="text-xs uppercase font-medium"
                          style={{ color: getRiskColor(prediction.riskLevel) }}
                        >
                          Risco {prediction.riskLevel}
                        </p>
                      </div>
                    </div>

                    {/* Ações Recomendadas */}
                    {prediction.recommendedActions.length > 0 && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <p className="text-xs text-gray-400 mb-2">Ações recomendadas:</p>
                        <div className="flex flex-wrap gap-2">
                          {prediction.recommendedActions.slice(0, 2).map((action, i) => (
                            <span 
                              key={i}
                              className="px-2 py-1 rounded text-xs"
                              style={{ 
                                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                color: '#A78BFA'
                              }}
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {churnPredictions.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">Nenhum cliente em risco identificado</p>
                  </div>
                )}
              </div>
            )}

            {/* Hiring Tab */}
            {activeTab === 'hiring' && (
              <div className="space-y-3">
                {hiringNeeds.map((need, index) => (
                  <motion.div
                    key={need.area}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${getUrgencyColor(need.urgency)}20` }}
                        >
                          <Users 
                            className="w-5 h-5" 
                            style={{ color: getUrgencyColor(need.urgency) }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-white">{need.area}</p>
                          <p className="text-xs text-gray-400">
                            Atual: {need.currentHeadcount} → Ideal: {need.predictedDemand}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium uppercase"
                          style={{ 
                            backgroundColor: `${getUrgencyColor(need.urgency)}20`,
                            color: getUrgencyColor(need.urgency)
                          }}
                        >
                          {need.urgency === 'high' ? 'Urgente' : need.urgency === 'medium' ? 'Médio' : 'Baixo'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">{need.recommendation}</p>
                  </motion.div>
                ))}

                {hiringNeeds.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">Equipe adequada para a demanda atual</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Sample Data
const SAMPLE_REVENUE: RevenueForecast[] = [
  { month: 'dezembro 2024', predicted: 920000, lowerBound: 800000, upperBound: 1040000, confidence: 85 },
  { month: 'janeiro 2025', predicted: 880000, lowerBound: 750000, upperBound: 1010000, confidence: 80 },
  { month: 'fevereiro 2025', predicted: 950000, lowerBound: 800000, upperBound: 1100000, confidence: 75 },
  { month: 'março 2025', predicted: 1020000, lowerBound: 850000, upperBound: 1190000, confidence: 70 },
  { month: 'abril 2025', predicted: 1080000, lowerBound: 890000, upperBound: 1270000, confidence: 65 },
  { month: 'maio 2025', predicted: 1150000, lowerBound: 940000, upperBound: 1360000, confidence: 60 }
];

const SAMPLE_CHURN: ChurnPrediction[] = [
  {
    clientId: '1',
    clientName: 'Tech Corp',
    churnProbability: 75,
    riskLevel: 'critical',
    factors: [{ name: 'NPS Baixo', impact: 'negative', weight: 30, description: 'NPS: 4' }],
    recommendedActions: ['Ligar para entender insatisfação', 'Oferecer reunião com gestor']
  },
  {
    clientId: '2',
    clientName: 'Startup XYZ',
    churnProbability: 45,
    riskLevel: 'medium',
    factors: [{ name: 'Baixa interação', impact: 'negative', weight: 20, description: '25 dias sem interação' }],
    recommendedActions: ['Agendar call de acompanhamento']
  },
  {
    clientId: '3',
    clientName: 'Empresa ABC',
    churnProbability: 30,
    riskLevel: 'low',
    factors: [],
    recommendedActions: []
  }
];

const SAMPLE_HIRING: HiringNeed[] = [
  { area: 'Design', currentHeadcount: 4, predictedDemand: 6, recommendation: 'Considerar contratar 2 pessoa(s)', urgency: 'high' },
  { area: 'Tráfego Pago', currentHeadcount: 3, predictedDemand: 4, recommendation: 'Considerar contratar 1 pessoa(s)', urgency: 'medium' },
  { area: 'Social Media', currentHeadcount: 5, predictedDemand: 5, recommendation: 'Equipe adequada', urgency: 'low' }
];

export default PredictionsPanel;









