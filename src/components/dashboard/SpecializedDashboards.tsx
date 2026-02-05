'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Sparkles, Clock, CheckCircle2, AlertCircle,
  Users, Target, Calendar, Bell, Star, RefreshCw, DollarSign,
  BarChart3, ArrowUpRight, ArrowDownRight, Send,
  Instagram, Facebook, Linkedin, Youtube, Megaphone, Video, Film,
  UserPlus, Briefcase, Heart,
  Building2, ShoppingCart, Receipt,
  Wallet, Banknote, CalendarDays, Gift, Cake,
  Gauge, Eye, TrendingDown, Folder, Globe
} from 'lucide-react';

// ==================== SOCIAL MEDIA DASHBOARD ====================
export const SocialMediaDashboard = ({ config }: { config: any }) => {
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  const stats = {
    postsThisWeek: 12,
    scheduledPosts: 8,
    engagement: '4.2%',
    reach: '45.2K',
    followers: '+1.2K'
  };

  const scheduledPosts = [
    { id: 1, platform: 'instagram', content: 'Carrossel: 5 dicas de marketing', time: '14:00', client: 'Tech Solutions', status: 'approved' },
    { id: 2, platform: 'facebook', content: 'Post institucional', time: '16:30', client: 'E-commerce Plus', status: 'pending' },
    { id: 3, platform: 'linkedin', content: 'Artigo: Tendências 2024', time: '10:00', client: 'Marketing Pro', status: 'approved' }
  ];

  const platformStats = [
    { platform: 'Instagram', icon: Instagram, followers: '12.5K', engagement: '5.2%', color: '#E4405F' },
    { platform: 'Facebook', icon: Facebook, followers: '8.3K', engagement: '3.1%', color: '#1877F2' },
    { platform: 'LinkedIn', icon: Linkedin, followers: '5.1K', engagement: '4.8%', color: '#0A66C2' },
    { platform: 'YouTube', icon: Youtube, followers: '2.8K', engagement: '6.5%', color: '#FF0000' }
  ];

  const valInsights = [
    { icon: '📈', title: 'Melhor Horário', message: 'Seus posts das 14h têm 40% mais engajamento!' },
    { icon: '🔥', title: 'Tendência', message: 'Reels estão gerando 3x mais alcance esta semana.' },
    { icon: '💡', title: 'Dica', message: 'O cliente Tech Solutions responde bem a conteúdo educativo.' },
    { icon: '⚠️', title: 'Atenção', message: '3 posts aguardando aprovação há mais de 24h.' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsightIndex((prev) => (prev + 1) % valInsights.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-4 h-4" style={{ color: '#E4405F' }} />;
      case 'facebook': return <Facebook className="w-4 h-4" style={{ color: '#1877F2' }} />;
      case 'linkedin': return <Linkedin className="w-4 h-4" style={{ color: '#0A66C2' }} />;
      case 'youtube': return <Youtube className="w-4 h-4" style={{ color: '#FF0000' }} />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl text-white shadow-lg relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #E4405F 0%, #833AB4 50%, #5851DB 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
              <Megaphone className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Painel Social Media</h2>
              <p className="text-white/80">Gerencie suas redes e acompanhe métricas</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur-md">
              <p className="text-xs text-white/70">Posts esta semana</p>
              <p className="text-xl font-bold">{stats.postsThisWeek}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Val Insights */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-xl"
        style={{ 
          background: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)',
          border: '1px solid #fbcfe8'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <span className="font-semibold text-sm text-gray-800">Insights da Val</span>
          </div>
          <div className="flex gap-1">
            {valInsights.map((_, idx) => (
              <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentInsightIndex ? 'w-4 bg-pink-500' : 'bg-pink-200'}`} />
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentInsightIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-start gap-3"
          >
            <span className="text-2xl">{valInsights[currentInsightIndex].icon}</span>
            <div>
              <p className="font-medium text-sm text-gray-800">{valInsights[currentInsightIndex].title}</p>
              <p className="text-sm text-gray-600">{valInsights[currentInsightIndex].message}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Posts Semana', value: stats.postsThisWeek, icon: Send, color: '#E4405F' },
          { label: 'Agendados', value: stats.scheduledPosts, icon: Calendar, color: '#833AB4' },
          { label: 'Engajamento', value: stats.engagement, icon: Heart, color: '#5851DB' },
          { label: 'Alcance', value: stats.reach, icon: Eye, color: '#1877F2' },
          { label: 'Novos Seguidores', value: stats.followers, icon: UserPlus, color: '#10b981' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="p-4 rounded-xl shadow-sm bg-white border border-gray-100"
          >
            <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts Agendados */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 p-6 rounded-xl shadow-sm bg-white border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2 text-gray-800">
              <Calendar className="w-5 h-5 text-purple-500" />
              Posts Agendados para Hoje
            </h3>
            <a href="/colaborador/social/calendario" className="text-sm font-medium text-blue-600">Ver calendário →</a>
          </div>
          <div className="space-y-3">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getPlatformIcon(post.platform)}
                    <div>
                      <p className="font-medium text-gray-800">{post.content}</p>
                      <p className="text-xs text-gray-500">{post.client} • {post.time}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    post.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {post.status === 'approved' ? 'Aprovado' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Performance por Plataforma */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl shadow-sm bg-white border border-gray-100"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Por Plataforma
          </h3>
          <div className="space-y-4">
            {platformStats.map((platform, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <platform.icon className="w-5 h-5" style={{ color: platform.color }} />
                    <span className="font-medium text-sm text-gray-800">{platform.platform}</span>
                  </div>
                  <span className="text-xs text-gray-500">{platform.followers}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ width: `${parseFloat(platform.engagement) * 10}%`, backgroundColor: platform.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{platform.engagement}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ==================== TRÁFEGO DASHBOARD ====================
export const TrafegoDashboard = ({ config }: { config: any }) => {
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  const stats = {
    totalSpend: 'R$ 45.2K',
    roas: '4.2x',
    conversions: 234,
    cpc: 'R$ 1.85',
    ctr: '3.2%'
  };

  const campaigns = [
    { id: 1, name: 'Black Friday - Tech Solutions', platform: 'Meta', spend: 'R$ 12.5K', roas: '5.2x', status: 'active', trend: 'up' },
    { id: 2, name: 'Lead Gen - E-commerce Plus', platform: 'Google', spend: 'R$ 8.3K', roas: '3.8x', status: 'active', trend: 'down' },
    { id: 3, name: 'Remarketing - Marketing Pro', platform: 'Meta', spend: 'R$ 5.1K', roas: '6.1x', status: 'paused', trend: 'up' }
  ];

  const budgetAlerts = [
    { client: 'Tech Solutions', platform: 'Meta Ads', remaining: '15%', urgent: true },
    { client: 'E-commerce Plus', platform: 'Google Ads', remaining: '45%', urgent: false },
    { client: 'Marketing Pro', platform: 'Meta Ads', remaining: '78%', urgent: false }
  ];

  const valInsights = [
    { icon: '💰', title: 'Orçamento', message: 'Tech Solutions está com apenas 15% do budget. Notifique o cliente!' },
    { icon: '📈', title: 'Performance', message: 'Campanha de Remarketing tem o melhor ROAS (6.1x). Considere escalar.' },
    { icon: '⚠️', title: 'Alerta', message: 'CPC do Google Ads subiu 12% esta semana. Revise os lances.' },
    { icon: '🎯', title: 'Oportunidade', message: 'Público lookalike de Tech Solutions pode render +30% de conversões.' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsightIndex((prev) => (prev + 1) % valInsights.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl text-white shadow-lg relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #155e75 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Painel de Tráfego Pago</h2>
              <p className="text-white/80">Gerencie campanhas e acompanhe performance</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur-md">
              <p className="text-xs text-white/70">Investimento Total</p>
              <p className="text-xl font-bold">{stats.totalSpend}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Val Insights */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-xl"
        style={{ 
          background: 'linear-gradient(135deg, #cffafe 0%, #ecfeff 100%)',
          border: '1px solid #a5f3fc'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-600" />
            <span className="font-semibold text-sm text-gray-800">Insights da Val</span>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentInsightIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-start gap-3"
          >
            <span className="text-2xl">{valInsights[currentInsightIndex].icon}</span>
            <div>
              <p className="font-medium text-sm text-gray-800">{valInsights[currentInsightIndex].title}</p>
              <p className="text-sm text-gray-600">{valInsights[currentInsightIndex].message}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Investimento', value: stats.totalSpend, icon: DollarSign, color: '#0891b2' },
          { label: 'ROAS Médio', value: stats.roas, icon: TrendingUp, color: '#10b981' },
          { label: 'Conversões', value: stats.conversions, icon: Target, color: '#8b5cf6' },
          { label: 'CPC Médio', value: stats.cpc, icon: Wallet, color: '#f59e0b' },
          { label: 'CTR Médio', value: stats.ctr, icon: Eye, color: '#ec4899' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="p-4 rounded-xl shadow-sm bg-white border border-gray-100"
          >
            <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campanhas Ativas */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 p-6 rounded-xl shadow-sm bg-white border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2 text-gray-800">
              <Target className="w-5 h-5 text-cyan-600" />
              Campanhas Ativas
            </h3>
            <a href="/colaborador/kanban" className="text-sm font-medium text-blue-600">Ver todas →</a>
          </div>
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800">{campaign.name}</p>
                    <p className="text-xs text-gray-500">{campaign.platform}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {campaign.status === 'active' ? 'Ativa' : 'Pausada'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Investido: {campaign.spend}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-gray-800">ROAS: {campaign.roas}</span>
                    {campaign.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Alertas de Orçamento */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl shadow-sm bg-white border border-gray-100"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
            <AlertCircle className="w-5 h-5 text-primary" />
            Alertas de Orçamento
          </h3>
          <div className="space-y-3">
            {budgetAlerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg ${alert.urgent ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-800">{alert.client}</span>
                  <span className={`text-xs font-bold ${alert.urgent ? 'text-red-600' : 'text-gray-600'}`}>
                    {alert.remaining} restante
                  </span>
                </div>
                <p className="text-xs text-gray-500">{alert.platform}</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full">
                  <div 
                    className={`h-2 rounded-full ${alert.urgent ? 'bg-red-500' : 'bg-cyan-500'}`}
                    style={{ width: alert.remaining }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ==================== VIDEO MAKER DASHBOARD ====================
export const VideoMakerDashboard = ({ config }: { config: any }) => {
  const stats = {
    projectsActive: 5,
    rendering: 2,
    delivered: 12,
    storageUsed: '78%'
  };

  const projects = [
    { id: 1, name: 'Vídeo Institucional', client: 'Tech Solutions', progress: 75, duration: '2:30', status: 'editing' },
    { id: 2, name: 'Reels Produto', client: 'E-commerce Plus', progress: 100, duration: '0:45', status: 'rendering' },
    { id: 3, name: 'Tutorial App', client: 'Marketing Pro', progress: 30, duration: '5:00', status: 'recording' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl text-white shadow-lg relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
              <Video className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Painel do Video Maker</h2>
              <p className="text-white/80">Gerencie projetos de vídeo e renders</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Projetos Ativos', value: stats.projectsActive, icon: Film, color: '#dc2626' },
          { label: 'Renderizando', value: stats.rendering, icon: RefreshCw, color: '#f59e0b' },
          { label: 'Entregues', value: stats.delivered, icon: CheckCircle2, color: '#10b981' },
          { label: 'Storage', value: stats.storageUsed, icon: Folder, color: '#8b5cf6' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="p-4 rounded-xl shadow-sm bg-white border border-gray-100"
          >
            <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Projects */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-xl shadow-sm bg-white border border-gray-100"
      >
        <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
          <Film className="w-5 h-5 text-red-500" />
          Projetos em Andamento
        </h3>
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800">{project.name}</p>
                  <p className="text-xs text-gray-500">{project.client} • {project.duration}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  project.status === 'editing' ? 'bg-blue-100 text-blue-700' :
                  project.status === 'rendering' ? 'bg-amber-100 text-amber-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {project.status === 'editing' ? 'Editando' : project.status === 'rendering' ? 'Renderizando' : 'Gravando'}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 rounded-full bg-red-500 transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{project.progress}% concluído</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ==================== HEAD MARKETING DASHBOARD ====================
export const HeadMarketingDashboard = ({ config }: { config: any }) => {
  const teamStats = {
    totalMembers: 8,
    tasksCompleted: 45,
    pendingApprovals: 12,
    avgProductivity: '87%'
  };

  const teamMembers = [
    { name: 'Ana Silva', role: 'Social Media', tasks: 8, completed: 6, avatar: 'AS' },
    { name: 'Carlos Souza', role: 'Tráfego', tasks: 5, completed: 5, avatar: 'CS' },
    { name: 'Maria Santos', role: 'Designer', tasks: 7, completed: 4, avatar: 'MS' },
    { name: 'João Lima', role: 'Copywriter', tasks: 10, completed: 8, avatar: 'JL' }
  ];

  const clientsOverview = [
    { name: 'Tech Solutions', health: 95, tasks: 12, pending: 2 },
    { name: 'E-commerce Plus', health: 78, tasks: 8, pending: 4 },
    { name: 'Marketing Pro', health: 88, tasks: 15, pending: 1 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl text-white shadow-lg relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Painel Head de Marketing</h2>
              <p className="text-white/80">Visão geral da equipe e clientes</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Equipe', value: teamStats.totalMembers, icon: Users, color: '#1d4ed8' },
          { label: 'Tarefas Concluídas', value: teamStats.tasksCompleted, icon: CheckCircle2, color: '#10b981' },
          { label: 'Aprovações Pendentes', value: teamStats.pendingApprovals, icon: Clock, color: '#f59e0b' },
          { label: 'Produtividade', value: teamStats.avgProductivity, icon: Gauge, color: '#8b5cf6' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="p-4 rounded-xl shadow-sm bg-white border border-gray-100"
          >
            <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl shadow-sm bg-white border border-gray-100"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Users className="w-5 h-5 text-blue-600" />
            Performance da Equipe
          </h3>
          <div className="space-y-3">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-gray-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {member.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-gray-800">{member.completed}/{member.tasks}</p>
                  <p className="text-xs text-gray-500">tarefas</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Clients */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl shadow-sm bg-white border border-gray-100"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Building2 className="w-5 h-5 text-purple-600" />
            Saúde dos Clientes
          </h3>
          <div className="space-y-3">
            {clientsOverview.map((client, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-800">{client.name}</span>
                  <span className={`text-xs font-bold ${
                    client.health >= 90 ? 'text-green-600' : client.health >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {client.health}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className={`h-2 rounded-full ${
                      client.health >= 90 ? 'bg-green-500' : client.health >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${client.health}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{client.tasks} tarefas • {client.pending} pendentes</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ==================== COMERCIAL DASHBOARD ====================
export const ComercialDashboard = ({ config }: { config: any }) => {
  const stats = {
    pipelineValue: 'R$ 125K',
    dealsInProgress: 8,
    closedThisMonth: 3,
    conversionRate: '32%',
    monthlyTarget: '65%'
  };

  const pipeline = [
    { stage: 'Prospecção', count: 12, value: 'R$ 45K', color: '#6366f1' },
    { stage: 'Qualificação', count: 8, value: 'R$ 32K', color: '#8b5cf6' },
    { stage: 'Proposta', count: 5, value: 'R$ 28K', color: '#f59e0b' },
    { stage: 'Negociação', count: 3, value: 'R$ 20K', color: '#10b981' }
  ];

  const recentDeals = [
    { name: 'Tech Solutions', value: 'R$ 15K', stage: 'Proposta', probability: '80%', contact: 'João Silva' },
    { name: 'StartupXYZ', value: 'R$ 8K', stage: 'Negociação', probability: '90%', contact: 'Maria Santos' },
    { name: 'E-commerce ABC', value: 'R$ 22K', stage: 'Qualificação', probability: '40%', contact: 'Carlos Lima' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl text-white shadow-lg relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #b91c1c 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Painel Comercial</h2>
              <p className="text-white/80">Pipeline de vendas e oportunidades</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur-md">
              <p className="text-xs text-white/70">Pipeline Total</p>
              <p className="text-xl font-bold">{stats.pipelineValue}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Pipeline', value: stats.pipelineValue, icon: DollarSign, color: '#ea580c' },
          { label: 'Em Andamento', value: stats.dealsInProgress, icon: Target, color: '#8b5cf6' },
          { label: 'Fechados', value: stats.closedThisMonth, icon: CheckCircle2, color: '#10b981' },
          { label: 'Conversão', value: stats.conversionRate, icon: TrendingUp, color: '#f59e0b' },
          { label: 'Meta Mensal', value: stats.monthlyTarget, icon: Gauge, color: '#1d4ed8' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="p-4 rounded-xl shadow-sm bg-white border border-gray-100"
          >
            <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Visual */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-xl shadow-sm bg-white border border-gray-100"
      >
        <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
          <BarChart3 className="w-5 h-5 text-primary" />
          Funil de Vendas
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {pipeline.map((stage, idx) => (
            <div key={idx} className="text-center">
              <div 
                className="h-24 rounded-lg flex items-end justify-center mb-2"
                style={{ backgroundColor: `${stage.color}20` }}
              >
                <div 
                  className="w-full rounded-lg transition-all"
                  style={{ 
                    backgroundColor: stage.color, 
                    height: `${(stage.count / 12) * 100}%`,
                    minHeight: '20%'
                  }}
                />
              </div>
              <p className="font-medium text-sm text-gray-800">{stage.stage}</p>
              <p className="text-lg font-bold" style={{ color: stage.color }}>{stage.count}</p>
              <p className="text-xs text-gray-500">{stage.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Deals */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-xl shadow-sm bg-white border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2 text-gray-800">
            <ShoppingCart className="w-5 h-5 text-purple-500" />
            Oportunidades Recentes
          </h3>
          <a href="/admin/comercial/propostas" className="text-sm font-medium text-blue-600">Ver todas →</a>
        </div>
        <div className="space-y-3">
          {recentDeals.map((deal, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-800">{deal.name}</p>
                  <p className="text-xs text-gray-500">{deal.contact} • {deal.stage}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{deal.value}</p>
                  <p className="text-xs text-green-600">{deal.probability} prob.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ==================== FINANCEIRO DASHBOARD ====================
export const FinanceiroDashboard = ({ config }: { config: any }) => {
  const stats = {
    revenue: 'R$ 285K',
    expenses: 'R$ 142K',
    profit: 'R$ 143K',
    pendingInvoices: 12,
    overdueAmount: 'R$ 18K'
  };

  const cashFlow = [
    { month: 'Set', income: 95, expense: 45 },
    { month: 'Out', income: 88, expense: 52 },
    { month: 'Nov', income: 102, expense: 45 }
  ];

  const pendingPayments = [
    { client: 'Tech Solutions', amount: 'R$ 8.500', dueDate: '05/12', status: 'pending' },
    { client: 'E-commerce Plus', amount: 'R$ 4.200', dueDate: '10/12', status: 'pending' },
    { client: 'Marketing Pro', amount: 'R$ 5.800', dueDate: '28/11', status: 'overdue' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl text-white shadow-lg relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Painel Financeiro</h2>
              <p className="text-white/80">Controle de receitas, despesas e cobranças</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Receita', value: stats.revenue, icon: TrendingUp, color: '#059669' },
          { label: 'Despesas', value: stats.expenses, icon: TrendingDown, color: '#dc2626' },
          { label: 'Lucro', value: stats.profit, icon: Banknote, color: '#10b981' },
          { label: 'Faturas Pendentes', value: stats.pendingInvoices, icon: Receipt, color: '#f59e0b' },
          { label: 'Em Atraso', value: stats.overdueAmount, icon: AlertCircle, color: '#dc2626' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="p-4 rounded-xl shadow-sm bg-white border border-gray-100"
          >
            <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl shadow-sm bg-white border border-gray-100"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Fluxo de Caixa
          </h3>
          <div className="space-y-4">
            {cashFlow.map((month, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{month.month}</span>
                  <span className="text-gray-500">R$ {month.income}K / R$ {month.expense}K</span>
                </div>
                <div className="flex gap-1 h-4">
                  <div className="bg-green-500 rounded" style={{ width: `${month.income}%` }} />
                  <div className="bg-red-400 rounded" style={{ width: `${month.expense}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pending Payments */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl shadow-sm bg-white border border-gray-100"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Receipt className="w-5 h-5 text-primary" />
            Cobranças Pendentes
          </h3>
          <div className="space-y-3">
            {pendingPayments.map((payment, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg ${payment.status === 'overdue' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{payment.client}</p>
                    <p className="text-xs text-gray-500">Vence: {payment.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{payment.amount}</p>
                    <span className={`text-xs ${payment.status === 'overdue' ? 'text-red-600' : 'text-primary'}`}>
                      {payment.status === 'overdue' ? 'Em atraso' : 'Pendente'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ==================== RH DASHBOARD ====================
export const RHDashboard = ({ config }: { config: any }) => {
  const stats = {
    totalEmployees: 24,
    onVacation: 2,
    pendingRequests: 5,
    birthdays: 3,
    openPositions: 2
  };

  const upcomingEvents = [
    { type: 'birthday', name: 'Ana Silva', date: '05/12', icon: Cake },
    { type: 'vacation', name: 'Carlos Souza', date: '10-20/12', icon: CalendarDays },
    { type: 'anniversary', name: 'Maria Santos', date: '15/12', icon: Gift }
  ];

  const pendingRequests = [
    { employee: 'João Lima', type: 'Férias', dates: '15-30/01', status: 'pending' },
    { employee: 'Ana Costa', type: 'Reembolso', amount: 'R$ 450', status: 'pending' },
    { employee: 'Pedro Silva', type: 'Home Office', dates: '2x/semana', status: 'pending' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl text-white shadow-lg relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Painel de RH</h2>
              <p className="text-white/80">Gestão de pessoas e solicitações</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Colaboradores', value: stats.totalEmployees, icon: Users, color: '#7c3aed' },
          { label: 'De Férias', value: stats.onVacation, icon: CalendarDays, color: '#f59e0b' },
          { label: 'Solicitações', value: stats.pendingRequests, icon: Clock, color: '#dc2626' },
          { label: 'Aniversários', value: stats.birthdays, icon: Cake, color: '#ec4899' },
          { label: 'Vagas Abertas', value: stats.openPositions, icon: UserPlus, color: '#10b981' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="p-4 rounded-xl shadow-sm bg-white border border-gray-100"
          >
            <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl shadow-sm bg-white border border-gray-100"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Calendar className="w-5 h-5 text-purple-600" />
            Próximos Eventos
          </h3>
          <div className="space-y-3">
            {upcomingEvents.map((event, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-gray-50 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  event.type === 'birthday' ? 'bg-pink-100' :
                  event.type === 'vacation' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <event.icon className={`w-5 h-5 ${
                    event.type === 'birthday' ? 'text-pink-600' :
                    event.type === 'vacation' ? 'text-blue-600' : 'text-purple-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{event.name}</p>
                  <p className="text-xs text-gray-500">{event.date}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pending Requests */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl shadow-sm bg-white border border-gray-100"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Bell className="w-5 h-5 text-primary" />
            Solicitações Pendentes
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((request, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-800">{request.employee}</p>
                  <p className="text-xs text-gray-500">{request.type} • {request.dates || request.amount}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-1.5 rounded bg-green-100 text-green-600 hover:bg-green-200">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200">
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};


