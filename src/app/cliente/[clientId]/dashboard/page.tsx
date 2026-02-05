'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Users,
  Instagram,
  Facebook,
  Linkedin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  Link2,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalPosts: number;
  postsThisMonth: number;
  totalReach: number;
  totalEngagement: number;
  scheduledPosts: number;
  pendingApproval: number;
}

interface SocialConnection {
  id: string;
  platform: string;
  account_name: string;
  is_active: boolean;
}

interface RecentPost {
  id: string;
  copy: string;
  platforms: string[];
  status: string;
  scheduled_at?: string;
  published_at?: string;
}

const PLATFORM_ICONS: Record<string, React.ComponentType<any>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending_approval: { label: 'Aguardando', color: 'var(--warning-600)', bgColor: 'var(--warning-100)' },
  approved: { label: 'Aprovado', color: 'var(--success-600)', bgColor: 'var(--success-100)' },
  scheduled: { label: 'Agendado', color: 'var(--primary-600)', bgColor: 'var(--primary-100)' },
  published: { label: 'Publicado', color: 'var(--success-700)', bgColor: 'var(--success-50)' },
};

export default function ClientDashboardPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    postsThisMonth: 0,
    totalReach: 0,
    totalEngagement: 0,
    scheduledPosts: 0,
    pendingApproval: 0,
  });
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [clientId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load connections
      const connRes = await fetch(`/api/client/${clientId}/social-connections`);
      const connData = await connRes.json();
      if (connRes.ok) {
        setConnections(connData.connections || []);
      }

      // Load scheduled posts for stats
      const postsRes = await fetch(`/api/admin/social/publish?client_id=${clientId}`);
      const postsData = await postsRes.json();
      if (postsRes.ok) {
        const posts = postsData.posts || [];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        setRecentPosts(posts.slice(0, 5));
        setStats({
          totalPosts: posts.filter((p: any) => p.status === 'published').length,
          postsThisMonth: posts.filter((p: any) => 
            p.status === 'published' && 
            new Date(p.published_at || p.created_at) >= startOfMonth
          ).length,
          totalReach: 0, // TODO: Get from metrics
          totalEngagement: 0, // TODO: Get from metrics
          scheduledPosts: posts.filter((p: any) => p.status === 'scheduled').length,
          pendingApproval: posts.filter((p: any) => p.status === 'pending_approval').length,
        });
      }
    } catch (e) {
      console.error('Error loading dashboard:', e);
      toast.error('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary-500)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--primary-50)' }}
          >
            <BarChart3 className="w-7 h-7" style={{ color: 'var(--primary-500)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Meu Dashboard
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Acompanhe seus posts e métricas
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Posts este mês', value: stats.postsThisMonth, icon: Calendar, color: 'var(--primary-500)' },
            { label: 'Total publicados', value: stats.totalPosts, icon: CheckCircle2, color: 'var(--success-500)' },
            { label: 'Agendados', value: stats.scheduledPosts, icon: Clock, color: 'var(--info-500)' },
            { label: 'Aguardando aprovação', value: stats.pendingApproval, icon: AlertCircle, color: 'var(--warning-500)' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border p-5"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connected Networks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                Redes Conectadas
              </h3>
              <Link
                href={`/cliente/${clientId}/redes-sociais`}
                className="text-sm font-medium"
                style={{ color: 'var(--primary-600)' }}
              >
                Gerenciar
              </Link>
            </div>

            {connections.length === 0 ? (
              <div className="text-center py-6">
                <Link2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Nenhuma rede conectada
                </p>
                <Link
                  href={`/cliente/${clientId}/redes-sociais`}
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl font-medium text-white text-sm"
                  style={{ backgroundColor: 'var(--primary-500)' }}
                >
                  Conectar redes
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((conn) => {
                  const Icon = PLATFORM_ICONS[conn.platform] || Link2;
                  return (
                    <div
                      key={conn.id}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {conn.account_name}
                        </p>
                        <p className="text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>
                          {conn.platform}
                        </p>
                      </div>
                      <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success-500)' }} />
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Recent Posts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                Últimos Posts
              </h3>
              <Link
                href={`/cliente/${clientId}/posts`}
                className="inline-flex items-center gap-1 text-sm font-medium"
                style={{ color: 'var(--primary-600)' }}
              >
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recentPosts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Nenhum post ainda
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => {
                  const status = STATUS_CONFIG[post.status] || STATUS_CONFIG.scheduled;
                  return (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: status.bgColor, color: status.color }}
                          >
                            {status.label}
                          </span>
                          <div className="flex items-center gap-1">
                            {post.platforms.map((p) => {
                              const Icon = PLATFORM_ICONS[p];
                              return Icon ? (
                                <Icon key={p} className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                              ) : null;
                            })}
                          </div>
                        </div>
                        <p className="text-sm line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                          {post.copy}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          {post.scheduled_at
                            ? new Date(post.scheduled_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Sem data'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Link
            href={`/cliente/${clientId}/calendario`}
            className="p-5 rounded-2xl border text-left hover:shadow-md transition-shadow"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
          >
            <Calendar className="w-8 h-8 mb-3" style={{ color: 'var(--primary-500)' }} />
            <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Calendário
            </h4>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Ver posts agendados
            </p>
          </Link>

          <Link
            href={`/cliente/${clientId}/aprovacoes`}
            className="p-5 rounded-2xl border text-left hover:shadow-md transition-shadow"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
          >
            <CheckCircle2 className="w-8 h-8 mb-3" style={{ color: 'var(--success-500)' }} />
            <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Aprovações
            </h4>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {stats.pendingApproval} pendente{stats.pendingApproval !== 1 ? 's' : ''}
            </p>
          </Link>

          <Link
            href={`/cliente/${clientId}/redes-sociais`}
            className="p-5 rounded-2xl border text-left hover:shadow-md transition-shadow"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
          >
            <Link2 className="w-8 h-8 mb-3" style={{ color: 'var(--info-500)' }} />
            <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Redes Sociais
            </h4>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {connections.length} conectada{connections.length !== 1 ? 's' : ''}
            </p>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
