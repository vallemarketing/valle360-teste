'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, Video, Users, Clock, Mic, Trophy, 
  Gift, Target, Play, Award, DollarSign, TrendingUp 
} from 'lucide-react'

export default function AdvancedToolsPage() {
  const [roiSimulations, setRoiSimulations] = useState<any[]>([])
  const [videoProposals, setVideoProposals] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [urgencyTactics, setUrgencyTactics] = useState<any[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [gamification, setGamification] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // ROI Simulator State
  const [roiInputs, setRoiInputs] = useState({
    current_revenue: 50000,
    marketing_budget: 5000,
    target_leads: 100,
    time_horizon: 6
  })
  const [roiResults, setRoiResults] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // ROI Simulations
      const { data: roiData } = await supabase
        .from('roi_simulations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // Video Proposals
      const { data: videosData } = await supabase
        .from('personalized_video_proposals')
        .select('*')
        .order('created_at', { ascending: false })

      // Partners
      const { data: partnersData } = await supabase
        .from('partners')
        .select('*')
        .eq('status', 'active')

      // Urgency Tactics
      const { data: urgencyData } = await supabase
        .from('urgency_tactics')
        .select('*')
        .eq('is_active', true)

      // Recorded Meetings
      const { data: meetingsData } = await supabase
        .from('recorded_meetings')
        .select(`
          *,
          meeting_ai_insights(*)
        `)
        .order('meeting_date', { ascending: false })
        .limit(10)

      // Client Gamification
      const { data: gamData } = await supabase
        .from('client_reward_programs')
        .select(`
          *,
          client_reward_catalog(*)
        `)

      setRoiSimulations(roiData || [])
      setVideoProposals(videosData || [])
      setPartners(partnersData || [])
      setUrgencyTactics(urgencyData || [])
      setMeetings(meetingsData || [])
      setGamification(gamData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateROI = async () => {
    try {
      // Buscar config baseada na indústria
      const { data: config } = await supabase
        .from('roi_simulator_configs')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (config) {
        const projected_leads = roiInputs.target_leads * roiInputs.time_horizon
        const projected_conversions = Math.round(projected_leads * (config.avg_conversion_rate / 100))
        const projected_revenue = projected_conversions * config.avg_lead_value
        const investment = roiInputs.marketing_budget * roiInputs.time_horizon
        const roi = ((projected_revenue - investment) / investment) * 100

        const results = {
          projected_leads,
          projected_conversions,
          projected_revenue,
          investment,
          roi,
          payback_months: Math.round(investment / (projected_revenue / roiInputs.time_horizon))
        }

        setRoiResults(results)

        // Salvar simulação
        await supabase.from('roi_simulations').insert({
          current_revenue: roiInputs.current_revenue,
          projected_revenue,
          investment_amount: investment,
          roi_percentage: roi,
          time_horizon_months: roiInputs.time_horizon,
          simulation_parameters: roiInputs
        })

        loadData()
      }
    } catch (error) {
      console.error('Erro ao calcular ROI:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Target className="w-16 h-16 animate-pulse mx-auto mb-4 text-purple-600" />
          <p className="text-lg">Carregando Ferramentas Avançadas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Target className="w-8 h-8 text-purple-600" />
          Ferramentas Avançadas
        </h1>
        <p className="text-gray-600 mt-1">
          ROI, Vídeos, Parceiros, Urgência, Reuniões & Gamificação
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roi" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="roi">
            <Calculator className="w-4 h-4 mr-2" />
            ROI
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Video className="w-4 h-4 mr-2" />
            Vídeos
          </TabsTrigger>
          <TabsTrigger value="partners">
            <Users className="w-4 h-4 mr-2" />
            Parceiros
          </TabsTrigger>
          <TabsTrigger value="urgency">
            <Clock className="w-4 h-4 mr-2" />
            Urgência
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Mic className="w-4 h-4 mr-2" />
            Reuniões
          </TabsTrigger>
          <TabsTrigger value="gamification">
            <Trophy className="w-4 h-4 mr-2" />
            Gamificação
          </TabsTrigger>
        </TabsList>

        {/* ROI Simulator */}
        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Calculadora de ROI
              </CardTitle>
              <CardDescription>
                Simule o retorno sobre investimento de suas campanhas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Faturamento Atual (mensal)</label>
                  <input
                    type="number"
                    value={roiInputs.current_revenue}
                    onChange={(e) => setRoiInputs({...roiInputs, current_revenue: Number(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Orçamento Marketing (mensal)</label>
                  <input
                    type="number"
                    value={roiInputs.marketing_budget}
                    onChange={(e) => setRoiInputs({...roiInputs, marketing_budget: Number(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Meta de Leads (mensal)</label>
                  <input
                    type="number"
                    value={roiInputs.target_leads}
                    onChange={(e) => setRoiInputs({...roiInputs, target_leads: Number(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Período (meses)</label>
                  <input
                    type="number"
                    value={roiInputs.time_horizon}
                    onChange={(e) => setRoiInputs({...roiInputs, time_horizon: Number(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="6"
                  />
                </div>
              </div>

              <button
                onClick={calculateROI}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold mb-6"
              >
                💡 Calcular ROI
              </button>

              {roiResults && (
                <div className="grid grid-cols-4 gap-4 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Leads Projetados</p>
                    <p className="text-3xl font-bold text-blue-600">{roiResults.projected_leads}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Conversões</p>
                    <p className="text-3xl font-bold text-purple-600">{roiResults.projected_conversions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Receita Projetada</p>
                    <p className="text-3xl font-bold text-green-600">
                      R$ {roiResults.projected_revenue.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">ROI</p>
                    <p className="text-3xl font-bold text-primary">{roiResults.roi.toFixed(0)}%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Simulações */}
          <Card>
            <CardHeader>
              <CardTitle>Simulações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roiSimulations.map((sim) => (
                  <div key={sim.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Investimento</p>
                        <p className="font-semibold">R$ {sim.investment_amount?.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Receita Proj.</p>
                        <p className="font-semibold">R$ {sim.projected_revenue?.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">ROI</p>
                        <p className="font-semibold text-green-600">{sim.roi_percentage?.toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Período</p>
                        <p className="font-semibold">{sim.time_horizon_months} meses</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Proposals */}
        <TabsContent value="videos" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">Crie vídeos personalizados para suas propostas</p>
            <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
              <Video className="w-5 h-5" />
              Criar Vídeo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoProposals.map((video) => (
              <Card key={video.id}>
                <CardContent className="p-6">
                  <div className="aspect-video bg-gray-900 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <Play className="w-16 h-16 text-white opacity-50" />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <Play className="w-16 h-16 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold mb-2">{video.recipient_name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{video.recipient_email}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={
                      video.status === 'delivered' ? 'default' :
                      video.status === 'viewed' ? 'secondary' : 'outline'
                    }>
                      {video.status}
                    </Badge>
                  </div>
                  {video.viewed_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Visualizado em: {new Date(video.viewed_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Partners Network */}
        <TabsContent value="partners" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">Gerencie sua rede de parceiros e co-vendas</p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Adicionar Parceiro
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {partners.map((partner) => (
              <Card key={partner.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{partner.partner_name}</CardTitle>
                    <Badge variant={
                      partner.partner_type === 'agency' ? 'default' :
                      partner.partner_type === 'freelancer' ? 'secondary' : 'outline'
                    }>
                      {partner.partner_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{partner.email}</p>
                  
                  {partner.specialties && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-2">Especialidades:</p>
                      <div className="flex flex-wrap gap-1">
                        {partner.specialties.map((spec: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">{spec}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm text-gray-600">Comissão</span>
                    <span className="text-lg font-bold text-green-600">
                      {partner.default_commission_percent}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Urgency Tactics */}
        <TabsContent value="urgency" className="space-y-4">
          <p className="text-gray-600 mb-4">
            Táticas de urgência para acelerar o fechamento de vendas
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgencyTactics.map((tactic) => (
              <Card key={tactic.id} className="border-l-4 border-l-amber-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tactic.tactic_name}</CardTitle>
                    <Badge variant={
                      tactic.urgency_level === 'high' ? 'danger' :
                      tactic.urgency_level === 'medium' ? 'default' : 'secondary'
                    }>
                      {tactic.urgency_level}
                    </Badge>
                  </div>
                  <CardDescription>{tactic.tactic_type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{tactic.description}</p>
                  
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-amber-900 mb-2">Mensagem Template:</p>
                    <p className="text-sm text-amber-800">{tactic.urgency_message_template}</p>
                  </div>

                  <button className="w-full mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-[#1260b5]">
                    Aplicar Tática
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recorded Meetings */}
        <TabsContent value="meetings" className="space-y-4">
          <p className="text-gray-600 mb-4">
            IA analisa suas reuniões e extrai insights automaticamente
          </p>

          <div className="space-y-4">
            {meetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Mic className="w-5 h-5" />
                        Reunião: {meeting.meeting_title || 'Sem título'}
                      </CardTitle>
                      <CardDescription>
                        {new Date(meeting.meeting_date).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    <Badge>{meeting.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {meeting.meeting_ai_insights && meeting.meeting_ai_insights[0] && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-2">📝 Resumo da IA:</p>
                        <p className="text-sm text-blue-800">
                          {meeting.meeting_ai_insights[0].summary || 'Processando...'}
                        </p>
                      </div>

                      {meeting.meeting_ai_insights[0].key_topics && (
                        <div>
                          <p className="text-sm font-semibold mb-2">Tópicos Principais:</p>
                          <div className="flex flex-wrap gap-2">
                            {meeting.meeting_ai_insights[0].key_topics.map((topic: string, idx: number) => (
                              <Badge key={idx} variant="outline">{topic}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {meeting.meeting_ai_insights[0].action_items && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm font-semibold text-green-900 mb-2">✅ Próximos Passos:</p>
                          <ul className="space-y-1">
                            {meeting.meeting_ai_insights[0].action_items.map((item: string, idx: number) => (
                              <li key={idx} className="text-sm text-green-800">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Gamification */}
        <TabsContent value="gamification" className="space-y-4">
          <p className="text-gray-600 mb-4">
            Sistema de recompensas e gamificação para clientes
          </p>

          {gamification.map((program) => (
            <div key={program.id} className="space-y-4">
              <Card className="border-2 border-purple-500">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-purple-600" />
                    {program.program_name}
                  </CardTitle>
                  <CardDescription>{program.program_description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Gift className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm text-gray-600">Pontos por Indicação</p>
                      <p className="text-2xl font-bold text-blue-600">{program.points_per_referral}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Award className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-sm text-gray-600">Pontos por Feedback</p>
                      <p className="text-2xl font-bold text-green-600">{program.points_per_feedback}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Trophy className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className="mt-2 bg-purple-600">
                        {program.is_active ? 'ATIVO' : 'INATIVO'}
                      </Badge>
                    </div>
                  </div>

                  {/* Catálogo de Recompensas */}
                  {program.client_reward_catalog && (
                    <div>
                      <h4 className="font-semibold mb-3">🎁 Catálogo de Recompensas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {program.client_reward_catalog.map((reward: any) => (
                          <div key={reward.id} className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-semibold text-sm">{reward.reward_name}</h5>
                              <Badge className="bg-yellow-600">{reward.points_cost} pts</Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{reward.reward_description}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-600 font-semibold">
                                R$ {reward.reward_value?.toLocaleString('pt-BR')}
                              </span>
                              <Badge variant={reward.is_available ? 'default' : 'secondary'}>
                                {reward.is_available ? 'Disponível' : 'Esgotado'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

