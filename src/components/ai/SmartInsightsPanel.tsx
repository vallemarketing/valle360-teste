'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, TrendingUp, AlertTriangle, Trophy, Target,
  ChevronRight, Sparkles, Brain, ArrowUpRight, ArrowDownRight,
  Zap, RefreshCw, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AIBrain, { AIInsight } from '@/lib/ai/brain';

interface SmartInsightsPanelProps {
  area: string;
  userId?: string;
  compact?: boolean;
  maxInsights?: number;
}

const INSIGHT_TYPE_CONFIG: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  opportunity: { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Oportunidade' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Atenção' },
  achievement: { icon: Trophy, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Conquista' },
  suggestion: { icon: Lightbulb, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Sugestão' },
  prediction: { icon: Brain, color: 'text-indigo-600', bgColor: 'bg-indigo-100', label: 'Previsão' },
};

const IMPACT_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: 'text-gray-500', label: 'Baixo' },
  medium: { color: 'text-amber-500', label: 'Médio' },
  high: { color: 'text-red-500', label: 'Alto' },
};

export default function SmartInsightsPanel({
  area,
  userId,
  compact = false,
  maxInsights = 5
}: SmartInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [area]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const areaInsights = await AIBrain.Insights.getInsightsForArea(area);
      setInsights(areaInsights);
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  const handleAction = (insight: AIInsight) => {
    // Aqui implementaria a ação sugerida
    console.log('Executando ação:', insight.suggestedAction);
    setSelectedInsight(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-600">Sem insights no momento</h3>
            <p className="text-sm text-gray-400">A IA está analisando seus dados</p>
          </div>
        </div>
      </div>
    );
  }

  const displayedInsights = insights.slice(0, maxInsights);

  return (
    <>
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Insights Inteligentes</h3>
                <p className="text-sm text-gray-500">
                  {insights.length} insight{insights.length > 1 ? 's' : ''} para você
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4 text-gray-500", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Insights List */}
        <div className="divide-y">
          {displayedInsights.map((insight, index) => {
            const typeConfig = INSIGHT_TYPE_CONFIG[insight.type];
            const impactConfig = IMPACT_CONFIG[insight.impact];
            const Icon = typeConfig.icon;

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedInsight(insight)}
                className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    typeConfig.bgColor
                  )}>
                    <Icon className={cn("w-5 h-5", typeConfig.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded",
                        typeConfig.bgColor,
                        typeConfig.color
                      )}>
                        {typeConfig.label}
                      </span>
                      <span className={cn("text-xs font-medium", impactConfig.color)}>
                        Impacto {impactConfig.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {insight.confidence}% confiança
                      </span>
                    </div>

                    <h4 className="font-semibold text-gray-800 text-sm">
                      {insight.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {insight.description}
                    </p>

                    {/* Action */}
                    {insight.actionable && insight.suggestedAction && (
                      <div className="flex items-center gap-1 mt-2 text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                        <Zap className="w-3 h-3" />
                        {insight.suggestedAction}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </div>

                  {/* Confidence indicator */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 relative">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${insight.confidence * 1.26} 126`}
                          className={typeConfig.color}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-600">
                        {insight.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        {insights.length > maxInsights && (
          <div className="px-5 py-3 bg-gray-50 border-t">
            <button className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
              Ver todos os {insights.length} insights
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* AI Badge */}
        <div className="px-5 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-t">
          <div className="flex items-center gap-2 text-xs text-indigo-600">
            <Brain className="w-3 h-3" />
            <span>Análise gerada por IA • Atualizado agora</span>
          </div>
        </div>
      </div>

      {/* Insight Detail Modal */}
      <AnimatePresence>
        {selectedInsight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedInsight(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      INSIGHT_TYPE_CONFIG[selectedInsight.type].bgColor
                    )}>
                      {(() => {
                        const Icon = INSIGHT_TYPE_CONFIG[selectedInsight.type].icon;
                        return <Icon className={cn("w-6 h-6", INSIGHT_TYPE_CONFIG[selectedInsight.type].color)} />;
                      })()}
                    </div>
                    <div>
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded",
                        INSIGHT_TYPE_CONFIG[selectedInsight.type].bgColor,
                        INSIGHT_TYPE_CONFIG[selectedInsight.type].color
                      )}>
                        {INSIGHT_TYPE_CONFIG[selectedInsight.type].label}
                      </span>
                      <h2 className="font-bold text-gray-800 mt-1">{selectedInsight.title}</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInsight(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-600">{selectedInsight.description}</p>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{selectedInsight.confidence}%</div>
                    <div className="text-xs text-gray-500">Confiança</div>
                  </div>
                  <div className="h-10 w-px bg-gray-200" />
                  <div className="text-center">
                    <div className={cn("text-lg font-bold", IMPACT_CONFIG[selectedInsight.impact].color)}>
                      {IMPACT_CONFIG[selectedInsight.impact].label}
                    </div>
                    <div className="text-xs text-gray-500">Impacto</div>
                  </div>
                </div>

                {selectedInsight.suggestedAction && (
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-700 font-medium mb-2">
                      <Zap className="w-4 h-4" />
                      Ação Sugerida
                    </div>
                    <p className="text-indigo-600">{selectedInsight.suggestedAction}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                >
                  Fechar
                </button>
                {selectedInsight.actionable && (
                  <button
                    onClick={() => handleAction(selectedInsight)}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Executar Ação
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}






