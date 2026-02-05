'use client';

/**
 * Valle 360 - Dashboard de Monitoramento de Sentimento
 * Visualização em tempo real das análises automáticas
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Users,
  Star,
  FileText,
  RefreshCw,
  Filter,
  Download,
  Bell,
  Eye,
  ChevronRight,
  Sparkles,
  BarChart3,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// =====================================================
// TIPOS
// =====================================================

interface SentimentStats {
  totals: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    average_score: number;
    by_source: Record<string, number>;
  };
  alerts: {
    pending: number;
    by_severity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  trend: Array<{
    date: string;
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    average_score: number;
  }>;
  entities: {
    top_positive: Array<{ name: string; count: number; avgSentiment: number }>;
    top_negative: Array<{ name: string; count: number; avgSentiment: number }>;
  };
  percentages: {
    positive: string;
    neutral: string;
    negative: string;
  };
}

interface Alert {
  id: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  client_name?: string;
  source_type: string;
  suggested_action: string;
  status: string;
  created_at: string;
}

// =====================================================
// CORES
// =====================================================

const SENTIMENT_COLORS = {
  positive: '#10B981',
  neutral: '#6B7280',
  negative: '#EF4444'
};

const SEVERITY_COLORS = {
  critical: '#DC2626',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#6B7280'
};

// =====================================================
// SEM MOCKS: dados vêm 100% de /api/sentiment/*
// =====================================================

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function SentimentMonitoringPage() {
  const [stats, setStats] = useState<SentimentStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [queueStatus, setQueueStatus] = useState({ pending: 0, processing: 0 });

  // Carregar dados
  useEffect(() => {
    loadData();
    loadAlerts();
    loadQueueStatus();

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      loadData();
      loadAlerts();
      loadQueueStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [period]);

  const loadData = async () => {
    try {
      const response = await fetch(`/api/sentiment/stats?period=${period}`);
      const data = await response.json();
      if (data.success && data.totals) {
        setStats(data);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/sentiment/alerts?status=pending&limit=10');
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setAlerts(data.data);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      setAlerts([]);
    }
  };

  const loadQueueStatus = async () => {
    try {
      const response = await fetch('/api/sentiment/process-queue');
      const data = await response.json();
      if (data.queue_status) {
        setQueueStatus(data.queue_status);
      } else {
        setQueueStatus({ pending: 0, processing: 0 });
      }
    } catch (error) {
      console.error('Erro ao carregar status da fila:', error);
      setQueueStatus({ pending: 0, processing: 0 });
    }
  };

  const processQueue = async () => {
    setIsProcessingQueue(true);
    try {
      const response = await fetch('/api/sentiment/process-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'batch', max_items: 50 })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`✅ Processados ${data.successful} de ${data.processed} itens`);
        loadData();
        loadQueueStatus();
      }
    } catch (error) {
      toast.error('Erro ao processar fila');
    } finally {
      setIsProcessingQueue(false);
    }
  };

  const handleAlertAction = async (alertId: string, action: string) => {
    try {
      const response = await fetch('/api/sentiment/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId, action })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Alerta ${action === 'resolve' ? 'resolvido' : 'reconhecido'}!`);
        loadAlerts();
        setSelectedAlert(null);
      }
    } catch (error) {
      toast.error('Erro ao atualizar alerta');
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'negative': return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'nps_response': return <Star className="w-4 h-4" />;
      case 'task_comment': return <FileText className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Preparar dados do pie chart
  const pieData = stats ? [
    { name: 'Positivo', value: stats.totals.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Neutro', value: stats.totals.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Negativo', value: stats.totals.negative, color: SENTIMENT_COLORS.negative }
  ] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <div className="text-sm text-gray-600 dark:text-gray-300">Carregando monitoramento…</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-3xl mx-auto">
          <EmptyState
            type="default"
            title="Sem dados de sentimento ainda"
            description="Nenhuma análise encontrada no período selecionado. Envie itens para a fila de sentimento e processe a fila para gerar estatísticas e alertas (sem mocks)."
            animated={false}
            action={{ label: isProcessingQueue ? 'Processando…' : 'Processar fila agora', onClick: processQueue }}
            secondaryAction={{ label: 'Atualizar', onClick: loadData }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Monitoramento de Sentimento
              </h1>
              <p className="text-gray-500">
                Análises automáticas em tempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Período */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="1d">Últimas 24h</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>

            {/* Processar Fila */}
            {queueStatus.pending > 0 && (
              <Button
                onClick={processQueue}
                disabled={isProcessingQueue}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isProcessingQueue ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4 mr-2" />
                )}
                Processar Fila ({queueStatus.pending})
              </Button>
            )}

            {/* Refresh */}
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : stats ? (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.totals.total}</p>
                      <p className="text-sm text-gray-500">Total Análises</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-green-700">{stats.totals.positive}</p>
                      <p className="text-sm text-green-600">{stats.percentages.positive}% Positivo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Minus className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.totals.neutral}</p>
                      <p className="text-sm text-gray-500">{stats.percentages.neutral}% Neutro</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-red-700">{stats.totals.negative}</p>
                      <p className="text-sm text-red-600">{stats.percentages.negative}% Negativo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={stats.alerts.pending > 0 ? "border-amber-200 bg-amber-50" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.alerts.pending > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
                      <Bell className={`w-6 h-6 ${stats.alerts.pending > 0 ? 'text-primary' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.alerts.pending}</p>
                      <p className="text-sm text-gray-500">Alertas Pendentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-3 gap-6">
              {/* Tendência */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Tendência de Sentimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="positive" 
                          name="Positivo"
                          stackId="1"
                          stroke={SENTIMENT_COLORS.positive}
                          fill={SENTIMENT_COLORS.positive}
                          fillOpacity={0.6}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="neutral" 
                          name="Neutro"
                          stackId="1"
                          stroke={SENTIMENT_COLORS.neutral}
                          fill={SENTIMENT_COLORS.neutral}
                          fillOpacity={0.6}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="negative" 
                          name="Negativo"
                          stackId="1"
                          stroke={SENTIMENT_COLORS.negative}
                          fill={SENTIMENT_COLORS.negative}
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Distribuição
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertas e Entidades */}
            <div className="grid grid-cols-2 gap-6">
              {/* Alertas Pendentes */}
              <Card className="border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-primary" />
                      Alertas Pendentes
                    </span>
                    <Badge variant="outline" className="border-primary text-primary">
                      {alerts.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                        <p>Nenhum alerta pendente!</p>
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all ${
                            alert.severity === 'critical' ? 'border-red-300 bg-red-50' :
                            alert.severity === 'high' ? 'border-amber-300 bg-amber-50' :
                            'border-gray-200 bg-white'
                          }`}
                          onClick={() => setSelectedAlert(alert)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              alert.severity === 'critical' ? 'bg-red-500' :
                              alert.severity === 'high' ? 'bg-primary' :
                              alert.severity === 'medium' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {getSourceIcon(alert.source_type)}
                                <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                              </div>
                              {alert.client_name && (
                                <p className="text-xs text-gray-500 mt-1">Cliente: {alert.client_name}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(alert.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Entidades Mais Mencionadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Entidades Mais Mencionadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Positivas */}
                    <div>
                      <h4 className="text-sm font-medium text-green-600 mb-3 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Positivas
                      </h4>
                      <div className="space-y-2">
                        {stats.entities.top_positive.length === 0 ? (
                          <p className="text-sm text-gray-400">Nenhuma entidade</p>
                        ) : (
                          stats.entities.top_positive.map((entity, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                              <span className="text-sm font-medium capitalize">{entity.name}</span>
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                {entity.count}x
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Negativas */}
                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        Negativas
                      </h4>
                      <div className="space-y-2">
                        {stats.entities.top_negative.length === 0 ? (
                          <p className="text-sm text-gray-400">Nenhuma entidade</p>
                        ) : (
                          stats.entities.top_negative.map((entity, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                              <span className="text-sm font-medium capitalize">{entity.name}</span>
                              <Badge variant="outline" className="text-red-600 border-red-300">
                                {entity.count}x
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma análise de sentimento encontrada</p>
            <p className="text-sm mt-2">Configure a automação para começar a analisar</p>
          </div>
        )}

        {/* Modal de Detalhe do Alerta */}
        <AnimatePresence>
          {selectedAlert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setSelectedAlert(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl"
              >
                <div className="p-6 border-b">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${
                      selectedAlert.severity === 'critical' ? 'bg-red-500' :
                      selectedAlert.severity === 'high' ? 'bg-primary' :
                      selectedAlert.severity === 'medium' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`} />
                    <div>
                      <h2 className="text-xl font-bold">{selectedAlert.title}</h2>
                      <Badge className={`mt-1 ${
                        selectedAlert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        selectedAlert.severity === 'high' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedAlert.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {selectedAlert.client_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Cliente</label>
                      <p className="text-gray-900">{selectedAlert.client_name}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Descrição</label>
                    <p className="text-gray-900">{selectedAlert.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ação Sugerida</label>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      💡 {selectedAlert.suggested_action}
                    </p>
                  </div>
                </div>
                <div className="p-6 border-t flex justify-between">
                  <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                    Fechar
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => handleAlertAction(selectedAlert.id, 'acknowledge')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Reconhecer
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAlertAction(selectedAlert.id, 'resolve')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolver
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

