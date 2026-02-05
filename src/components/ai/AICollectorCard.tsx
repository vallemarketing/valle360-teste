'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Clock, Calendar, Target, DollarSign,
  Users, MessageSquare, ChevronRight, X, Bell, Zap,
  CheckCircle2, ArrowRight, Flame, TrendingDown, Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AIBrain, { AIAlert } from '@/lib/ai/brain';

interface AICollectorCardProps {
  userId?: string;
  area?: string;
  compact?: boolean;
  maxAlerts?: number;
  onAlertClick?: (alert: AIAlert) => void;
}

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  tasks: { icon: Clock, color: 'text-primary', bgColor: 'bg-amber-100', label: 'Tarefas' },
  meetings: { icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Reuniões' },
  metrics: { icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Métricas' },
  sales: { icon: Users, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Vendas' },
  performance: { icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Desempenho' },
  financial: { icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-100', label: 'Financeiro' },
  legal: { icon: Scale, color: 'text-indigo-600', bgColor: 'bg-indigo-100', label: 'Jurídico' },
};

const SEVERITY_CONFIG: Record<string, { color: string; bgColor: string; borderColor: string; pulse: boolean }> = {
  info: { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', pulse: false },
  warning: { color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', pulse: false },
  urgent: { color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', pulse: true },
  critical: { color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-300', pulse: true },
};

export default function AICollectorCard({
  userId,
  area,
  compact = false,
  maxAlerts = 5,
  onAlertClick
}: AICollectorCardProps) {
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAlerts();
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, area]);

  const loadAlerts = async () => {
    try {
      const allAlerts = await AIBrain.Collector.collectAllAlerts();
      // Filtrar por usuário/área se necessário
      const filteredAlerts = allAlerts.filter(a => !dismissedAlerts.has(a.id));
      setAlerts(filteredAlerts);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const handleAlertClick = (alert: AIAlert) => {
    if (onAlertClick) {
      onAlertClick(alert);
    } else if (alert.actionUrl) {
      window.location.href = alert.actionUrl;
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const urgentCount = alerts.filter(a => a.severity === 'urgent').length;
  const displayedAlerts = expanded ? alerts : alerts.slice(0, maxAlerts);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-green-800">Tudo em dia! 🎉</h3>
            <p className="text-sm text-green-600">Nenhuma pendência no momento</p>
          </div>
        </div>
        <p className="text-xs text-green-500 mt-3">
          A IA está monitorando suas tarefas, reuniões e metas continuamente.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white rounded-2xl border shadow-sm overflow-hidden",
      criticalCount > 0 && "border-red-300 ring-2 ring-red-100"
    )}>
      {/* Header */}
      <div className={cn(
        "px-5 py-4 border-b",
        criticalCount > 0 ? "bg-gradient-to-r from-red-50 to-amber-50" : "bg-gradient-to-r from-amber-50 to-yellow-50"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              criticalCount > 0 ? "bg-red-100" : "bg-amber-100"
            )}>
              {criticalCount > 0 ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Flame className="w-5 h-5 text-red-600" />
                </motion.div>
              ) : (
                <Bell className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <h3 className={cn(
                "font-bold",
                criticalCount > 0 ? "text-red-800" : "text-amber-800"
              )}>
                IA está cobrando você
              </h3>
              <p className={cn(
                "text-sm",
                criticalCount > 0 ? "text-red-600" : "text-amber-600"
              )}>
                {alerts.length} {alerts.length === 1 ? 'pendência' : 'pendências'} detectada{alerts.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Badges de severidade */}
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
                {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
              </span>
            )}
            {urgentCount > 0 && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="divide-y">
        <AnimatePresence mode="popLayout">
          {displayedAlerts.map((alert, index) => {
            const category = CATEGORY_CONFIG[alert.category] || CATEGORY_CONFIG.tasks;
            const severity = SEVERITY_CONFIG[alert.severity];
            const Icon = category.icon;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleAlertClick(alert)}
                className={cn(
                  "px-5 py-4 cursor-pointer transition-all hover:bg-gray-50 group",
                  severity.bgColor,
                  severity.pulse && "animate-pulse-subtle"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Ícone da categoria */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    category.bgColor
                  )}>
                    <Icon className={cn("w-5 h-5", category.color)} />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded",
                        severity.bgColor,
                        severity.color
                      )}>
                        {alert.severity === 'critical' ? '🔴 CRÍTICO' :
                         alert.severity === 'urgent' ? '🟠 URGENTE' :
                         alert.severity === 'warning' ? '🟡 ATENÇÃO' : '🔵 INFO'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {category.label}
                      </span>
                    </div>

                    <h4 className={cn("font-semibold text-sm", severity.color)}>
                      {alert.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {alert.description}
                    </p>

                    {/* Ação sugerida */}
                    {alert.actionLabel && (
                      <div className="flex items-center justify-between mt-3">
                        <button className={cn(
                          "flex items-center gap-1 text-sm font-medium transition-colors",
                          category.color,
                          "hover:underline"
                        )}>
                          {alert.actionLabel}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(alert.createdAt, { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botão de dismiss */}
                  <button
                    onClick={(e) => handleDismiss(alert.id, e)}
                    className="p-1 hover:bg-gray-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer - Ver mais */}
      {alerts.length > maxAlerts && (
        <div className="px-5 py-3 bg-gray-50 border-t">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            {expanded ? 'Ver menos' : `Ver mais ${alerts.length - maxAlerts} alertas`}
            <ChevronRight className={cn(
              "w-4 h-4 transition-transform",
              expanded && "rotate-90"
            )} />
          </button>
        </div>
      )}

      {/* Rodapé com info da IA */}
      <div className="px-5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-t">
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <Zap className="w-3 h-3" />
          <span>IA monitorando em tempo real • Última verificação: agora</span>
        </div>
      </div>
    </div>
  );
}

// Versão compacta para sidebar
export function AICollectorBadge({ alerts }: { alerts: AIAlert[] }) {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const urgentCount = alerts.filter(a => a.severity === 'urgent').length;
  const total = alerts.length;

  if (total === 0) return null;

  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
      criticalCount > 0 ? "bg-red-100 text-red-700 animate-pulse" :
      urgentCount > 0 ? "bg-amber-100 text-amber-700" :
      "bg-yellow-100 text-yellow-700"
    )}>
      <AlertTriangle className="w-3 h-3" />
      {total}
    </div>
  );
}






