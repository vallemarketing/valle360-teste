'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, Users, Target, Lightbulb, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function MachineLearningPage() {
  const [patterns, setPatterns] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [behaviorPatterns, setBehaviorPatterns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [runningJobs, setRunningJobs] = useState(false)
  const [markingPredictionId, setMarkingPredictionId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Padrões de Marketing
      const { data: patternsData } = await supabase
        .from('ml_marketing_patterns')
        .select('*')
        .order('success_rate', { ascending: false })
        .limit(10)

      // Predições
      const { data: predictionsData } = await supabase
        .from('ml_predictions_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // Insights do Super Admin
      const { data: insightsData } = await supabase
        .from('super_admin_insights')
        .select('*')
        .eq('status', 'new')
        .order('insight_priority', { ascending: false })
        .limit(10)

      // Padrões de Comportamento de Clientes
      const { data: behaviorData } = await supabase
        .from('ml_client_behavior_patterns')
        .select('*')
        .order('churn_risk_score', { ascending: false })
        .limit(10)

      setPatterns(patternsData || [])
      const mappedPredictions = (predictionsData || []).map((p: any) => {
        const pv = p?.predicted_value;
        const value = pv && typeof pv === 'object' ? (pv.value ?? pv) : pv;
        return {
          id: p.id,
          prediction_type: p.prediction_type,
          target_entity: (pv && typeof pv === 'object' ? pv.entity_name : null) || p.prediction_target || '—',
          confidence_score: Number(p.predicted_probability || 0),
          predicted_value:
            typeof value === 'number'
              ? value
              : typeof value === 'string'
                ? value
                : JSON.stringify(value ?? '—'),
          created_at: p.predicted_at || p.created_at,
        };
      });

      setPredictions(mappedPredictions || [])
      setInsights(insightsData || [])
      setBehaviorPatterns(behaviorData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const runNow = async () => {
    setRunningJobs(true)
    try {
      const res = await fetch('/api/cron/ml', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Falha ao executar jobs')
      toast.success('Jobs de ML executados. Atualizando painel…')
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao executar jobs')
    } finally {
      setRunningJobs(false)
    }
  }

  const markPrediction = async (predictionId: string, wasCorrect: boolean) => {
    setMarkingPredictionId(predictionId)
    try {
      const res = await fetch('/api/admin/ml/predictions/outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predictionId, wasCorrect }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao registrar feedback')
      toast.success('Feedback registrado.')
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao registrar feedback')
    } finally {
      setMarkingPredictionId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Brain className="w-16 h-16 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-lg">Carregando Machine Learning...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            Machine Learning & IA
          </h1>
          <p className="text-gray-600 mt-1">
            Padrões aprendidos, predições e insights automáticos
          </p>
        </div>
        <button
          onClick={runNow}
          disabled={runningJobs}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {runningJobs ? 'Executando…' : 'Executar jobs agora'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Padrões Detectados</p>
                <p className="text-3xl font-bold">{patterns.length}</p>
              </div>
              <Target className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Predições Ativas</p>
                <p className="text-3xl font-bold">{predictions.length}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Insights Novos</p>
                <p className="text-3xl font-bold">{insights.length}</p>
              </div>
              <Lightbulb className="w-10 h-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes em Risco</p>
                <p className="text-3xl font-bold text-red-600">
                  {behaviorPatterns.filter(b => b.churn_risk_score > 70).length}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Insights Executivos</TabsTrigger>
          <TabsTrigger value="patterns">Padrões de Marketing</TabsTrigger>
          <TabsTrigger value="behavior">Comportamento Clientes</TabsTrigger>
          <TabsTrigger value="predictions">Predições</TabsTrigger>
        </TabsList>

        {/* Insights Executivos */}
        <TabsContent value="insights" className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={
                        insight.insight_priority === 'critical' ? 'danger' :
                        insight.insight_priority === 'high' ? 'default' : 'secondary'
                      }>
                        {insight.insight_priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {insight.insight_category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{insight.insight_title}</CardTitle>
                    <CardDescription className="mt-2">
                      {insight.insight_description}
                    </CardDescription>
                  </div>
                  {insight.potential_impact_revenue && (
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-green-600">
                        +R$ {insight.potential_impact_revenue.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-500">Impacto Estimado</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Confiança da IA</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${insight.confidence_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{insight.confidence_score}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Visualizar Detalhes
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                      Aprovar Ação
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {insights.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Nenhum insight novo no momento</p>
                <p className="text-sm text-gray-500 mt-1">A IA está analisando seus dados...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Padrões de Marketing */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map((pattern) => (
              <Card key={pattern.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className="mb-2">{pattern.pattern_type}</Badge>
                      <CardTitle className="text-lg">{pattern.pattern_name}</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {pattern.success_rate}%
                      </p>
                      <p className="text-xs text-gray-500">Taxa de Sucesso</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{pattern.pattern_description}</p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900">💡 Recomendação:</p>
                    <p className="text-sm text-blue-800 mt-1">{pattern.recommendation}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Engajamento médio:</span>
                      <span className="font-semibold">{pattern.avg_engagement_rate}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Confiança:</span>
                      <span className="font-semibold text-blue-600">{pattern.confidence_score}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Comportamento de Clientes */}
        <TabsContent value="behavior" className="space-y-4">
          <div className="space-y-4">
            {behaviorPatterns.map((behavior) => (
              <Card key={behavior.id} className={
                behavior.churn_risk_score > 70 ? 'border-red-500 border-2' : ''
              }>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cliente #{behavior.client_id}</CardTitle>
                      <CardDescription className="mt-1">
                        Análise de comportamento e risco de churn
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${
                        behavior.churn_risk_score > 70 ? 'text-red-600' :
                        behavior.churn_risk_score > 40 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {behavior.churn_risk_score}%
                      </p>
                      <p className="text-sm text-gray-500">Risco de Churn</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Prob. Renovação</p>
                      <p className="text-lg font-semibold text-green-600">
                        {behavior.renewal_probability}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Prob. Upsell</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {behavior.upsell_probability}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Valor Previsto</p>
                      <p className="text-lg font-semibold">
                        R$ {behavior.predicted_ltv?.toLocaleString('pt-BR') || '0'}
                      </p>
                    </div>
                  </div>
                  {behavior.churn_risk_score > 70 && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <p className="text-sm font-semibold text-red-900">⚠️ Ação Urgente Necessária</p>
                      <p className="text-sm text-red-800 mt-1">
                        Este cliente está em alto risco de cancelamento. Recomendamos contato imediato.
                      </p>
                      <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                        Criar Plano de Retenção
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predições */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <Card key={prediction.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className="mb-2">{prediction.prediction_type}</Badge>
                      <CardTitle className="text-lg">
                        Predição para {prediction.target_entity}
                      </CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Confiança</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {prediction.confidence_score}%
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-sm font-semibold">Valor Previsto:</p>
                    <p className="text-lg font-bold text-blue-900 mt-1">
                      {prediction.predicted_value}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Criado em: {new Date(prediction.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      onClick={() => markPrediction(String(prediction.id), true)}
                      disabled={markingPredictionId === String(prediction.id)}
                      title="Marcar como correta"
                    >
                      Correta
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                      onClick={() => markPrediction(String(prediction.id), false)}
                      disabled={markingPredictionId === String(prediction.id)}
                      title="Marcar como incorreta"
                    >
                      Incorreta
                    </button>
                    {markingPredictionId === String(prediction.id) && (
                      <span className="text-sm text-gray-500">Salvando…</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

