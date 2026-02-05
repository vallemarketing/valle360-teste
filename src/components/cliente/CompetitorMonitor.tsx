'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Plus,
  Trash2,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  Twitter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bell,
  BellOff,
  RefreshCw,
  ExternalLink,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Zap,
  Target,
  ChevronRight,
  X,
  Check,
  Search,
  Filter
} from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  platforms: {
    platform: string;
    handle: string;
    profileUrl: string;
    followers: number;
    lastActivity?: Date;
  }[];
  isActive: boolean;
  alertsEnabled: boolean;
}

interface Activity {
  id: string;
  competitorId: string;
  competitorName: string;
  platform: string;
  activityType: string;
  content: string;
  mediaUrl?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
  detectedAt: Date;
  isViral: boolean;
  aiAnalysis?: string;
}

// Mock data
const mockCompetitors: Competitor[] = [
  {
    id: '1',
    name: 'Concorrente Alpha',
    platforms: [
      { platform: 'instagram', handle: '@alpha_oficial', profileUrl: 'https://instagram.com/alpha_oficial', followers: 45000, lastActivity: new Date(Date.now() - 1000 * 60 * 30) },
      { platform: 'facebook', handle: 'Alpha Oficial', profileUrl: 'https://facebook.com/alpha', followers: 32000 },
      { platform: 'linkedin', handle: 'Alpha Company', profileUrl: 'https://linkedin.com/company/alpha', followers: 12000 }
    ],
    isActive: true,
    alertsEnabled: true
  },
  {
    id: '2',
    name: 'Concorrente Beta',
    platforms: [
      { platform: 'instagram', handle: '@beta_brand', profileUrl: 'https://instagram.com/beta_brand', followers: 38000, lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2) },
      { platform: 'website', handle: 'beta.com.br', profileUrl: 'https://beta.com.br', followers: 0 }
    ],
    isActive: true,
    alertsEnabled: true
  },
  {
    id: '3',
    name: 'Concorrente Gamma',
    platforms: [
      { platform: 'instagram', handle: '@gamma_mkt', profileUrl: 'https://instagram.com/gamma_mkt', followers: 52000, lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 5) }
    ],
    isActive: true,
    alertsEnabled: false
  }
];

const mockActivities: Activity[] = [
  {
    id: '1',
    competitorId: '1',
    competitorName: 'Concorrente Alpha',
    platform: 'instagram',
    activityType: 'new_reel',
    content: 'Novo Reel sobre tendências de marketing digital para 2025! 🚀',
    mediaUrl: 'https://picsum.photos/seed/reel1/400/600',
    engagement: { likes: 2340, comments: 156, shares: 89 },
    detectedAt: new Date(Date.now() - 1000 * 60 * 30),
    isViral: true,
    aiAnalysis: 'Post com alto engajamento! O tema de tendências está gerando muito interesse. Considere criar conteúdo similar.'
  },
  {
    id: '2',
    competitorId: '2',
    competitorName: 'Concorrente Beta',
    platform: 'website',
    activityType: 'promotion',
    content: 'Black Friday: 40% de desconto em todos os planos!',
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isViral: false,
    aiAnalysis: 'Promoção agressiva detectada. Avalie se precisa ajustar sua estratégia de preços.'
  },
  {
    id: '3',
    competitorId: '1',
    competitorName: 'Concorrente Alpha',
    platform: 'linkedin',
    activityType: 'new_post',
    content: 'Estamos contratando! Vagas abertas para Social Media e Designer.',
    engagement: { likes: 456, comments: 34, shares: 12 },
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    isViral: false
  },
  {
    id: '4',
    competitorId: '3',
    competitorName: 'Concorrente Gamma',
    platform: 'instagram',
    activityType: 'new_post',
    content: 'Case de sucesso: Como aumentamos 300% o engajamento do cliente X',
    mediaUrl: 'https://picsum.photos/seed/case1/400/400',
    engagement: { likes: 1890, comments: 98, shares: 45 },
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isViral: false
  },
  {
    id: '5',
    competitorId: '2',
    competitorName: 'Concorrente Beta',
    platform: 'instagram',
    activityType: 'follower_spike',
    content: 'Aumento de 15% em seguidores nas últimas 24h (32.800 → 37.720)',
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    isViral: false,
    aiAnalysis: 'Crescimento atípico detectado. Possível campanha paga ou conteúdo viral não capturado.'
  }
];

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  website: Globe
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-600',
  facebook: 'from-blue-600 to-blue-700',
  linkedin: 'from-blue-700 to-blue-800',
  twitter: 'from-gray-700 to-gray-900',
  website: 'from-green-500 to-green-600'
};

const ACTIVITY_LABELS: Record<string, string> = {
  new_post: 'Novo Post',
  new_reel: 'Novo Reel',
  new_story: 'Novo Story',
  blog_post: 'Artigo no Blog',
  promotion: 'Promoção',
  follower_spike: 'Aumento de Seguidores',
  bio_change: 'Mudança de Bio'
};

export default function CompetitorMonitor() {
  const [competitors, setCompetitors] = useState<Competitor[]>(mockCompetitors);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Filtrar atividades
  const filteredActivities = activities.filter(activity => {
    if (selectedCompetitor && activity.competitorId !== selectedCompetitor) return false;
    if (filterPlatform !== 'all' && activity.platform !== filterPlatform) return false;
    if (filterType !== 'all' && activity.activityType !== filterType) return false;
    return true;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const toggleAlerts = (competitorId: string) => {
    setCompetitors(competitors.map(c => 
      c.id === competitorId ? { ...c, alertsEnabled: !c.alertsEnabled } : c
    ));
  };

  const removeCompetitor = (competitorId: string) => {
    setCompetitors(competitors.filter(c => c.id !== competitorId));
    setActivities(activities.filter(a => a.competitorId !== competitorId));
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Eye className="w-7 h-7" style={{ color: 'var(--primary-500)' }} />
            Monitoramento de Concorrentes
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Acompanhe em tempo real as atividades dos seus concorrentes
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium"
            style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
          >
            <Plus className="w-5 h-5" />
            Adicionar Concorrente
          </button>
        </div>
      </div>

      {/* Competitors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitors.map((competitor, index) => (
          <motion.div
            key={competitor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              selectedCompetitor === competitor.id ? 'ring-2 ring-primary-500' : ''
            }`}
            style={{ 
              backgroundColor: 'var(--bg-primary)', 
              border: '1px solid var(--border-light)' 
            }}
            onClick={() => setSelectedCompetitor(
              selectedCompetitor === competitor.id ? null : competitor.id
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {competitor.name}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {competitor.platforms.length} plataformas
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAlerts(competitor.id);
                  }}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                  title={competitor.alertsEnabled ? 'Desativar alertas' : 'Ativar alertas'}
                >
                  {competitor.alertsEnabled ? (
                    <Bell className="w-4 h-4" style={{ color: 'var(--primary-500)' }} />
                  ) : (
                    <BellOff className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCompetitor(competitor.id);
                  }}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" style={{ color: 'var(--error-500)' }} />
                </button>
              </div>
            </div>

            {/* Platforms */}
            <div className="flex flex-wrap gap-2 mb-3">
              {competitor.platforms.map((platform) => {
                const Icon = PLATFORM_ICONS[platform.platform] || Globe;
                return (
                  <div
                    key={platform.platform}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <Icon className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {platform.followers > 0 ? `${(platform.followers / 1000).toFixed(1)}K` : platform.handle}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Last Activity */}
            {competitor.platforms[0]?.lastActivity && (
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <Clock className="w-3 h-3" />
                Última atividade: {formatTimeAgo(competitor.platforms[0].lastActivity)}
              </div>
            )}
          </motion.div>
        ))}

        {/* Add Competitor Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: competitors.length * 0.1 }}
          onClick={() => setShowAddModal(true)}
          className="p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[150px] transition-colors hover:border-primary-500"
          style={{ borderColor: 'var(--border-light)', backgroundColor: 'transparent' }}
        >
          <Plus className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Adicionar Concorrente</span>
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Filtros:</span>
        </div>
        
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
        >
          <option value="all">Todas plataformas</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="linkedin">LinkedIn</option>
          <option value="website">Website</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
        >
          <option value="all">Todos os tipos</option>
          <option value="new_post">Posts</option>
          <option value="new_reel">Reels</option>
          <option value="promotion">Promoções</option>
          <option value="follower_spike">Crescimento</option>
        </select>

        {selectedCompetitor && (
          <button
            onClick={() => setSelectedCompetitor(null)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}
          >
            <X className="w-3 h-3" />
            Limpar filtro de concorrente
          </button>
        )}
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Zap className="w-5 h-5" style={{ color: 'var(--warning-500)' }} />
          Feed de Atividades
          <span 
            className="px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            {filteredActivities.length}
          </span>
        </h2>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredActivities.map((activity, index) => {
              const PlatformIcon = PLATFORM_ICONS[activity.platform] || Globe;
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl"
                  style={{ 
                    backgroundColor: 'var(--bg-primary)', 
                    border: activity.isViral ? '2px solid var(--warning-400)' : '1px solid var(--border-light)'
                  }}
                >
                  {/* Viral Badge */}
                  {activity.isViral && (
                    <div 
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium mb-3 w-fit"
                      style={{ backgroundColor: 'var(--warning-100)', color: 'var(--warning-700)' }}
                    >
                      <TrendingUp className="w-3 h-3" />
                      Post Viral
                    </div>
                  )}

                  <div className="flex gap-4">
                    {/* Media Preview */}
                    {activity.mediaUrl && (
                      <div 
                        className="w-24 h-24 rounded-xl bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${activity.mediaUrl})` }}
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${PLATFORM_COLORS[activity.platform]} flex items-center justify-center`}
                          >
                            <PlatformIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              {activity.competitorName}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {ACTIVITY_LABELS[activity.activityType] || activity.activityType} • {formatTimeAgo(activity.detectedAt)}
                            </p>
                          </div>
                        </div>

                        <a
                          href="#"
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                          title="Ver original"
                        >
                          <ExternalLink className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        </a>
                      </div>

                      {/* Content */}
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {activity.content}
                      </p>

                      {/* Engagement */}
                      {activity.engagement && (
                        <div className="flex gap-4 mb-3">
                          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            <Heart className="w-4 h-4" />
                            {activity.engagement.likes.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            <MessageCircle className="w-4 h-4" />
                            {activity.engagement.comments.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            <Share2 className="w-4 h-4" />
                            {activity.engagement.shares.toLocaleString()}
                          </div>
                        </div>
                      )}

                      {/* AI Analysis */}
                      {activity.aiAnalysis && (
                        <div 
                          className="p-3 rounded-lg flex items-start gap-2"
                          style={{ backgroundColor: 'var(--purple-50)' }}
                        >
                          <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--purple-500)' }} />
                          <p className="text-sm" style={{ color: 'var(--purple-700)' }}>
                            <span className="font-medium">Val:</span> {activity.aiAnalysis}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                Nenhuma atividade encontrada com os filtros selecionados
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Competitor Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg p-6 rounded-2xl"
              style={{ backgroundColor: 'var(--bg-primary)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Adicionar Concorrente
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <X className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Nome do Concorrente
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Empresa XYZ"
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Instagram
                  </label>
                  <div className="flex gap-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <Instagram className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <input
                      type="text"
                      placeholder="@usuario"
                      className="flex-1 px-4 py-2 rounded-xl"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Facebook
                  </label>
                  <div className="flex gap-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <Facebook className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <input
                      type="text"
                      placeholder="URL da página"
                      className="flex-1 px-4 py-2 rounded-xl"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Website
                  </label>
                  <div className="flex gap-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <Globe className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <input
                      type="text"
                      placeholder="https://exemplo.com.br"
                      className="flex-1 px-4 py-2 rounded-xl"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl font-medium"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Adicionar concorrente
                    setShowAddModal(false);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl font-medium"
                  style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
                >
                  Adicionar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}









