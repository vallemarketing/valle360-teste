'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Smile,
  Meh,
  Frown
} from 'lucide-react';

interface SentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

interface ConversationTypeStats {
  type: string;
  label: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positivePercent: number;
}

interface SentimentTrend {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  avgScore: number;
}

interface SentimentAlert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  conversationName: string;
  suggestedAction: string;
  status: string;
  createdAt: string;
}

interface AnalyticsData {
  summary: SentimentSummary;
  byType: ConversationTypeStats[];
  bySender: ConversationTypeStats[];
  trend: SentimentTrend[];
  alerts: SentimentAlert[];
  period: string;
  analyzedMessages: number;
}

export function ConversationAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/conversation-analytics?period=${period}`);
      const result = await response.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve' | 'dismiss') => {
    try {
      await fetch('/api/admin/conversation-analytics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action })
      });
      loadData();
    } catch (err) {
      console.error('Erro ao atualizar alerta:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-primary text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <Button onClick={loadData} variant="outline" className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const positivePercent = data.summary.total > 0 
    ? Math.round((data.summary.positive / data.summary.total) * 100) 
    : 0;
  const neutralPercent = data.summary.total > 0 
    ? Math.round((data.summary.neutral / data.summary.total) * 100) 
    : 0;
  const negativePercent = data.summary.total > 0 
    ? Math.round((data.summary.negative / data.summary.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header com período */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Análise de Conversas
          </h2>
          <p className="text-sm text-gray-500">
            {data.analyzedMessages} mensagens analisadas
          </p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className={period === p ? 'bg-primary hover:bg-[#1260b5]' : ''}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Positivo</p>
                <p className="text-2xl font-bold text-green-600">{positivePercent}%</p>
                <p className="text-xs text-gray-400">{data.summary.positive} mensagens</p>
              </div>
              <Smile className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Neutro</p>
                <p className="text-2xl font-bold text-gray-600">{neutralPercent}%</p>
                <p className="text-xs text-gray-400">{data.summary.neutral} mensagens</p>
              </div>
              <Meh className="w-10 h-10 text-gray-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Negativo</p>
                <p className="text-2xl font-bold text-red-600">{negativePercent}%</p>
                <p className="text-xs text-gray-400">{data.summary.negative} mensagens</p>
              </div>
              <Frown className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Analisado</p>
                <p className="text-2xl font-bold text-blue-600">{data.summary.total}</p>
                <p className="text-xs text-gray-400">mensagens</p>
              </div>
              <MessageCircle className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência de Sentimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Tendência de Sentimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.trend.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Sem dados suficientes para exibir tendência
              </div>
            ) : (
              <div className="space-y-2">
                {data.trend.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center gap-2">
                    <span className="w-16 text-xs text-gray-500">{formatDate(day.date)}</span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-green-500 h-full"
                        style={{ width: `${day.positive + day.neutral + day.negative > 0 ? (day.positive / (day.positive + day.neutral + day.negative)) * 100 : 0}%` }}
                      />
                      <div 
                        className="bg-gray-400 h-full"
                        style={{ width: `${day.positive + day.neutral + day.negative > 0 ? (day.neutral / (day.positive + day.neutral + day.negative)) * 100 : 0}%` }}
                      />
                      <div 
                        className="bg-red-500 h-full"
                        style={{ width: `${day.positive + day.neutral + day.negative > 0 ? (day.negative / (day.positive + day.neutral + day.negative)) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-8 text-xs text-gray-500 text-right">
                      {day.positive + day.neutral + day.negative}
                    </span>
                  </div>
                ))}
                <div className="flex justify-center gap-4 mt-4 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded" /> Positivo
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded" /> Neutro
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded" /> Negativo
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas de Sentimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Alertas de Sentimento
              {data.alerts.length > 0 && (
                <Badge variant="danger" className="ml-2">
                  {data.alerts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum alerta pendente</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data.alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(alert.createdAt)}
                          </span>
                        </div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {alert.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {alert.conversationName}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {alert.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                            title="Reconhecer"
                          >
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleAlertAction(alert.id, 'resolve')}
                          title="Resolver"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleAlertAction(alert.id, 'dismiss')}
                          title="Dispensar"
                        >
                          <XCircle className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Análise por Tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por tipo de conversa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              Por Tipo de Conversa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.byType.map((type) => (
                <div key={type.type} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{type.label}</span>
                    <span className="text-xs text-gray-500">
                      {type.positivePercent}% positivo ({type.total} msgs)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-green-500 h-full transition-all"
                      style={{ width: `${type.total > 0 ? (type.positive / type.total) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-gray-400 h-full transition-all"
                      style={{ width: `${type.total > 0 ? (type.neutral / type.total) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-red-500 h-full transition-all"
                      style={{ width: `${type.total > 0 ? (type.negative / type.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Por tipo de remetente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Por Tipo de Remetente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.bySender.filter(s => s.total > 0).map((sender) => (
                <div key={sender.type} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{sender.label}</span>
                    <span className="text-xs text-gray-500">
                      {sender.positivePercent}% positivo ({sender.total} msgs)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-green-500 h-full transition-all"
                      style={{ width: `${sender.total > 0 ? (sender.positive / sender.total) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-gray-400 h-full transition-all"
                      style={{ width: `${sender.total > 0 ? (sender.neutral / sender.total) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-red-500 h-full transition-all"
                      style={{ width: `${sender.total > 0 ? (sender.negative / sender.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
              {data.bySender.filter(s => s.total > 0).length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Sem dados suficientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
