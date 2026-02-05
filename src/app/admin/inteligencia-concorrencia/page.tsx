'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Eye, TrendingUp, AlertCircle, Instagram, Globe, BarChart3, Shield } from 'lucide-react'

export default function CompetitiveIntelligencePage() {
  const [competitors, setCompetitors] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [battleCards, setBattleCards] = useState<any[]>([])
  const [sentiment, setSentiment] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Concorrentes
      const { data: competitorsData } = await supabase
        .from('competitors')
        .select(`
          *,
          competitor_social_profiles(*),
          competitor_metrics(*)
        `)
        .order('threat_level', { ascending: false })

      // Alertas
      const { data: alertsData } = await supabase
        .from('competitor_alerts')
        .select('*, competitors(*)')
        .eq('status', 'new')
        .order('severity', { ascending: false })
        .limit(10)

      // Battle Cards
      const { data: battleCardsData } = await supabase
        .from('competitor_battle_cards')
        .select('*, competitors(*)')
        .eq('is_active', true)

      // Análise de Sentimento
      const { data: sentimentData } = await supabase
        .from('competitor_sentiment_analysis')
        .select('*, competitors(*)')
        .order('analyzed_at', { ascending: false })
        .limit(10)

      setCompetitors(competitorsData || [])
      setAlerts(alertsData || [])
      setBattleCards(battleCardsData || [])
      setSentiment(sentimentData || [])
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
          <Eye className="w-16 h-16 animate-pulse mx-auto mb-4 text-purple-600" />
          <p className="text-lg">Carregando Inteligência Competitiva...</p>
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
            <Eye className="w-8 h-8 text-purple-600" />
            Inteligência de Concorrência
          </h1>
          <p className="text-gray-600 mt-1">
            Monitore, analise e supere seus concorrentes
          </p>
        </div>
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Adicionar Concorrente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Concorrentes Ativos</p>
                <p className="text-3xl font-bold">{competitors.length}</p>
              </div>
              <Eye className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertas Novos</p>
                <p className="text-3xl font-bold text-red-600">{alerts.length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Battle Cards</p>
                <p className="text-3xl font-bold">{battleCards.length}</p>
              </div>
              <Shield className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alta Ameaça</p>
                <p className="text-3xl font-bold text-primary">
                  {competitors.filter(c => c.threat_level === 'high').length}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {alerts.length > 0 && (
        <Card className="border-red-500 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Alertas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="danger">{alert.severity}</Badge>
                        <span className="text-sm font-semibold">{alert.competitors?.company_name}</span>
                      </div>
                      <p className="font-semibold text-red-900">{alert.alert_title}</p>
                      <p className="text-sm text-red-800 mt-1">{alert.alert_description}</p>
                    </div>
                    <button className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                      Analisar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="competitors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="competitors">Concorrentes</TabsTrigger>
          <TabsTrigger value="battlecards">Battle Cards</TabsTrigger>
          <TabsTrigger value="sentiment">Sentimento</TabsTrigger>
          <TabsTrigger value="social">Redes Sociais</TabsTrigger>
        </TabsList>

        {/* Concorrentes */}
        <TabsContent value="competitors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competitors.map((competitor) => (
              <Card key={competitor.id} className={
                competitor.threat_level === 'high' ? 'border-red-300 border-2' : ''
              }>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          competitor.threat_level === 'high' ? 'danger' :
                          competitor.threat_level === 'medium' ? 'default' : 'secondary'
                        }>
                          {competitor.threat_level}
                        </Badge>
                        <Badge variant="outline">{competitor.competitor_tier}</Badge>
                        <Badge variant="outline">{competitor.market_position}</Badge>
                      </div>
                      <CardTitle className="text-xl">{competitor.company_name}</CardTitle>
                      <CardDescription className="mt-1">
                        {competitor.trading_name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {competitor.website_url && (
                      <a 
                        href={competitor.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                      >
                        <Globe className="w-4 h-4" />
                        {competitor.website_url}
                      </a>
                    )}
                    {competitor.instagram_handle && (
                      <a 
                        href={`https://instagram.com/${competitor.instagram_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-pink-600 hover:underline text-sm"
                      >
                        <Instagram className="w-4 h-4" />
                        {competitor.instagram_handle}
                      </a>
                    )}
                    
                    {/* Métricas */}
                    {competitor.competitor_metrics && competitor.competitor_metrics[0] && (
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
                        <div>
                          <p className="text-xs text-gray-600">Seguidores</p>
                          <p className="font-semibold">
                            {competitor.competitor_metrics[0].social_media_followers?.toLocaleString('pt-BR') || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Engajamento</p>
                          <p className="font-semibold">
                            {competitor.competitor_metrics[0].avg_engagement_rate || 'N/A'}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Clientes Est.</p>
                          <p className="font-semibold">
                            {competitor.competitor_metrics[0].estimated_clients || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">
                        Ver Detalhes
                      </button>
                      <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                        Comparar
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Battle Cards */}
        <TabsContent value="battlecards" className="space-y-4">
          {battleCards.map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      {card.competitors?.company_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Battle Card: Como vencer este concorrente
                    </CardDescription>
                  </div>
                  <Badge>Última atualização: {new Date(card.last_updated).toLocaleDateString('pt-BR')}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pontos Fortes */}
                  <div>
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      ✅ Nossas Vantagens
                    </h4>
                    <ul className="space-y-2">
                      {card.our_strengths?.map((strength: string, idx: number) => (
                        <li key={idx} className="text-sm bg-green-50 p-2 rounded">
                          • {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pontos Fracos Deles */}
                  <div>
                    <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                      ❌ Fraquezas Deles
                    </h4>
                    <ul className="space-y-2">
                      {card.their_weaknesses?.map((weakness: string, idx: number) => (
                        <li key={idx} className="text-sm bg-red-50 p-2 rounded">
                          • {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Estratégia de Vitória */}
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      🎯 Estratégia de Vitória
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-900">{card.win_strategy}</p>
                    </div>
                  </div>

                  {/* Diferenciação de Preço */}
                  {card.pricing_differentiators && (
                    <div className="md:col-span-2">
                      <h4 className="font-semibold text-purple-900 mb-3">
                        💰 Diferenciação de Preço
                      </h4>
                      <p className="text-sm bg-purple-50 p-3 rounded">
                        {card.pricing_differentiators}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {battleCards.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Nenhum Battle Card criado ainda</p>
                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Criar Primeiro Battle Card
                </button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Análise de Sentimento */}
        <TabsContent value="sentiment" className="space-y-4">
          <div className="space-y-4">
            {sentiment.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{item.competitors?.company_name}</CardTitle>
                      <CardDescription>
                        Análise em: {new Date(item.analyzed_at).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${
                        item.overall_sentiment_score > 7 ? 'text-green-600' :
                        item.overall_sentiment_score > 4 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {item.overall_sentiment_score}/10
                      </p>
                      <p className="text-sm text-gray-500">Score Geral</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{item.positive_mentions}</p>
                      <p className="text-sm text-gray-600 mt-1">Menções Positivas</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{item.neutral_mentions}</p>
                      <p className="text-sm text-gray-600 mt-1">Menções Neutras</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{item.negative_mentions}</p>
                      <p className="text-sm text-gray-600 mt-1">Menções Negativas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Redes Sociais */}
        <TabsContent value="social" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competitors.map((competitor) => (
              competitor.competitor_social_profiles?.map((profile: any) => (
                <Card key={profile.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Instagram className="w-5 h-5 text-pink-600" />
                          {competitor.company_name}
                        </CardTitle>
                        <CardDescription>{profile.platform}</CardDescription>
                      </div>
                      <Badge>{profile.profile_handle}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Seguidores</p>
                        <p className="text-2xl font-bold">{profile.followers_count?.toLocaleString('pt-BR') || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Seguindo</p>
                        <p className="text-2xl font-bold">{profile.following_count?.toLocaleString('pt-BR') || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Posts</p>
                        <p className="text-2xl font-bold">{profile.posts_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Engajamento</p>
                        <p className="text-2xl font-bold text-blue-600">{profile.avg_engagement_rate || 0}%</p>
                      </div>
                    </div>
                    <button className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                      Ver Conteúdo Recente
                    </button>
                  </CardContent>
                </Card>
              ))
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

