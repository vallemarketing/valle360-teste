'use client';

/**
 * Valle 360 - Central de Reputação (Cliente)
 * Dashboard completo de reputação: Google, Reclame Aqui, Redes Sociais
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  ChevronRight,
  Reply,
  Eye,
  BarChart3,
  Zap,
  Shield,
  Award,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatureGate } from '@/components/features/FeatureGate';

// =====================================================
// TIPOS
// =====================================================

interface ReputationOverview {
  score: number;
  status: 'excellent' | 'good' | 'attention' | 'critical';
  platforms: {
    google: { rating: number; totalReviews: number; pendingReplies: number };
    reclameAqui: { rating: number; solutionRate: number; pendingComplaints: number; reputation: string };
    social: { sentiment: number; mentions: number; alerts: number };
  };
  trend: 'up' | 'down' | 'stable';
  insights: any[];
}

interface UnifiedReview {
  id: string;
  platform: string;
  authorName: string;
  rating?: number;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: string;
  hasReply: boolean;
  needsAttention: boolean;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function ReputacaoPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'google' | 'reclameaqui' | 'social' | 'insights'>('overview');
  const [overview, setOverview] = useState<ReputationOverview | null>(null);
  const [reviews, setReviews] = useState<UnifiedReview[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<UnifiedReview | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, reviewsRes, predictionsRes] = await Promise.all([
        fetch('/api/reputation/analyze?action=overview').then(r => r.json()),
        fetch('/api/reputation/analyze?action=reviews').then(r => r.json()),
        fetch('/api/reputation/analyze?action=predictive').then(r => r.json())
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (reviewsRes.success) setReviews(reviewsRes.data);
      if (predictionsRes.success) setPredictions(predictionsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <RefreshCw className="w-8 h-8 animate-spin text-[#1672d6]" />
      </div>
    );
  }

  return (
    <FeatureGate feature="reputation">
      <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <Star className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#001533] dark:text-white">
                  Central de Reputação
                </h1>
                <p className="text-gray-500">
                  Monitore e gerencie sua reputação em todas as plataformas
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>

          {/* Score Card Principal */}
          {overview && (
            <div className="grid grid-cols-4 gap-6">
              {/* Score Geral */}
              <div className="col-span-1 bg-gradient-to-br from-[#001533] to-[#1672d6] rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/70 text-sm font-medium">Score Geral</span>
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                    overview.trend === 'up' ? "bg-green-500/20 text-green-300" :
                    overview.trend === 'down' ? "bg-red-500/20 text-red-300" :
                    "bg-white/20 text-white"
                  )}>
                    {overview.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                    {overview.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                    {overview.trend === 'stable' && <Minus className="w-3 h-3" />}
                    {overview.trend === 'up' ? 'Subindo' : overview.trend === 'down' ? 'Caindo' : 'Estável'}
                  </div>
                </div>

                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-bold">{overview.score}</span>
                  <span className="text-white/50 text-xl mb-2">/100</span>
                </div>

                <div className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                  overview.status === 'excellent' && "bg-green-500/20 text-green-300",
                  overview.status === 'good' && "bg-blue-500/20 text-blue-300",
                  overview.status === 'attention' && "bg-yellow-500/20 text-yellow-300",
                  overview.status === 'critical' && "bg-red-500/20 text-red-300"
                )}>
                  {overview.status === 'excellent' && <Award className="w-4 h-4" />}
                  {overview.status === 'good' && <CheckCircle className="w-4 h-4" />}
                  {overview.status === 'attention' && <AlertTriangle className="w-4 h-4" />}
                  {overview.status === 'critical' && <AlertTriangle className="w-4 h-4" />}
                  {overview.status === 'excellent' && 'Excelente'}
                  {overview.status === 'good' && 'Bom'}
                  {overview.status === 'attention' && 'Atenção'}
                  {overview.status === 'critical' && 'Crítico'}
                </div>
              </div>

              {/* Google */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Google</span>
                  </div>
                  {overview.platforms.google.pendingReplies > 0 && (
                    <span className="px-2 py-1 bg-amber-100 text-primary rounded-full text-xs font-medium">
                      {overview.platforms.google.pendingReplies} pendente{overview.platforms.google.pendingReplies > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-800 dark:text-white">
                    {overview.platforms.google.rating.toFixed(1)}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= Math.round(overview.platforms.google.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {overview.platforms.google.totalReviews} avaliações
                </p>
              </div>

              {/* Reclame Aqui */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Reclame Aqui</span>
                  </div>
                  {overview.platforms.reclameAqui.pendingComplaints > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                      {overview.platforms.reclameAqui.pendingComplaints} pendente{overview.platforms.reclameAqui.pendingComplaints > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-800 dark:text-white">
                    {overview.platforms.reclameAqui.rating.toFixed(1)}
                  </span>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold uppercase",
                    overview.platforms.reclameAqui.reputation === 'otimo' && "bg-green-100 text-green-700",
                    overview.platforms.reclameAqui.reputation === 'bom' && "bg-blue-100 text-blue-700",
                    overview.platforms.reclameAqui.reputation === 'regular' && "bg-yellow-100 text-yellow-700",
                    overview.platforms.reclameAqui.reputation === 'ruim' && "bg-amber-100 text-amber-700",
                    overview.platforms.reclameAqui.reputation === 'nao_recomendado' && "bg-red-100 text-red-700"
                  )}>
                    {overview.platforms.reclameAqui.reputation.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {overview.platforms.reclameAqui.solutionRate}% de solução
                </p>
              </div>

              {/* Redes Sociais */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Redes Sociais</span>
                  </div>
                  {overview.platforms.social.alerts > 0 && (
                    <span className="px-2 py-1 bg-amber-100 text-primary rounded-full text-xs font-medium">
                      {overview.platforms.social.alerts} alerta{overview.platforms.social.alerts > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-800 dark:text-white">
                    {overview.platforms.social.sentiment > 0 ? '+' : ''}{(overview.platforms.social.sentiment * 100).toFixed(0)}%
                  </span>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    overview.platforms.social.sentiment > 0.2 && "bg-green-100",
                    overview.platforms.social.sentiment <= 0.2 && overview.platforms.social.sentiment >= -0.2 && "bg-gray-100",
                    overview.platforms.social.sentiment < -0.2 && "bg-red-100"
                  )}>
                    {overview.platforms.social.sentiment > 0.2 && <ThumbsUp className="w-3 h-3 text-green-600" />}
                    {overview.platforms.social.sentiment <= 0.2 && overview.platforms.social.sentiment >= -0.2 && <Minus className="w-3 h-3 text-gray-600" />}
                    {overview.platforms.social.sentiment < -0.2 && <ThumbsDown className="w-3 h-3 text-red-600" />}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {overview.platforms.social.mentions} menções recentes
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'google', label: 'Google', icon: Star },
              { id: 'reclameaqui', label: 'Reclame Aqui', icon: Shield },
              { id: 'social', label: 'Redes Sociais', icon: MessageSquare },
              { id: 'insights', label: 'Insights Preditivos', icon: Sparkles }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-[#1672d6] text-[#1672d6]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* Visão Geral */}
            {activeTab === 'overview' && overview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-3 gap-6"
              >
                {/* Insights e Alertas */}
                <div className="col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Insights e Ações Recomendadas
                  </h3>

                  <div className="space-y-3">
                    {overview.insights.map((insight, index) => (
                      <div
                        key={insight.id}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-xl",
                          insight.type === 'action' && "bg-blue-50 border border-blue-200",
                          insight.type === 'warning' && "bg-amber-50 border border-amber-200",
                          insight.type === 'opportunity' && "bg-green-50 border border-green-200",
                          insight.type === 'success' && "bg-emerald-50 border border-emerald-200"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          insight.type === 'action' && "bg-blue-100",
                          insight.type === 'warning' && "bg-amber-100",
                          insight.type === 'opportunity' && "bg-green-100",
                          insight.type === 'success' && "bg-emerald-100"
                        )}>
                          {insight.type === 'action' && <Target className="w-5 h-5 text-blue-600" />}
                          {insight.type === 'warning' && <AlertTriangle className="w-5 h-5 text-primary" />}
                          {insight.type === 'opportunity' && <TrendingUp className="w-5 h-5 text-green-600" />}
                          {insight.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-800">{insight.title}</h4>
                            {insight.platform && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {insight.platform}
                              </span>
                            )}
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              insight.priority === 'high' && "bg-red-100 text-red-600",
                              insight.priority === 'medium' && "bg-yellow-100 text-yellow-600",
                              insight.priority === 'low' && "bg-gray-100 text-gray-600"
                            )}>
                              {insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Média' : 'Baixa'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{insight.description}</p>
                        </div>
                        {insight.actionUrl && (
                          <button className="px-3 py-1.5 bg-[#1672d6] text-white rounded-lg text-sm font-medium hover:bg-[#1260b5] transition-colors">
                            Ver
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews Recentes */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    Últimas Avaliações
                  </h3>

                  <div className="space-y-3">
                    {reviews.slice(0, 5).map(review => (
                      <div
                        key={review.id}
                        className={cn(
                          "p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow",
                          review.needsAttention
                            ? "border-amber-200 bg-amber-50"
                            : "border-gray-100 dark:border-gray-700"
                        )}
                        onClick={() => setSelectedReview(review)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-800 dark:text-white">
                            {review.authorName}
                          </span>
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center",
                            review.sentiment === 'positive' && "bg-green-100",
                            review.sentiment === 'neutral' && "bg-gray-100",
                            review.sentiment === 'negative' && "bg-red-100"
                          )}>
                            {review.sentiment === 'positive' && <ThumbsUp className="w-3 h-3 text-green-600" />}
                            {review.sentiment === 'neutral' && <Minus className="w-3 h-3 text-gray-600" />}
                            {review.sentiment === 'negative' && <ThumbsDown className="w-3 h-3 text-red-600" />}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {review.text}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400 capitalize">{review.platform}</span>
                          {review.needsAttention && !review.hasReply && (
                            <span className="text-xs text-primary font-medium">Responder</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Google */}
            {activeTab === 'google' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                    Reviews do Google
                  </h3>
                  
                  <div className="space-y-4">
                    {reviews.filter(r => r.platform === 'google').map(review => (
                      <div
                        key={review.id}
                        className="flex gap-4 p-4 border border-gray-100 dark:border-gray-700 rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                          {review.authorName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800 dark:text-white">
                              {review.authorName}
                            </span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "w-3 h-3",
                                    star <= (review.rating || 0)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{review.text}</p>
                          <div className="flex items-center gap-2 mt-3">
                            {review.hasReply ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Respondido
                              </span>
                            ) : (
                              <button className="text-xs text-[#1672d6] font-medium flex items-center gap-1 hover:underline">
                                <Reply className="w-3 h-3" />
                                Responder
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Reclame Aqui */}
            {activeTab === 'reclameaqui' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                    Reclamações no Reclame Aqui
                  </h3>
                  
                  <div className="space-y-4">
                    {reviews.filter(r => r.platform === 'reclame_aqui').map(review => (
                      <div
                        key={review.id}
                        className={cn(
                          "p-4 border rounded-xl",
                          review.needsAttention
                            ? "border-red-200 bg-red-50"
                            : review.hasReply
                            ? "border-green-200 bg-green-50"
                            : "border-gray-100 dark:border-gray-700"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800 dark:text-white">
                            {review.authorName}
                          </span>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            review.needsAttention && "bg-red-100 text-red-600",
                            review.hasReply && !review.needsAttention && "bg-green-100 text-green-600"
                          )}>
                            {review.needsAttention ? 'Pendente' : review.hasReply ? 'Respondido' : 'Aguardando'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{review.text}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                          {review.needsAttention && (
                            <button className="text-xs text-red-600 font-medium flex items-center gap-1 hover:underline">
                              <Reply className="w-3 h-3" />
                              Responder Urgente
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Redes Sociais */}
            {activeTab === 'social' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                    Menções nas Redes Sociais
                  </h3>
                  
                  <div className="space-y-4">
                    {reviews.filter(r => ['instagram', 'facebook', 'other'].includes(r.platform)).map(review => (
                      <div
                        key={review.id}
                        className="flex gap-4 p-4 border border-gray-100 dark:border-gray-700 rounded-xl"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                          review.platform === 'instagram' && "bg-gradient-to-br from-purple-500 to-pink-500",
                          review.platform === 'facebook' && "bg-blue-600",
                          review.platform === 'other' && "bg-gray-500"
                        )}>
                          {review.authorName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800 dark:text-white">
                              {review.authorName}
                            </span>
                            <span className="text-xs text-gray-400 capitalize">
                              {review.platform}
                            </span>
                            <span className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center",
                              review.sentiment === 'positive' && "bg-green-100",
                              review.sentiment === 'neutral' && "bg-gray-100",
                              review.sentiment === 'negative' && "bg-red-100"
                            )}>
                              {review.sentiment === 'positive' && <ThumbsUp className="w-2.5 h-2.5 text-green-600" />}
                              {review.sentiment === 'neutral' && <Minus className="w-2.5 h-2.5 text-gray-600" />}
                              {review.sentiment === 'negative' && <ThumbsDown className="w-2.5 h-2.5 text-red-600" />}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{review.text}</p>
                          <span className="text-xs text-gray-400 mt-2 block">
                            {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Insights Preditivos */}
            {activeTab === 'insights' && predictions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-6"
              >
                {/* Previsões */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Previsões da Val IA
                  </h3>

                  <div className="space-y-4">
                    {predictions.predictions.map((prediction: any) => (
                      <div
                        key={prediction.id}
                        className={cn(
                          "p-4 rounded-xl border",
                          prediction.type === 'risk'
                            ? "border-red-200 bg-red-50"
                            : "border-green-200 bg-green-50"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {prediction.type === 'risk' ? (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          ) : (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          )}
                          <h4 className="font-medium text-gray-800">{prediction.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{prediction.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500">
                              Probabilidade: <strong>{Math.round(prediction.probability * 100)}%</strong>
                            </span>
                            <span className="text-xs text-gray-500">
                              Impacto: <strong className={cn(
                                prediction.impact === 'high' && "text-red-600",
                                prediction.impact === 'medium' && "text-yellow-600",
                                prediction.impact === 'low' && "text-gray-600"
                              )}>
                                {prediction.impact === 'high' ? 'Alto' : prediction.impact === 'medium' ? 'Médio' : 'Baixo'}
                              </strong>
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{prediction.timeframe}</span>
                        </div>
                        {prediction.action && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="text-xs text-gray-500">Ação recomendada:</span>
                            <p className="text-sm text-[#1672d6] font-medium">{prediction.action}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recomendações */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Recomendações
                  </h3>

                  <div className="space-y-3">
                    {predictions.recommendations.map((rec: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#1672d6] flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA Val IA */}
                  <div className="mt-6 p-4 bg-gradient-to-br from-[#001533] to-[#1672d6] rounded-xl text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold">Precisa de ajuda?</h4>
                        <p className="text-xs text-white/70">Converse com a Val IA</p>
                      </div>
                    </div>
                    <p className="text-sm text-white/80 mb-3">
                      A Val pode ajudar você a criar respostas para reviews, analisar tendências e sugerir ações.
                    </p>
                    <button className="w-full py-2 bg-white text-[#001533] rounded-lg text-sm font-bold hover:bg-white/90 transition-colors">
                      Conversar com Val IA
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </FeatureGate>
  );
}

