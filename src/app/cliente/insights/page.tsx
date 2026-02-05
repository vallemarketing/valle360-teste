'use client';

/**
 * Valle 360 - Página de Insights para Cliente
 * Mostra insights personalizados gerados por IA
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Calendar,
  ArrowRight,
  Sparkles,
  ChevronRight,
  BarChart3,
  Users,
  DollarSign,
  Eye,
  RefreshCw,
  MessageSquare,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAI } from '@/hooks/useAI';

interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement' | 'recommendation' | 'trend';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact?: string;
  action?: string;
  metric?: {
    label: string;
    value: string;
    change?: number;
  };
}

interface WeeklySummary {
  period: string;
  highlights: string[];
  metrics: {
    label: string;
    value: string;
    change: number;
    icon: React.ElementType;
  }[];
  opportunities: string[];
}

const typeConfig = {
  opportunity: {
    icon: Target,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800'
  },
  achievement: {
    icon: CheckCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800'
  },
  recommendation: {
    icon: Lightbulb,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800'
  },
  trend: {
    icon: TrendingUp,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800'
  }
};

export default function ClienteInsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  
  const { generateInsights, isLoading: aiLoading } = useAI();

  // Carregar insights ao montar
  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      // Buscar insights da API
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'strategic', data: { userType: 'cliente' } })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Mapear insights para o formato do componente
        const mappedInsights = (data.data || []).map((insight: any, idx: number) => ({
          id: insight.id || `insight_${idx}`,
          type: mapInsightType(insight.type),
          priority: insight.priority || 'medium',
          title: insight.title,
          description: insight.description,
          impact: insight.impact,
          action: insight.action
        }));

        setInsights(mappedInsights);
      }

      // Resumo semanal (usa métricas reais do banco quando disponível)
      try {
        const metricsResp = await fetch('/api/client/social/metrics', { cache: 'no-store' });
        const metricsJson = await metricsResp.json();
        const latest = metricsResp.ok ? metricsJson?.latest : null;
        const prev = metricsResp.ok && Array.isArray(metricsJson?.daily) && metricsJson.daily.length > 1
          ? metricsJson.daily[metricsJson.daily.length - 2]
          : null;

        const pct = (curr: number, base: number) => {
          if (!base) return 0;
          return Math.round(((curr - base) / base) * 100);
        };

        const reach = Number(latest?.reach || 0);
        const impressions = Number(latest?.impressions || 0);
        const engaged = Number(latest?.engaged || 0);
        const profileViews = Number(latest?.profile_views || 0);

        const reachChange = prev ? pct(reach, Number(prev.reach || 0)) : 0;
        const impressionsChange = prev ? pct(impressions, Number(prev.impressions || 0)) : 0;
        const engagedChange = prev ? pct(engaged, Number(prev.engaged || 0)) : 0;
        const viewsChange = prev ? pct(profileViews, Number(prev.profile_views || 0)) : 0;

        setSummary({
          period: getWeekPeriod(),
          highlights: [
            reach ? `Alcance nas redes sociais: ${reach.toLocaleString('pt-BR')}` : 'Conecte suas redes em /cliente/redes para começar a ver métricas',
            impressions ? `Impressões: ${impressions.toLocaleString('pt-BR')}` : 'Sem dados de impressões no período ainda',
            engaged ? `Engajamento (página): ${engaged.toLocaleString('pt-BR')}` : 'Sem dados de engajamento no período ainda',
          ],
          metrics: [
            { label: 'Alcance', value: reach ? reach.toLocaleString('pt-BR') : '—', change: reachChange, icon: Eye },
            { label: 'Impressões', value: impressions ? impressions.toLocaleString('pt-BR') : '—', change: impressionsChange, icon: BarChart3 },
            { label: 'Engajamento', value: engaged ? engaged.toLocaleString('pt-BR') : '—', change: engagedChange, icon: Users },
            { label: 'Visitas ao perfil', value: profileViews ? profileViews.toLocaleString('pt-BR') : '—', change: viewsChange, icon: Target },
          ],
          opportunities: [
            'Conecte suas contas em /cliente/redes para habilitar métricas e publicação/agendamento no Post Center.',
            'Use a Val IA para pedir recomendações de conteúdo com base nas métricas do período.',
            'Acompanhe tendência e oportunidades semanalmente aqui nos Insights.',
          ],
        });
      } catch {
        setSummary({
          period: getWeekPeriod(),
          highlights: ['Conecte suas redes em /cliente/redes para habilitar métricas reais'],
          metrics: [
            { label: 'Alcance', value: '—', change: 0, icon: Eye },
            { label: 'Impressões', value: '—', change: 0, icon: BarChart3 },
            { label: 'Engajamento', value: '—', change: 0, icon: Users },
            { label: 'Visitas ao perfil', value: '—', change: 0, icon: Target },
          ],
          opportunities: ['Conecte suas redes para começar a coletar métricas automaticamente.'],
        });
      }

    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const mapInsightType = (type: string): Insight['type'] => {
    const typeMap: Record<string, Insight['type']> = {
      opportunity: 'opportunity',
      risk: 'warning',
      alert: 'warning',
      trend: 'trend',
      recommendation: 'recommendation',
      achievement: 'achievement'
    };
    return typeMap[type] || 'recommendation';
  };

  const getWeekPeriod = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${endOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Gerando seus insights personalizados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
      {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
      <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Insights Personalizados</h1>
              <p className="text-sm text-gray-500">Recomendações da Val IA para seu negócio</p>
            </div>
          </div>

          <Button onClick={loadInsights} disabled={aiLoading} variant="outline">
            <RefreshCw className={cn("w-4 h-4 mr-2", aiLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Resumo Semanal */}
        {summary && (
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Resumo da Semana</p>
                  <CardTitle className="text-2xl text-white">{summary.period}</CardTitle>
                </div>
                <Star className="w-8 h-8 text-yellow-300" />
              </div>
            </CardHeader>
            <CardContent>
              {/* Métricas */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {summary.metrics.map((metric, idx) => (
                  <div key={idx} className="text-center p-3 bg-white/10 rounded-xl">
                    <metric.icon className="w-5 h-5 mx-auto mb-1 opacity-70" />
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-xs opacity-70">{metric.label}</p>
                    <span className={cn(
                      "text-xs",
                      metric.change >= 0 ? "text-green-300" : "text-red-300"
                    )}>
                      {metric.change >= 0 ? '+' : ''}{metric.change}%
                    </span>
              </div>
            ))}
          </div>

              {/* Destaques */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/80">Destaques:</p>
                {summary.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-300" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Insights */}
        <div className="grid md:grid-cols-2 gap-4">
          <AnimatePresence>
            {insights.map((insight, idx) => {
              const config = typeConfig[insight.type];
              const Icon = config.icon;

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg",
                      config.bg,
                      config.border,
                      "border-2"
                    )}
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", config.bg)}>
                          <Icon className={cn("w-5 h-5", config.color)} />
                        </div>
                        <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {insight.priority === 'high' ? '⚡ Alta' : insight.priority === 'medium' ? '📊 Média' : '📌 Baixa'}
                            </Badge>
                  </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {insight.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {insight.description}
                          </p>
                          {insight.impact && (
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {insight.impact}
                            </p>
                          )}
                  </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Oportunidades */}
        {summary && summary.opportunities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Oportunidades Identificadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.opportunities.map((opp, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-600 font-bold">
                      {idx + 1}
          </div>
                    <span className="text-gray-700 dark:text-gray-300">{opp}</span>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
              </div>
            ))}
          </div>
            </CardContent>
          </Card>
        )}

        {/* CTA - Falar com a Agência */}
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MessageSquare className="w-10 h-10" />
                <div>
                  <h3 className="text-lg font-bold">Tem dúvidas sobre os insights?</h3>
                  <p className="text-gray-400">Nossa equipe está pronta para explicar e ajudar você a agir!</p>
        </div>
              </div>
              <Button className="bg-white text-gray-900 hover:bg-gray-100">
                Falar com a Agência
              </Button>
          </div>
          </CardContent>
        </Card>

        {/* Modal de Detalhes do Insight */}
        <AnimatePresence>
          {selectedInsight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setSelectedInsight(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn("p-3 rounded-xl", typeConfig[selectedInsight.type].bg)}>
                      {React.createElement(typeConfig[selectedInsight.type].icon, {
                        className: cn("w-6 h-6", typeConfig[selectedInsight.type].color)
                      })}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedInsight.title}
                      </h2>
                      <Badge variant="outline" className="mt-1">
                        {selectedInsight.type}
                      </Badge>
                </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {selectedInsight.description}
                  </p>

                  {selectedInsight.impact && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl mb-4">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Impacto Esperado
                      </p>
                      <p className="text-green-600 dark:text-green-300 mt-1">
                        {selectedInsight.impact}
                      </p>
                    </div>
                  )}

                  {selectedInsight.action && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Ação Recomendada
                      </p>
                      <p className="text-blue-600 dark:text-blue-300 mt-1">
                        {selectedInsight.action}
                      </p>
                      </div>
                    )}
                    
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setSelectedInsight(null)}
                    >
                      Fechar
                    </Button>
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Falar com a Equipe
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
