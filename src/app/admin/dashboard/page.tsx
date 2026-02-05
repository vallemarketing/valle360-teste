'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  Briefcase, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Bell,
  Target,
  Brain,
  Award,
  Activity,
  BarChart3,
  Clock,
  Eye,
  MousePointerClick,
  Zap,
  ArrowRight,
  ChevronRight,
  Rocket,
  CheckCircle,
  AlertCircle,
  Settings,
  FileText,
  MessageSquare,
  X,
  Phone,
  Mail,
  Building,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import StatsCards from '@/components/valle-ui/StatsCards'
import OrbitalTimeline from '@/components/valle-ui/OrbitalTimeline'
import IntegrationsOrbit from '@/components/valle-ui/IntegrationsOrbit'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { trackEvent } from '@/lib/telemetry/client'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalClients: number
  activeClients: number
  totalEmployees: number
  activeEmployees: number
  monthlyRevenue: number
  pendingTasks: number
  completedTasksToday: number
  avgClientSatisfaction: number
}

interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  time: string
  icon: 'user' | 'task' | 'money' | 'alert'
  link?: string
}

interface ActiveClient {
  id: string
  name: string
  company: string
  email: string
  phone: string
  status: 'em_dia' | 'atrasado' | 'novo'
  projectStatus: string
  nextDelivery: string
  contractValue: string
  avatar?: string
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function AdminDashboard() {
  const quickActionsRef = useRef<HTMLDivElement | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    monthlyRevenue: 0,
    pendingTasks: 0,
    completedTasksToday: 0,
    avgClientSatisfaction: 0
  })

  const [selectedClient, setSelectedClient] = useState<ActiveClient | null>(null)
  const [showClientModal, setShowClientModal] = useState(false)

  const [activeClients, setActiveClients] = useState<ActiveClient[]>([])

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      return token ? { Authorization: `Bearer ${token}` } : {}
    } catch {
      return {}
    }
  }

  const [hubPendingLink, setHubPendingLink] = useState<string>('/admin/fluxos?tab=transitions&status=pending')

  const loadDashboardReal = async () => {
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/dashboard', { headers: authHeaders })
      const data = await res.json().catch(() => null)
      if (!res.ok) return

      if (data?.stats) setStats((prev) => ({ ...prev, ...data.stats }))
      if (Array.isArray(data?.recentActivity) && data.recentActivity.length > 0) setRecentActivity(data.recentActivity)
      if (Array.isArray(data?.activeClients) && data.activeClients.length > 0) setActiveClients(data.activeClients)
      if (data?.hub?.links?.pending) setHubPendingLink(String(data.hub.links.pending))
    } catch {
      // Sem mock: se falhar, ficamos com valores zerados e listas vazias.
    }
  }

  useEffect(() => {
    loadDashboardReal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClientClick = (client: ActiveClient) => {
    setSelectedClient(client)
    setShowClientModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_dia': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
      case 'atrasado': return 'bg-red-500/10 text-red-500 border-red-500/30'
      case 'novo': return 'bg-[#1672d6]/10 text-[#1672d6] border-[#1672d6]/30'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/30'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_dia': return 'Em dia'
      case 'atrasado': return 'Atrasado'
      case 'novo': return 'Novo'
      default: return status
    }
  }

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  const quickActions = [
    {
      title: 'Novo Cliente',
      description: 'Cadastrar novo cliente',
      icon: UserPlus,
      href: '/admin/clientes/novo',
      color: '#1672d6'
    },
    {
      title: 'Novo Colaborador',
      description: 'Adicionar colaborador',
      icon: Users,
      href: '/admin/colaboradores/novo',
      color: '#10b981'
    },
    {
      title: 'Relatórios',
      description: 'Ver todos os relatórios',
      href: '/admin/relatorios',
      icon: BarChart3,
      color: '#8b5cf6'
    },
    {
      title: 'Configurações',
      description: 'Gerenciar sistema',
      href: '/admin/configuracoes',
      icon: Settings,
      color: '#f59e0b'
    }
  ]

  const statsCards = [
    {
      title: 'Total de Clientes',
      value: stats.totalClients.toString(),
      change: { value: `+${stats.activeClients} ativos`, type: 'increase' as const },
      icon: <Briefcase className="w-5 h-5" />,
      description: 'Clientes cadastrados'
    },
    {
      title: 'Colaboradores',
      value: stats.totalEmployees.toString(),
      change: { value: `+${stats.activeEmployees} ativos`, type: 'increase' as const },
      icon: <Users className="w-5 h-5" />,
      description: 'Equipe completa'
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${(stats.monthlyRevenue / 1000).toFixed(0)}k`,
      change: { value: '+12% vs mês anterior', type: 'increase' as const },
      icon: <DollarSign className="w-5 h-5" />,
      description: 'Faturamento do mês'
    },
    {
      title: 'Tarefas Pendentes',
      value: stats.pendingTasks.toString(),
      change: { value: `${stats.completedTasksToday} concluídas hoje`, type: 'neutral' as const },
      icon: <Target className="w-5 h-5" />,
      description: 'Kanban + Fluxos + Eventos'
    }
  ]

  const pendingLink = hubPendingLink

  const getActivityIcon = (type: 'user' | 'task' | 'money' | 'alert') => {
    const icons = {
      user: Users,
      task: Target,
      money: DollarSign,
      alert: Bell
    }
    return icons[type]
  }

  const getActivityColor = (type: 'user' | 'task' | 'money' | 'alert') => {
    const colors = {
      user: 'bg-[#1672d6]/10 text-[#1672d6]',
      task: 'bg-emerald-500/10 text-emerald-500',
      money: 'bg-purple-500/10 text-purple-500',
      alert: 'bg-amber-500/10 text-amber-500'
    }
    return colors[type]
  }

  const handleScrollToQuickActions = () => {
    try {
      quickActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      toast.info('Abrindo ações rápidas…')
      trackEvent('admin_dashboard_quick_actions_click', { level: 'info' })
    } catch (e: any) {
      trackEvent('admin_dashboard_quick_actions_click_error', {
        level: 'error',
        message: e?.message,
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Dashboard Admin
              </h1>
              <p className="text-muted-foreground mt-1">
                Visão geral do sistema Valle 360
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-[#1672d6]/30 text-[#1672d6] bg-[#1672d6]/5">
                <Activity className="w-3 h-3 mr-1" />
                Sistema Online
              </Badge>
              <Link href={pendingLink}>
                <Button variant="outline" className="border-[#1672d6]/30 text-[#1672d6] hover:bg-[#1672d6]/5">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Pendências do Hub
                </Button>
              </Link>
              <Button onClick={handleScrollToQuickActions} className="bg-[#1672d6] hover:bg-[#1672d6]/90">
                <Zap className="w-4 h-4 mr-2" />
                Ações Rápidas
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Link href={pendingLink} className="block">
            <StatsCards stats={statsCards} columns={4} />
          </Link>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Ações Rápidas */}
          <motion.div
            ref={quickActionsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-border/60 h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#1672d6]" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <Link key={index} href={action.href}>
                        <motion.div
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                          whileTap={{ scale: 0.98 }}
                          className="p-4 rounded-xl border-2 border-border/60 cursor-pointer transition-all hover:border-[#1672d6]/40 hover:shadow-lg hover:shadow-[#1672d6]/5 bg-card"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="p-3 rounded-lg"
                              style={{ backgroundColor: `${action.color}15` }}
                            >
                              <Icon className="w-6 h-6" style={{ color: action.color }} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-1">
                                {action.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {action.description}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </motion.div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Atividades Recentes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/60 h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#1672d6]" />
                    Atividades Recentes
                  </span>
                  <Link href="/admin/auditoria">
                    <Button variant="ghost" size="sm" className="text-[#1672d6]">
                      Ver todas
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = getActivityIcon(activity.icon)
                    const Row = (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ x: 4 }}
                        className="flex items-start gap-3 pb-4 border-b border-border/60 last:border-b-0 last:pb-0 cursor-pointer"
                      >
                        <div className={`p-2 rounded-lg flex-shrink-0 ${getActivityColor(activity.icon)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground mb-1">
                            {activity.title}
                          </p>
                          <p className="text-xs text-muted-foreground mb-1 truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {activity.time}
                          </p>
                        </div>
                      </motion.div>
                    )

                    if (activity.link) {
                      return (
                        <Link key={activity.id} href={activity.link} className="block">
                          {Row}
                        </Link>
                      )
                    }

                    return Row
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Insights da IA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
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
                      💡 Insights da Val (IA)
                    </h3>
                    <Badge variant="outline" className="border-[#1672d6]/30 text-[#1672d6] text-xs">
                      Atualizado agora
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Baseado nos dados dos últimos 30 dias, identifiquei algumas oportunidades:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/60"
                    >
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <Award className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">3 clientes</p>
                        <p className="text-xs text-muted-foreground">prontos para upgrade</p>
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/60"
                    >
                      <div className="p-2 rounded-lg bg-[#1672d6]/10">
                        <TrendingUp className="w-4 h-4 text-[#1672d6]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">+18%</p>
                        <p className="text-xs text-muted-foreground">produtividade este mês</p>
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/60"
                    >
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Bell className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">2 colaboradores</p>
                        <p className="text-xs text-muted-foreground">precisam de atenção</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orbital Timeline - Projetos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card className="border-border/60 overflow-hidden">
            <OrbitalTimeline 
              title="Projetos Ativos"
              subtitle="Visualize o status de todos os projetos e suas conexões"
            />
          </Card>
        </motion.div>

        {/* Clientes Ativos - Clicáveis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#1672d6]" />
                  Clientes Ativos
                </CardTitle>
                <Link href="/admin/clientes">
                  <Button variant="ghost" size="sm" className="text-[#1672d6]">
                    Ver todos
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                Clique no nome do cliente para ver detalhes
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeClients.map((client) => (
                  <motion.button
                    key={client.id}
                    onClick={() => handleClientClick(client)}
                    whileHover={{ x: 4, backgroundColor: 'rgba(22, 114, 214, 0.05)' }}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card hover:border-[#1672d6]/40 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-[#1672d6]/20">
                        <AvatarFallback className="bg-[#1672d6]/10 text-[#1672d6] font-semibold">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-foreground">{client.projectStatus}</p>
                        <p className="text-xs text-muted-foreground">Próx. entrega: {client.nextDelivery}</p>
                      </div>
                      <Badge className={cn("border", getStatusColor(client.status))}>
                        {getStatusLabel(client.status)}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Integrações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-border/60 overflow-hidden">
            <IntegrationsOrbit 
              title="Central de Integrações"
              subtitle="Gerencie todas as conexões do ecossistema Valle 360"
            />
          </Card>
        </motion.div>
      </div>

      {/* Modal de Detalhes do Cliente */}
      <AnimatePresence>
        {showClientModal && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowClientModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-lg shadow-2xl border border-border/60"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/60">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-[#1672d6]/30">
                      <AvatarFallback className="bg-[#1672d6] text-white text-lg font-bold">
                        {selectedClient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedClient.name}</h2>
                      <p className="text-muted-foreground">{selectedClient.company}</p>
                      <Badge className={cn("mt-2 border", getStatusColor(selectedClient.status))}>
                        {getStatusLabel(selectedClient.status)}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowClientModal(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Contato */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="w-4 h-4 text-[#1672d6]" />
                    <div>
                      <p className="text-xs text-muted-foreground">E-mail</p>
                      <p className="text-sm font-medium">{selectedClient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="w-4 h-4 text-[#1672d6]" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="text-sm font-medium">{selectedClient.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Projeto */}
                <div className="p-4 rounded-xl border border-border/60 bg-card">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#1672d6]" />
                    Status do Projeto
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className="text-sm font-medium">{selectedClient.projectStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Próxima Entrega</span>
                      <span className="text-sm font-medium">{selectedClient.nextDelivery}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor Contratado</span>
                      <span className="text-sm font-bold text-[#1672d6]">{selectedClient.contractValue}</span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3">
                  <Link href={`/admin/clientes?id=${selectedClient.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Perfil Completo
                    </Button>
                  </Link>
                  <Button className="flex-1 bg-[#1672d6] hover:bg-[#1672d6]/90">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enviar Mensagem
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
