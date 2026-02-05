'use client';

import { useState, useEffect } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Instagram, ThumbsUp, MessageCircle, Share2, Plus, Calendar } from 'lucide-react';
import { getSocialPosts, getSocialMetrics, createSocialPost, updatePostStatus } from '@/app/actions/social-media';

export function SocialMediaView() {
  const [posts, setPosts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);

      // Buscar posts
      const postsData = await getSocialPosts();
      setPosts(postsData);

      // Buscar métricas dos últimos 30 dias
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);

      const metricsData = await getSocialMetrics({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      setMetrics(metricsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      delayed: 'bg-yellow-100 text-yellow-800',
      canceled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      instagram: '#E1306C',
      facebook: '#1877F2',
      tiktok: '#000000',
      youtube: '#FF0000',
      linkedin: '#0A66C2',
      twitter: '#1DA1F2',
    };
    return colors[channel] || '#6B7280';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Posts Publicados"
          value={metrics?.totalPosts || 0}
          change={15}
          trend="up"
          icon={<Instagram className="w-5 h-5" />}
          color="#E1306C"
        />
        <KPICard
          label="Total de Likes"
          value={metrics?.totalLikes || 0}
          change={23}
          trend="up"
          icon={<ThumbsUp className="w-5 h-5" />}
          color="#10B981"
        />
        <KPICard
          label="Comentários"
          value={metrics?.totalComments || 0}
          change={8}
          trend="up"
          icon={<MessageCircle className="w-5 h-5" />}
          color="#3B82F6"
        />
        <KPICard
          label="Engajamento Médio"
          value={metrics?.avgEngagement || 0}
          change={12}
          trend="up"
          icon={<Share2 className="w-5 h-5" />}
          color="#F59E0B"
        />
      </div>

      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendário de Posts
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gerencie seus posts em redes sociais
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Post
        </Button>
      </div>

      {/* Calendário Simplificado (Grid de dias) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Anterior</Button>
            <Button variant="outline" size="sm">Próximo</Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-600 mb-2">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - 15 + i);
            const dayPosts = posts.filter(p => {
              if (!p.scheduled_at) return false;
              const postDate = new Date(p.scheduled_at);
              return postDate.toDateString() === date.toDateString();
            });

            return (
              <div
                key={i}
                className={`
                  min-h-[80px] p-2 border rounded-lg
                  ${date.toDateString() === new Date().toDateString()
                    ? 'bg-amber-50 border-amber-300 dark:bg-amber-950'
                    : 'bg-white dark:bg-gray-900'
                  }
                `}
              >
                <div className="text-xs font-medium text-gray-600 mb-1">
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayPosts.slice(0, 2).map(post => (
                    <div
                      key={post.id}
                      className="text-xs p-1 rounded truncate"
                      style={{ backgroundColor: `${getChannelColor(post.channel)}20` }}
                      title={post.title}
                    >
                      {post.title}
                    </div>
                  ))}
                  {dayPosts.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayPosts.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tabela de Posts */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Posts Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Canal</th>
                <th className="text-left py-3 px-4">Título</th>
                <th className="text-left py-3 px-4">Cliente</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Agendado</th>
                <th className="text-left py-3 px-4">Métricas</th>
              </tr>
            </thead>
            <tbody>
              {posts.slice(0, 10).map((post) => (
                <tr key={post.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4">
                    <Badge
                      style={{
                        backgroundColor: `${getChannelColor(post.channel)}20`,
                        color: getChannelColor(post.channel),
                      }}
                    >
                      {post.channel}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-medium">{post.title}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {post.client?.name || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(post.status)}>
                      {post.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {post.scheduled_at
                      ? new Date(post.scheduled_at).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {post.metrics && post.metrics[0] ? (
                      <div className="flex gap-3 text-xs">
                        <span>❤️ {post.metrics[0].likes}</span>
                        <span>💬 {post.metrics[0].comments}</span>
                        <span>🔄 {post.metrics[0].shares}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Criar Post - Placeholder */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Novo Post</h3>
              <p className="text-sm text-gray-600 mb-4">
                Formulário de criação em desenvolvimento
              </p>
              <Button onClick={() => setShowCreateModal(false)}>Fechar</Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
