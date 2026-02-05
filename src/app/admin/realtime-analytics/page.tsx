'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Users, TrendingUp, AlertCircle, Zap, Eye, Clock } from 'lucide-react'

export default function RealtimeAnalyticsPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [traffic, setTraffic] = useState<any[]>([])
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    
    // Real-time subscription
    const channel = supabase
      .channel('realtime-analytics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'realtime_metrics'
      }, () => {
        loadData()
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'realtime_alerts'
      }, (payload) => {
        setAlerts(prev => [payload.new, ...prev])
      })
      .subscribe()

    // Refresh a cada 5 segundos
    const interval = setInterval(() => {
      loadData()
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const loadData = async () => {
    try {
      // Métricas em tempo real
      const { data: metricsData } = await supabase
        .from('realtime_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()

      // Sessões ativas
      const { data: sessionsData } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('is_active', true)

      // Alertas
      const { data: alertsData } = await supabase
        .from('realtime_alerts')
        .select('*')
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(10)

      // Tráfego por minuto (últimos 15 min)
      const { data: trafficData } = await supabase
        .from('realtime_traffic')
        .select('*')
        .gte('minute_timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .order('minute_timestamp', { ascending: true })

      // Anomalias detectadas
      const { data: anomaliesData } = await supabase
        .from('anomaly_detections')
        .select('*')
        .eq('status', 'new')
        .order('detected_at', { ascending: false })

      setMetrics(metricsData)
      setActiveSessions(sessionsData || [])
      setAlerts(alertsData || [])
      setTraffic(trafficData || [])
      setAnomalies(anomaliesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="w-16 h-16 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-lg">Carregando Analytics em Tempo Real...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com indicador LIVE */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Analytics em Tempo Real
            <span className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-red-600">AO VIVO</span>
            </span>
          </h1>
          <p className="text-gray-600 mt-1">
            Monitoramento 24/7 com atualizações a cada 5 segundos
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <Clock className="w-4 h-4 inline mr-1" />
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
                <p className="text-4xl font-bold text-blue-600">
                  {metrics?.active_users || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +{metrics?.active_users_change || 0} últimos 5min
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Páginas/min</p>
                <p className="text-4xl font-bold text-green-600">
                  {metrics?.page_views_per_minute || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +{metrics?.page_views_change || 0}%
                </p>
              </div>
              <Eye className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversões Hoje</p>
                <p className="text-4xl font-bold text-purple-600">
                  {metrics?.conversions_today || 0}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Taxa: {metrics?.conversion_rate?.toFixed(2) || '0'}%
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-100 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Hoje</p>
                <p className="text-3xl font-bold text-yellow-600">
                  R$ {(metrics?.revenue_today || 0).toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +{metrics?.revenue_change || 0}% vs ontem
                </p>
              </div>
              <Zap className="w-12 h-12 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertas Ativos</p>
                <p className="text-4xl font-bold text-red-600">
                  {alerts.length}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {alerts.filter(a => a.alert_severity === 'critical').length} críticos
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {alerts.filter(a => a.alert_severity === 'critical').length > 0 && (
        <Card className="border-red-500 border-2 animate-pulse">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              🚨 Alertas Críticos em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {alerts
                .filter(a => a.alert_severity === 'critical')
                .map((alert) => (
                  <div key={alert.id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-red-900">{alert.alert_title}</p>
                        <p className="text-sm text-red-800 mt-1">{alert.alert_message}</p>
                        {alert.recommended_action && (
                          <p className="text-sm text-red-700 mt-2">
                            <strong>Ação recomendada:</strong> {alert.recommended_action}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mt-2">
                          {new Date(alert.created_at).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                      <button className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm whitespace-nowrap">
                        Resolver
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomalias Detectadas */}
      {anomalies.length > 0 && (
        <Card className="border-primary border-2">
          <CardHeader className="bg-amber-50">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Zap className="w-5 h-5" />
              Anomalias Detectadas pela IA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anomalies.map((anomaly) => (
                <div key={anomaly.id} className="bg-amber-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={
                      anomaly.anomaly_type === 'spike' ? 'default' : 'danger'
                    }>
                      {anomaly.anomaly_type}
                    </Badge>
                    <span className="text-sm font-semibold">{anomaly.metric_name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Valor Esperado</p>
                      <p className="font-bold">{anomaly.expected_value?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Valor Atual</p>
                      <p className="font-bold text-primary">{anomaly.actual_value?.toFixed(2)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600">Desvio</p>
                      <p className="font-bold text-red-600">{anomaly.deviation_percentage?.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Tráfego (últimos 15 minutos) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tráfego em Tempo Real (Últimos 15 Minutos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-1">
            {traffic.map((point, idx) => {
              const maxViews = Math.max(...traffic.map(t => t.page_views || 0))
              const height = ((point.page_views || 0) / maxViews) * 100
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer relative group"
                    style={{ height: `${height}%` }}
                    title={`${point.page_views} views`}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {point.page_views} views
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(point.minute_timestamp).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sessões Ativas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sessões Ativas Agora ({activeSessions.length})
            </CardTitle>
            <Badge className="bg-green-600">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              ONLINE
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activeSessions.slice(0, 10).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {session.user_type?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {session.user_type} #{session.user_id}
                    </p>
                    <p className="text-sm text-gray-600">
                      {session.current_page || 'Página inicial'}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-600">Tempo na página</p>
                  <p className="font-semibold">{session.duration_seconds ? `${Math.floor(session.duration_seconds / 60)}m ${session.duration_seconds % 60}s` : 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Outras Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dispositivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Desktop</span>
                <span className="font-bold">{metrics?.desktop_users || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Mobile</span>
                <span className="font-bold">{metrics?.mobile_users || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tablet</span>
                <span className="font-bold">{metrics?.tablet_users || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fontes de Tráfego</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Direto</span>
                <span className="font-bold text-blue-600">{metrics?.direct_traffic || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Orgânico</span>
                <span className="font-bold text-green-600">{metrics?.organic_traffic || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Social</span>
                <span className="font-bold text-purple-600">{metrics?.social_traffic || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pago</span>
                <span className="font-bold text-primary">{metrics?.paid_traffic || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Tempo Médio Sessão</p>
                <p className="text-2xl font-bold">{metrics?.avg_session_duration || '0'}s</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Rejeição</p>
                <p className="text-2xl font-bold text-red-600">{metrics?.bounce_rate || '0'}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Páginas por Sessão</p>
                <p className="text-2xl font-bold">{metrics?.pages_per_session?.toFixed(1) || '0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

