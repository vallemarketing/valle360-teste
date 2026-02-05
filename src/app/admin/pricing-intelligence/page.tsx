'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, AlertTriangle, Target, BarChart3, Lightbulb } from 'lucide-react'

export default function PricingIntelligencePage() {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [marketData, setMarketData] = useState<any[]>([])
  const [profitability, setProfitability] = useState<any[]>([])
  const [abTests, setAbTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Recomendações de Preço
      const { data: recsData } = await supabase
        .from('pricing_recommendations')
        .select('*')
        .eq('status', 'pending')
        .order('priority_score', { ascending: false })
        .limit(10)

      // Alertas de Preço
      const { data: alertsData } = await supabase
        .from('pricing_alerts')
        .select('*')
        .eq('status', 'new')
        .order('urgency_score', { ascending: false })

      // Dados de Mercado
      const { data: marketDataResult } = await supabase
        .from('market_pricing_data')
        .select('*')
        .order('collected_at', { ascending: false })
        .limit(20)

      // Rentabilidade por Serviço
      const { data: profitData } = await supabase
        .from('service_profitability')
        .select('*')
        .order('profit_margin_percent', { ascending: false })

      // Testes A/B Ativos
      const { data: abTestsData } = await supabase
        .from('pricing_ab_tests')
        .select('*')
        .eq('test_status', 'running')

      setRecommendations(recsData || [])
      setAlerts(alertsData || [])
      setMarketData(marketDataResult || [])
      setProfitability(profitData || [])
      setAbTests(abTestsData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveRecommendation = async (id: string) => {
    await supabase
      .from('pricing_recommendations')
      .update({ status: 'approved' })
      .eq('id', id)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <DollarSign className="w-16 h-16 animate-pulse mx-auto mb-4 text-green-600" />
          <p className="text-lg">Carregando Pricing Intelligence...</p>
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
            <DollarSign className="w-8 h-8 text-green-600" />
            Pricing Intelligence
          </h1>
          <p className="text-gray-600 mt-1">
            IA para precificação inteligente e competitiva
          </p>
        </div>
        <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Simular Impacto
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recomendações IA</p>
                <p className="text-3xl font-bold">{recommendations.length}</p>
              </div>
              <Lightbulb className="w-10 h-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertas Ativos</p>
                <p className="text-3xl font-bold text-red-600">{alerts.length}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Margem Média</p>
                <p className="text-3xl font-bold text-blue-600">
                  {profitability.length > 0 
                    ? (profitability.reduce((acc, p) => acc + (p.profit_margin_percent || 0), 0) / profitability.length).toFixed(1)
                    : '0'
                  }%
                </p>
              </div>
              <BarChart3 className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Testes A/B Ativos</p>
                <p className="text-3xl font-bold text-purple-600">{abTests.length}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {alerts.length > 0 && (
        <Card className="border-red-500 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Preço Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="danger">URGENTE</Badge>
                        <span className="text-sm font-semibold">Score: {alert.urgency_score}/100</span>
                      </div>
                      <p className="font-semibold text-red-900">{alert.alert_title}</p>
                      <p className="text-sm text-red-800 mt-1">{alert.alert_description}</p>
                      {alert.recommended_action && (
                        <p className="text-sm text-red-900 mt-2">
                          <strong>Ação recomendada:</strong> {alert.recommended_action}
                        </p>
                      )}
                    </div>
                    <button className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                      Resolver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="market">Mercado</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilidade</TabsTrigger>
          <TabsTrigger value="abtests">Testes A/B</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Recomendações da IA */}
        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">
                        {rec.recommendation_type?.toUpperCase() || 'GERAL'}
                      </Badge>
                      <Badge variant="outline">
                        Prioridade: {rec.priority_score}/100
                      </Badge>
                      <Badge variant={
                        rec.risk_level === 'low' ? 'secondary' :
                        rec.risk_level === 'medium' ? 'default' : 'danger'
                      }>
                        Risco: {rec.risk_level}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{rec.title}</CardTitle>
                    <CardDescription className="mt-2">{rec.description}</CardDescription>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-3xl font-bold text-green-600">
                      +R$ {rec.estimated_roi?.toLocaleString('pt-BR') || '0'}
                    </p>
                    <p className="text-sm text-gray-500">ROI Estimado</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Detalhes da Recomendação */}
                <div className="space-y-4">
                  {rec.current_price && rec.recommended_price && (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Preço Atual</p>
                        <p className="text-2xl font-bold">
                          R$ {rec.current_price.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Preço Recomendado</p>
                        <p className="text-2xl font-bold text-blue-600">
                          R$ {rec.recommended_price.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Variação</p>
                        <p className={`text-2xl font-bold ${
                          rec.recommended_price > rec.current_price ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {rec.recommended_price > rec.current_price ? '+' : ''}
                          {(((rec.recommended_price - rec.current_price) / rec.current_price) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Justificativa */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      💡 Justificativa da IA:
                    </p>
                    <p className="text-sm text-blue-800">{rec.rationale}</p>
                  </div>

                  {/* Métricas Esperadas */}
                  {rec.expected_impact && (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Conversão</p>
                        <p className="text-lg font-bold text-green-600">
                          {rec.expected_impact.conversion || 'N/A'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Receita</p>
                        <p className="text-lg font-bold text-blue-600">
                          {rec.expected_impact.revenue || 'N/A'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Margem</p>
                        <p className="text-lg font-bold text-purple-600">
                          {rec.expected_impact.margin || 'N/A'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-gray-600">Competitividade</p>
                        <p className="text-lg font-bold text-yellow-600">
                          {rec.expected_impact.competitiveness || 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button 
                      onClick={() => approveRecommendation(rec.id)}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      ✅ Aprovar e Implementar
                    </button>
                    <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      📊 Simular Impacto
                    </button>
                    <button className="flex-1 px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                      ❌ Rejeitar
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {recommendations.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Nenhuma recomendação pendente</p>
                <p className="text-sm text-gray-500 mt-1">A IA está analisando os dados do mercado...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Dados de Mercado */}
        <TabsContent value="market" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketData.map((data) => (
              <Card key={data.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{data.service_name || 'Serviço'}</CardTitle>
                  <CardDescription>
                    Fonte: {data.source_name} | {new Date(data.collected_at).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Preço Observado</span>
                      <span className="text-lg font-bold">
                        R$ {data.observed_price?.toLocaleString('pt-BR') || '0'}
                      </span>
                    </div>
                    {data.competitor_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Concorrente</span>
                        <Badge>{data.competitor_name}</Badge>
                      </div>
                    )}
                    {data.market_average_price && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-gray-600">Média do Mercado</span>
                        <span className="text-lg font-bold text-blue-600">
                          R$ {data.market_average_price.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rentabilidade */}
        <TabsContent value="profitability" className="space-y-4">
          <div className="space-y-4">
            {profitability.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">
                        {service.service_name || `Serviço #${service.service_id}`}
                      </h3>
                      <div className="grid grid-cols-5 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Preço Médio</p>
                          <p className="text-lg font-semibold">
                            R$ {service.avg_price?.toLocaleString('pt-BR') || '0'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Custo Médio</p>
                          <p className="text-lg font-semibold">
                            R$ {service.avg_cost?.toLocaleString('pt-BR') || '0'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Lucro Médio</p>
                          <p className="text-lg font-semibold text-green-600">
                            R$ {service.avg_profit?.toLocaleString('pt-BR') || '0'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Margem</p>
                          <p className={`text-lg font-semibold ${
                            (service.profit_margin_percent || 0) > 40 ? 'text-green-600' :
                            (service.profit_margin_percent || 0) > 25 ? 'text-blue-600' :
                            'text-red-600'
                          }`}>
                            {service.profit_margin_percent?.toFixed(1) || '0'}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Vendas (mês)</p>
                          <p className="text-lg font-semibold">
                            {service.sales_volume || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      {(service.profit_margin_percent || 0) < 25 && (
                        <Badge variant="danger">Margem Baixa</Badge>
                      )}
                      {(service.profit_margin_percent || 0) >= 40 && (
                        <Badge className="bg-green-600">Excelente</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Testes A/B */}
        <TabsContent value="abtests" className="space-y-4">
          {abTests.map((test) => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{test.test_name}</CardTitle>
                    <CardDescription className="mt-1">
                      Iniciado em: {new Date(test.start_date).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <Badge className="bg-purple-600">RODANDO</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* Variante A */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-3">Variante A (Controle)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Preço:</span>
                        <span className="font-bold">R$ {test.variant_a_price?.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Conversões:</span>
                        <span className="font-bold">{test.variant_a_conversions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Taxa:</span>
                        <span className="font-bold text-blue-600">
                          {test.variant_a_conversion_rate?.toFixed(2) || '0'}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Variante B */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-3">Variante B (Teste)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Preço:</span>
                        <span className="font-bold">R$ {test.variant_b_price?.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Conversões:</span>
                        <span className="font-bold">{test.variant_b_conversions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Taxa:</span>
                        <span className="font-bold text-green-600">
                          {test.variant_b_conversion_rate?.toFixed(2) || '0'}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confiança Estatística */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Confiança Estatística:</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {test.statistical_confidence?.toFixed(1) || '0'}%
                    </span>
                  </div>
                  {(test.statistical_confidence || 0) >= 95 && (
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        ✅ Implementar Vencedor
                      </button>
                      <button className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                        🛑 Encerrar Teste
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {abTests.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Nenhum teste A/B ativo</p>
                <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                  Criar Novo Teste A/B
                </button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Histórico de alterações de preço</p>
              <p className="text-sm text-gray-500 mt-1">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

