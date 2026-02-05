'use client';

/**
 * Valle 360 - Painel de Insights de IA
 * Mostra insights gerados pela IA em tempo real
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  Target,
  DollarSign,
  Users,
  RefreshCw,
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAI } from '@/hooks/useAI';

interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation' | 'alert';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact?: string;
  action?: string;
  category?: string;
  confidence?: number;
}

interface AIInsightsPanelProps {
  className?: string;
  maxInsights?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  compact?: boolean;
  showRefreshButton?: boolean;
  onInsightClick?: (insight: Insight) => void;
}

const priorityConfig = {
  critical: { 
    bg: 'bg-red-50 dark:bg-red-900/20', 
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-500'
  },
  high: { 
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-primary'
  },
  medium: { 
    bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-400',
    badge: 'bg-yellow-500'
  },
  low: { 
    bg: 'bg-green-50 dark:bg-green-900/20', 
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-400',
    badge: 'bg-green-500'
  }
};

const typeIcons = {
  opportunity: Target,
  risk: AlertTriangle,
  trend: TrendingUp,
  recommendation: Lightbulb,
  alert: AlertTriangle
};

export function AIInsightsPanel({
  className,
  maxInsights = 5,
  autoRefresh = false,
  refreshInterval = 60000,
  compact = false,
  showRefreshButton = true,
  onInsightClick
}: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  
  const { generateInsights, error } = useAI();

  // Carregar insights
  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const result = await generateInsights('strategic', { period: '30d' });
      setInsights(result.slice(0, maxInsights));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Erro ao carregar insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar ao montar
  useEffect(() => {
    loadInsights();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const timer = setInterval(loadInsights, refreshInterval);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  const handleInsightClick = (insight: Insight) => {
    if (compact) {
      setExpandedInsight(expandedInsight === insight.id ? null : insight.id);
    }
    onInsightClick?.(insight);
  };

  if (isLoading && insights.length === 0) {
    return (
      <div className={cn("p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800", className)}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-500">Gerando insights com IA...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Insights da Val IA</h3>
              {lastRefresh && (
                <p className="text-xs text-gray-500">
                  Atualizado {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
          
          {showRefreshButton && (
            <button
              onClick={loadInsights}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className={cn("w-5 h-5 text-gray-500", isLoading && "animate-spin")} />
            </button>
          )}
        </div>
      </div>

      {/* Insights List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <AnimatePresence>
          {insights.map((insight, idx) => {
            const config = priorityConfig[insight.priority];
            const Icon = typeIcons[insight.type] || Sparkles;
            const isExpanded = expandedInsight === insight.id;

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50",
                  isExpanded && config.bg
                )}
                onClick={() => handleInsightClick(insight)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", config.bg)}>
                    <Icon className={cn("w-4 h-4", config.text)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium text-white",
                        config.badge
                      )}>
                        {insight.priority}
                      </span>
                      {insight.category && (
                        <span className="text-xs text-gray-500">{insight.category}</span>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {insight.title}
                    </h4>
                    
                    {(!compact || isExpanded) && (
                      <motion.div
                        initial={compact ? { height: 0, opacity: 0 } : undefined}
                        animate={compact ? { height: 'auto', opacity: 1 } : undefined}
                        exit={compact ? { height: 0, opacity: 0 } : undefined}
                      >
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {insight.description}
                        </p>
                        
                        {insight.impact && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {insight.impact}
                          </p>
                        )}
                        
                        {insight.action && (
                          <button className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1 hover:underline">
                            {insight.action}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {compact && (
                    <ChevronRight className={cn(
                      "w-4 h-4 text-gray-400 transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {insights.length === 0 && !isLoading && (
        <div className="p-8 text-center text-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Nenhum insight disponível no momento</p>
          <button
            onClick={loadInsights}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Gerar novos insights
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Erro ao carregar insights: {error}
        </div>
      )}
    </div>
  );
}

export default AIInsightsPanel;

