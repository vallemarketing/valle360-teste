'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ThumbsUp, ThumbsDown, Meh, TrendingUp, TrendingDown,
  MessageSquare, AlertTriangle, Target, Users, Calendar,
  Send, Sparkles, Filter, Download, Bell
} from 'lucide-react';

interface NPSResponse {
  id: string;
  clientId: string;
  clientName: string;
  score: number;
  feedback?: string;
  category: 'promoter' | 'passive' | 'detractor';
  date: Date;
  followedUp: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface NPSAlert {
  id: string;
  clientName: string;
  score: number;
  previousScore?: number;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
  suggestedAction: string;
}

const SAMPLE_RESPONSES: NPSResponse[] = [
  { id: '1', clientId: 'c1', clientName: 'Tech Corp', score: 9, feedback: 'Excelente atendimento! A equipe sempre entrega no prazo.', category: 'promoter', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), followedUp: false, sentiment: 'positive' },
  { id: '2', clientId: 'c2', clientName: 'Startup XYZ', score: 4, feedback: 'Demora nas entregas e comunicação poderia melhorar.', category: 'detractor', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), followedUp: true, sentiment: 'negative' },
  { id: '3', clientId: 'c3', clientName: 'Loja ABC', score: 8, feedback: 'Bom trabalho, mas poderia ter mais opções de relatórios.', category: 'passive', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), followedUp: false, sentiment: 'neutral' },
  { id: '4', clientId: 'c4', clientName: 'Empresa DEF', score: 10, feedback: 'Simplesmente perfeito! Recomendo para todos.', category: 'promoter', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), followedUp: false, sentiment: 'positive' },
  { id: '5', clientId: 'c5', clientName: 'Indústria GHI', score: 6, feedback: 'Serviço ok, nada excepcional.', category: 'passive', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), followedUp: false, sentiment: 'neutral' },
  { id: '6', clientId: 'c6', clientName: 'Comércio JKL', score: 3, feedback: 'Muito insatisfeito com os resultados das campanhas.', category: 'detractor', date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), followedUp: true, sentiment: 'negative' },
];

const NPS_ALERTS: NPSAlert[] = [
  {
    id: '1',
    clientName: 'Startup XYZ',
    score: 4,
    previousScore: 7,
    reason: 'Queda de 3 pontos em relação à última pesquisa',
    urgency: 'high',
    suggestedAction: 'Agendar reunião urgente para entender insatisfação'
  },
  {
    id: '2',
    clientName: 'Comércio JKL',
    score: 3,
    reason: 'Detrator com feedback negativo sobre resultados',
    urgency: 'high',
    suggestedAction: 'Revisar estratégia de campanhas e apresentar plano de ação'
  },
  {
    id: '3',
    clientName: 'Loja ABC',
    score: 8,
    previousScore: 9,
    reason: 'Passou de Promotor para Passivo',
    urgency: 'medium',
    suggestedAction: 'Verificar se há alguma demanda não atendida'
  }
];

export function NPSDashboard() {
  const [responses] = useState<NPSResponse[]>(SAMPLE_RESPONSES);
  const [alerts] = useState<NPSAlert[]>(NPS_ALERTS);
  const [filter, setFilter] = useState<'all' | 'promoter' | 'passive' | 'detractor'>('all');
  const [selectedResponse, setSelectedResponse] = useState<NPSResponse | null>(null);

  // Calcular métricas
  const promoters = responses.filter(r => r.category === 'promoter').length;
  const passives = responses.filter(r => r.category === 'passive').length;
  const detractors = responses.filter(r => r.category === 'detractor').length;
  const total = responses.length;
  
  const npsScore = Math.round(((promoters - detractors) / total) * 100);
  const promoterPercent = Math.round((promoters / total) * 100);
  const passivePercent = Math.round((passives / total) * 100);
  const detractorPercent = Math.round((detractors / total) * 100);

  const filteredResponses = filter === 'all' 
    ? responses 
    : responses.filter(r => r.category === filter);

  const getScoreColor = (score: number) => {
    if (score >= 9) return '#10B981';
    if (score >= 7) return '#F59E0B';
    return '#EF4444';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'promoter': return <ThumbsUp className="w-4 h-4" />;
      case 'passive': return <Meh className="w-4 h-4" />;
      case 'detractor': return <ThumbsDown className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
          >
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Dashboard NPS
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Net Promoter Score e satisfação dos clientes
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white"
            style={{ backgroundColor: 'var(--primary-500)' }}
          >
            <Send className="w-4 h-4" />
            Enviar Pesquisa
          </button>
        </div>
      </div>

      {/* Main Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* NPS Score */}
        <div 
          className="lg:col-span-1 rounded-2xl p-6 text-center"
          style={{ 
            background: `linear-gradient(135deg, ${npsScore >= 50 ? '#10B98120' : npsScore >= 0 ? '#F59E0B20' : '#EF444420'} 0%, transparent 100%)`,
            border: `2px solid ${npsScore >= 50 ? '#10B981' : npsScore >= 0 ? '#F59E0B' : '#EF4444'}`
          }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            NPS Score
          </p>
          <div 
            className="text-6xl font-bold mb-2"
            style={{ color: npsScore >= 50 ? '#10B981' : npsScore >= 0 ? '#F59E0B' : '#EF4444' }}
          >
            {npsScore}
          </div>
          <div className="flex items-center justify-center gap-1 text-sm" style={{ color: 'var(--success-600)' }}>
            <TrendingUp className="w-4 h-4" />
            +5 pts vs mês anterior
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            {npsScore >= 70 ? 'Excelente!' : npsScore >= 50 ? 'Muito Bom' : npsScore >= 0 ? 'Precisa Melhorar' : 'Crítico'}
          </p>
        </div>

        {/* Distribution */}
        <div 
          className="lg:col-span-2 rounded-xl p-6 border"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-light)'
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Distribuição de Respostas
          </h3>

          <div className="space-y-4">
            {/* Promoters */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--success-600)' }}>
                  <ThumbsUp className="w-4 h-4" />
                  Promotores (9-10)
                </span>
                <span className="font-bold" style={{ color: 'var(--success-600)' }}>
                  {promoterPercent}% ({promoters})
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${promoterPercent}%` }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: '#10B981' }}
                />
              </div>
            </div>

            {/* Passives */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--warning-600)' }}>
                  <Meh className="w-4 h-4" />
                  Passivos (7-8)
                </span>
                <span className="font-bold" style={{ color: 'var(--warning-600)' }}>
                  {passivePercent}% ({passives})
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${passivePercent}%` }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: '#F59E0B' }}
                />
              </div>
            </div>

            {/* Detractors */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--error-600)' }}>
                  <ThumbsDown className="w-4 h-4" />
                  Detratores (0-6)
                </span>
                <span className="font-bold" style={{ color: 'var(--error-600)' }}>
                  {detractorPercent}% ({detractors})
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${detractorPercent}%` }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: '#EF4444' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-3">
          <StatCard 
            label="Total de Respostas"
            value={total.toString()}
            icon={<Users className="w-5 h-5" />}
            color="var(--primary-500)"
          />
          <StatCard 
            label="Última Pesquisa"
            value="2 dias"
            icon={<Calendar className="w-5 h-5" />}
            color="var(--info-500)"
          />
          <StatCard 
            label="Alertas Ativos"
            value={alerts.length.toString()}
            icon={<Bell className="w-5 h-5" />}
            color="var(--error-500)"
          />
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div 
          className="rounded-xl p-6 border"
          style={{ 
            backgroundColor: 'var(--error-50)',
            borderColor: 'var(--error-200)'
          }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--error-700)' }}>
            <AlertTriangle className="w-5 h-5" />
            Alertas de NPS ({alerts.length})
          </h3>

          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: 'white' }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ 
                      backgroundColor: `${getScoreColor(alert.score)}20`,
                      color: getScoreColor(alert.score)
                    }}
                  >
                    {alert.score}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {alert.clientName}
                      {alert.previousScore && (
                        <span className="text-sm ml-2" style={{ color: 'var(--error-500)' }}>
                          (era {alert.previousScore})
                        </span>
                      )}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {alert.reason}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="px-3 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: alert.urgency === 'high' ? 'var(--error-100)' : 'var(--warning-100)',
                      color: alert.urgency === 'high' ? 'var(--error-700)' : 'var(--warning-700)'
                    }}
                  >
                    {alert.urgency === 'high' ? '🚨 Urgente' : '⚡ Médio'}
                  </div>
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: 'var(--primary-500)' }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Ação Sugerida
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Responses List */}
      <div 
        className="rounded-xl p-6 border"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-light)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Respostas Recentes
          </h3>
          
          <div className="flex gap-2">
            {['all', 'promoter', 'passive', 'detractor'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: filter === f ? 'var(--primary-500)' : 'var(--bg-secondary)',
                  color: filter === f ? 'white' : 'var(--text-secondary)'
                }}
              >
                {f === 'all' ? 'Todos' : f === 'promoter' ? 'Promotores' : f === 'passive' ? 'Passivos' : 'Detratores'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredResponses.map((response, index) => (
            <motion.div
              key={response.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-4 p-4 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)'
              }}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{ 
                  backgroundColor: `${getScoreColor(response.score)}20`,
                  color: getScoreColor(response.score)
                }}
              >
                {response.score}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {response.clientName}
                    </span>
                    <span 
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                      style={{ 
                        backgroundColor: `${getScoreColor(response.score)}20`,
                        color: getScoreColor(response.score)
                      }}
                    >
                      {getCategoryIcon(response.category)}
                      {response.category === 'promoter' ? 'Promotor' : response.category === 'passive' ? 'Passivo' : 'Detrator'}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {response.date.toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {response.feedback && (
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    "{response.feedback}"
                  </p>
                )}

                <div className="flex items-center gap-3 mt-2">
                  {response.followedUp ? (
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--success-600)' }}>
                      ✓ Follow-up realizado
                    </span>
                  ) : response.category === 'detractor' && (
                    <button
                      className="text-xs flex items-center gap-1 px-2 py-1 rounded"
                      style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}
                    >
                      <MessageSquare className="w-3 h-3" />
                      Fazer follow-up
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div 
        className="rounded-xl p-6"
        style={{ 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}
      >
        <div className="flex items-start gap-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
          >
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Insights da Val sobre NPS
            </h3>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>
                📊 <strong>Tendência positiva:</strong> NPS subiu 5 pontos no último mês. Principal fator: melhoria no tempo de resposta.
              </p>
              <p>
                ⚠️ <strong>Atenção:</strong> 2 clientes passaram de Promotores para Passivos. Recomendo verificar se houve mudança no atendimento.
              </p>
              <p>
                💡 <strong>Sugestão:</strong> Clientes que mencionam "relatórios" têm NPS 15% menor. Considere melhorar essa área.
              </p>
              <p>
                🎯 <strong>Meta:</strong> Para atingir NPS 75 até o fim do trimestre, precisamos converter 2 Detratores em Passivos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon, color }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div 
      className="rounded-xl p-4 border"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-light)'
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

export default NPSDashboard;









