'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Settings, 
  LayoutGrid, 
  Target, 
  Zap, 
  ChevronRight, 
  ArrowRight,
  Calendar,
  MessageSquare,
  Bell,
  Brain,
  TrendingUp,
  Award,
  Users,
  Clock
} from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { NotificationBanner } from '@/components/notifications/NotificationBanner'
import { GamificationWidget } from '@/components/gamification/GamificationWidget'
import { CustomizableDashboard } from '@/components/dashboard/CustomizableDashboard'
import { RoleBasedDashboard } from '@/components/dashboard/RoleBasedDashboard'
import { DashboardSettings } from '@/components/dashboard/DashboardSettings'
import AICollectorCard from '@/components/ai/AICollectorCard'
import SmartInsightsPanel from '@/components/ai/SmartInsightsPanel'
import GoalsTracker from '@/components/goals/GoalsTracker'
import NoticiasInternas from '@/components/valle-ui/NoticiasInternas'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { resolveEmployeeAreaKey, areaKeyToCompatArea } from '@/lib/employee/areaKey'
import type { AreaKey } from '@/lib/kanban/areaBoards'

gsap.registerPlugin(ScrollTrigger)

// Mapeamento de área para URL do painel dedicado
const AREA_PANEL_MAP: Record<string, { url: string; label: string; color: string; icon: any }> = {
  'comercial': { url: '/colaborador/comercial', label: 'Painel Comercial', color: 'from-[#1672d6] to-indigo-500', icon: Target },
  'social_media': { url: '/colaborador/social-media', label: 'Painel Social Media', color: 'from-pink-500 to-purple-500', icon: Sparkles },
  'social media': { url: '/colaborador/social-media', label: 'Painel Social Media', color: 'from-pink-500 to-purple-500', icon: Sparkles },
  'tráfego': { url: '/colaborador/trafego', label: 'Painel de Tráfego', color: 'from-emerald-500 to-green-500', icon: TrendingUp },
  'trafego': { url: '/colaborador/trafego', label: 'Painel de Tráfego', color: 'from-emerald-500 to-green-500', icon: TrendingUp },
  'tráfego pago': { url: '/colaborador/trafego', label: 'Painel de Tráfego', color: 'from-emerald-500 to-green-500', icon: TrendingUp },
  'web_designer': { url: '/colaborador/web-designer', label: 'Painel Web Designer', color: 'from-cyan-500 to-[#1672d6]', icon: LayoutGrid },
  'web designer': { url: '/colaborador/web-designer', label: 'Painel Web Designer', color: 'from-cyan-500 to-[#1672d6]', icon: LayoutGrid },
  'designer': { url: '/colaborador/designer', label: 'Painel Designer', color: 'from-amber-500 to-red-500', icon: Sparkles },
  'video_maker': { url: '/colaborador/video-maker', label: 'Painel Video Maker', color: 'from-purple-500 to-pink-500', icon: Zap },
  'video maker': { url: '/colaborador/video-maker', label: 'Painel Video Maker', color: 'from-purple-500 to-pink-500', icon: Zap },
  'head_marketing': { url: '/colaborador/head-marketing', label: 'Visão Geral Marketing', color: 'from-amber-500 to-amber-500', icon: Award },
  'head marketing': { url: '/colaborador/head-marketing', label: 'Visão Geral Marketing', color: 'from-amber-500 to-amber-500', icon: Award },
  'rh': { url: '/colaborador/rh', label: 'Painel RH', color: 'from-teal-500 to-cyan-500', icon: Users },
  'financeiro': { url: '/colaborador/financeiro/contas-receber', label: 'Painel Financeiro', color: 'from-emerald-500 to-green-500', icon: TrendingUp },
}

const quickActions = [
  { icon: LayoutGrid, label: "Kanban", href: "/colaborador/kanban", color: "#1672d6", description: "Gerencie suas demandas" },
  { icon: Calendar, label: "Agenda", href: "/colaborador/agenda", color: "#8b5cf6", description: "Reuniões e compromissos" },
  { icon: MessageSquare, label: "Mensagens", href: "/colaborador/mensagens", color: "#10b981", description: "Equipe e clientes" },
  { icon: Target, label: "Metas", href: "/colaborador/metas", color: "#f59e0b", description: "Acompanhe seu progresso" },
]

export default function ColaboradorDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userArea, setUserArea] = useState('')
  const [userAreaDisplay, setUserAreaDisplay] = useState('')
  const [userId, setUserId] = useState('')
  const [userAreaKey, setUserAreaKey] = useState<AreaKey | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'specific' | 'customizable'>('specific')
  const [showSettings, setShowSettings] = useState(false)

  // Refs para animações GSAP
  const headerRef = useRef<HTMLDivElement>(null)
  const aiPanelRef = useRef<HTMLDivElement>(null)
  const goalsRef = useRef<HTMLDivElement>(null)
  const dashboardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  // Animações GSAP após carregamento
  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline()
        
        // Animação do header
        tl.fromTo(
          headerRef.current,
          { y: -30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
        )
        // Animação do AI Panel
        .fromTo(
          aiPanelRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
          "-=0.3"
        )
        // Animação das metas
        .fromTo(
          goalsRef.current,
          { x: 30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
          "-=0.4"
        )
        // Animação do dashboard específico
        .fromTo(
          dashboardRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
          "-=0.2"
        )
      })

      return () => ctx.revert()
    }
  }, [loading])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return
      }

      setUserId(user.id);

      // Buscar dados do usuário
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single()

      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Área estável (areaKey) + compat para dashboards/IA
      const areaKey = resolveEmployeeAreaKey({
        department: employee?.department ?? null,
        area_of_expertise: employee?.area_of_expertise ?? null,
        areas: (employee as any)?.areas ?? null,
      });
      const area = areaKeyToCompatArea(areaKey);
      const rawArea = employee?.area_of_expertise || employee?.department || 'Colaborador';
      
      // Buscar nome completo do employee se profile não tiver
      const fullName = profile?.full_name || employee?.full_name || 'Colaborador';
      const firstName = fullName.split(' ')[0];

      setUserName(firstName)
      setUserArea(area)
      setUserAreaDisplay(rawArea)
      setUserAreaKey(areaKey)

      // Carregar notificações
      const notifs = loadNotifications(rawArea)
      setNotifications(notifs)

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNotifications = (area: string) => {
    const baseNotifications = [
      {
        type: 'meeting' as const,
        title: '📅 Reunião agendada em 2 horas',
        description: 'Cliente Tech Solutions - Análise de Performance Q4'
      }
    ]

    if (['Tráfego Pago', 'Tráfego', 'Gestor de Tráfego'].includes(area)) {
      return [
        ...baseNotifications,
        {
          type: 'refill' as const,
          title: '💰 Cliente precisa recarregar saldo',
          description: 'E-commerce Plus - Facebook Ads: Budget esgotado',
          actionLabel: 'Notificar'
        }
      ]
    }

    if (['Social Media', 'Social'].includes(area)) {
      return [
        ...baseNotifications,
        {
          type: 'approval' as const,
          title: '✅ 3 posts aguardando aprovação',
          description: 'Cliente Tech Solutions - Instagram Stories',
          actionLabel: 'Ver Posts'
        }
      ]
    }

    if (area === 'Comercial') {
      return [
        ...baseNotifications,
        {
          type: 'upsell' as const,
          title: '💡 Oportunidade de Upsell',
          description: 'Cliente E-commerce Plus não tem: Tráfego Pago, Automação',
          actionLabel: 'Ver Detalhes'
        }
      ]
    }

    return baseNotifications
  }

  const panelConfig = AREA_PANEL_MAP[String(userArea || '').toLowerCase()]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1672d6] mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <motion.div 
          ref={headerRef}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Olá, {userName}! 👋
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="border-[#1672d6]/30 text-[#1672d6] bg-[#1672d6]/5">
                {userAreaDisplay}
              </Badge>
            </div>
          </div>
          
          {/* Botões de Controle */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="border-border/60"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setViewMode(viewMode === 'specific' ? 'customizable' : 'specific')}
              className="bg-[#1672d6] hover:bg-[#1672d6]/90"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              {viewMode === 'specific' ? 'Personalizar' : 'Dashboard Padrão'}
            </Button>
          </div>
        </motion.div>

        {/* Painel Inteligente da Área - NO TOPO */}
        {panelConfig && (
          <Link href={panelConfig.url}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01, y: -2 }}
              className={cn(
                "relative overflow-hidden rounded-2xl p-6 cursor-pointer shadow-lg",
                `bg-gradient-to-r ${panelConfig.color}`
              )}
            >
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                    {panelConfig.icon && <panelConfig.icon className="w-7 h-7 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{panelConfig.label}</h2>
                    <p className="text-white/80 text-sm">
                      Acesse seu painel inteligente com IA, métricas e automações
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white font-medium">
                  Acessar
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          </Link>
        )}

        {/* Grid Principal: IA Cobrança + Metas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal: IA Cobrança */}
          <div className="lg:col-span-2 space-y-6" ref={aiPanelRef}>
            <AICollectorCard area={userArea} maxAlerts={4} />
            
            {/* Notificações */}
            {notifications.length > 0 && (
              <div className="space-y-3">
                {notifications.slice(0, 2).map((notif, index) => (
                  <NotificationBanner
                    key={index}
                    type={notif.type}
                    title={notif.title}
                    description={notif.description}
                    actionLabel={notif.actionLabel}
                    delay={index * 0.1}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Coluna Lateral: Metas + Gamificação */}
          <div className="lg:col-span-1 space-y-6" ref={goalsRef}>
            <GoalsTracker area={userArea} />
            <GamificationWidget />
          </div>
        </div>

        {/* Ações Rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#1672d6]" />
                Acesso Rápido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link key={index} href={action.href}>
                      <motion.div
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border/60 bg-card hover:border-[#1672d6]/40 hover:shadow-lg hover:shadow-[#1672d6]/5 transition-all cursor-pointer"
                      >
                        <div 
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: `${action.color}15` }}
                        >
                          <Icon className="w-6 h-6" style={{ color: action.color }} />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-medium text-foreground block">
                            {action.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {action.description}
                          </span>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Insights Inteligentes */}
        <SmartInsightsPanel area={userArea} maxInsights={4} />

        {/* Insights da IA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-[#1672d6]/20 bg-gradient-to-br from-[#1672d6]/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#001533] to-[#1672d6] shadow-lg shadow-[#1672d6]/20">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-foreground">
                      💡 Dicas da Val (IA)
                    </h3>
                    <Badge variant="outline" className="border-[#1672d6]/30 text-[#1672d6] text-xs">
                      Personalizado
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Baseado na sua performance e área de atuação:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/60 cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <Award className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Produtividade</p>
                        <p className="text-xs text-muted-foreground">+15% esta semana</p>
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/60 cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-[#1672d6]/10">
                        <Target className="w-4 h-4 text-[#1672d6]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Metas</p>
                        <p className="text-xs text-muted-foreground">78% concluído</p>
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/60 cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Tempo médio</p>
                        <p className="text-xs text-muted-foreground">2.5h por tarefa</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dashboards - Personalizável ou Específico da Área */}
        <div ref={dashboardRef}>
          {viewMode === 'customizable' && userId && (
            <CustomizableDashboard userId={userId} />
          )}

          {viewMode === 'specific' && (
            <RoleBasedDashboard role={userArea} />
          )}
        </div>

        {/* Notícias Internas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <NoticiasInternas showEventos={true} />
        </motion.div>

      </div>

      {/* Modal de Configurações do Dashboard */}
      <DashboardSettings
        userId={userId}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(settings) => {
          console.log('Configurações salvas:', settings)
        }}
      />
    </div>
  )
}
