'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target, TrendingUp, TrendingDown, Minus, Award,
  ChevronRight, AlertTriangle, CheckCircle2, Clock,
  Flame, Star, Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'quantity' | 'percentage' | 'currency';
  currentValue: number;
  targetValue: number;
  unit?: string;
  deadline: Date;
  category: string;
  trend: 'up' | 'down' | 'stable';
  previousValue?: number;
}

interface GoalsTrackerProps {
  employeeId?: string;
  area?: string;
  compact?: boolean;
}

const CATEGORY_CONFIG: Record<string, { color: string; bgColor: string; icon: any }> = {
  entregas: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: CheckCircle2 },
  qualidade: { color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Star },
  eficiencia: { color: 'text-green-600', bgColor: 'bg-green-100', icon: Clock },
  financeiro: { color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: Trophy },
};

export default function GoalsTracker({
  employeeId,
  area,
  compact = false
}: GoalsTrackerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, [employeeId, area]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        setGoals([]);
        return;
      }

      let collaboratorId = employeeId || null;
      if (!collaboratorId) {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (userId) {
          const { data: emp } = await supabase.from('employees').select('id').eq('user_id', userId).maybeSingle();
          collaboratorId = emp?.id ? String(emp.id) : null;
        }
      }

      const qs = new URLSearchParams();
      if (collaboratorId) qs.set('collaborator_id', collaboratorId);
      qs.set('status', 'active');

      const res = await fetch(`/api/goals?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setGoals([]);
        return;
      }

      const rows = (json.data || []) as any[];
      const active = rows[0];
      const periodEnd = active?.period_end ? new Date(String(active.period_end)) : endOfMonth(new Date());

      const metrics = (active?.goals || {}) as Record<string, { target: number; current: number; unit: string }>;
      const mapped: Goal[] = Object.entries(metrics).map(([metric, v], idx) => {
        const unit = String(v?.unit || '');
        const type: Goal['type'] =
          unit === 'R$' ? 'currency' : unit === '%' ? 'percentage' : 'quantity';

        const titleMap: Record<string, string> = {
          posts: 'Posts Publicados',
          stories: 'Stories',
          engajamento: 'Taxa de Engajamento',
          alcance: 'Alcance Total',
          pecas: 'Peças Entregues',
          revisoes: 'Revisões',
          tempo_medio: 'Tempo Médio',
          satisfacao: 'Satisfação',
          roas: 'ROAS Médio',
          conversoes: 'Conversões',
          cpc: 'CPC Médio',
          investimento_gerenciado: 'Investimento Gerenciado',
          videos: 'Vídeos Entregues',
          minutos_produzidos: 'Minutos Produzidos',
          views_total: 'Views Totais',
          leads_qualificados: 'Leads Qualificados',
          reunioes: 'Reuniões Realizadas',
          propostas: 'Propostas Enviadas',
          fechamentos: 'Fechamentos',
        };

        const category: string =
          ['posts', 'stories', 'engajamento', 'alcance'].includes(metric) ? 'entregas' :
          ['pecas', 'videos', 'minutos_produzidos', 'views_total'].includes(metric) ? 'entregas' :
          ['tempo_medio', 'cpc', 'tempo_vaga'].includes(metric) ? 'eficiencia' :
          ['satisfacao', 'retention_rate', 'satisfacao_onboarding', 'revisoes'].includes(metric) ? 'qualidade' :
          ['investimento_gerenciado'].includes(metric) ? 'financeiro' :
          'entregas';

        return {
          id: `${active?.id || 'goal'}:${metric}:${idx}`,
          title: titleMap[metric] || metric,
          description: active?.ai_reasoning ? String(active.ai_reasoning).slice(0, 120) : undefined,
          type,
          currentValue: Number(v?.current || 0),
          targetValue: Number(v?.target || 0),
          unit: unit || undefined,
          deadline: periodEnd,
          category,
          trend: 'stable',
          previousValue: undefined,
        };
      });

      setGoals(mapped);
    } catch (e) {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (goal: Goal): number => {
    if (goal.type === 'quantity' && goal.title.includes('Tempo')) {
      // Para tempo, menor é melhor
      return Math.min(100, Math.round((goal.targetValue / goal.currentValue) * 100));
    }
    return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return 'from-green-500 to-emerald-500';
    if (progress >= 70) return 'from-blue-500 to-indigo-500';
    if (progress >= 50) return 'from-yellow-500 to-amber-500';
    return 'from-red-500 to-amber-500';
  };

  const formatValue = (goal: Goal, value: number): string => {
    switch (goal.type) {
      case 'currency':
        return `R$ ${value.toLocaleString('pt-BR')}`;
      case 'percentage':
        return `${value}%`;
      default:
        return `${value}${goal.unit ? ` ${goal.unit}` : ''}`;
    }
  };

  const getTrendIcon = (trend: Goal['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  // Calcular estatísticas gerais
  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + calculateProgress(g), 0) / goals.length)
    : 0;
  const goalsOnTrack = goals.filter(g => calculateProgress(g) >= 70).length;
  const goalsAtRisk = goals.filter(g => calculateProgress(g) < 50).length;
  const daysRemaining = differenceInDays(endOfMonth(new Date()), new Date());

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-gradient-to-r from-amber-50 to-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Suas Metas</h3>
              <p className="text-sm text-gray-500">
                {daysRemaining} dias restantes no mês
              </p>
            </div>
          </div>

          {/* Overall Progress Ring */}
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${overallProgress * 1.51} 151`}
                className={cn(
                  overallProgress >= 70 ? "text-green-500" :
                  overallProgress >= 50 ? "text-amber-500" : "text-red-500"
                )}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
              {overallProgress}%
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">{goalsOnTrack} no caminho</span>
          </div>
          {goalsAtRisk > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-red-600">{goalsAtRisk} em risco</span>
            </div>
          )}
        </div>
      </div>

      {/* Goals List */}
      <div className="divide-y">
        {goals.map((goal, index) => {
          const progress = calculateProgress(goal);
          const categoryConfig = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.entregas;
          const CategoryIcon = categoryConfig.icon;
          const isAtRisk = progress < 50;
          const isAhead = progress >= 100;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "px-5 py-4 hover:bg-gray-50 transition-colors",
                isAtRisk && "bg-red-50/50"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Category Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  categoryConfig.bgColor
                )}>
                  <CategoryIcon className={cn("w-5 h-5", categoryConfig.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800 text-sm">{goal.title}</h4>
                      {getTrendIcon(goal.trend)}
                      {isAhead && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          Meta batida!
                        </span>
                      )}
                      {isAtRisk && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Em risco
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      isAhead ? "text-green-600" :
                      isAtRisk ? "text-red-600" : "text-gray-700"
                    )}>
                      {progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        getProgressColor(progress)
                      )}
                    />
                  </div>

                  {/* Values */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {formatValue(goal, goal.currentValue)} / {formatValue(goal, goal.targetValue)}
                    </span>
                    {goal.previousValue !== undefined && (
                      <span className={cn(
                        "flex items-center gap-1",
                        goal.trend === 'up' ? "text-green-500" :
                        goal.trend === 'down' ? "text-red-500" : "text-gray-400"
                      )}>
                        {goal.trend === 'up' ? '+' : goal.trend === 'down' ? '' : ''}
                        {Math.abs(goal.currentValue - goal.previousValue)}
                        {goal.type === 'percentage' ? '%' : ''} vs anterior
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer - AI Tip */}
      {goalsAtRisk > 0 && (
        <div className="px-5 py-3 bg-gradient-to-r from-red-50 to-amber-50 border-t">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">
                Atenção: {goalsAtRisk} meta{goalsAtRisk > 1 ? 's' : ''} em risco
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Você precisa acelerar para bater suas metas este mês. A IA sugere priorizar as entregas pendentes.
              </p>
            </div>
          </div>
        </div>
      )}

      {overallProgress >= 90 && (
        <div className="px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-t">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-700 font-medium">
              Excelente! Você está arrasando nas metas! 🎉
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Versão compacta para sidebar
export function GoalsTrackerMini({ goals }: { goals: Goal[] }) {
  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => {
        const progress = g.type === 'quantity' && g.title.includes('Tempo')
          ? Math.min(100, Math.round((g.targetValue / g.currentValue) * 100))
          : Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
        return sum + progress;
      }, 0) / goals.length)
    : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 transform -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${overallProgress * 0.88} 88`}
            className={cn(
              overallProgress >= 70 ? "text-green-500" :
              overallProgress >= 50 ? "text-amber-500" : "text-red-500"
            )}
          />
        </svg>
      </div>
      <div className="text-xs">
        <div className="font-bold text-gray-700">{overallProgress}%</div>
        <div className="text-gray-500">Metas</div>
      </div>
    </div>
  );
}






