'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Upload,
  Users,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Image as ImageIcon,
  Video,
  FileText,
  BarChart3,
  Target,
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  type: 'image' | 'video' | 'carousel' | 'story';
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'Twitter';
  scheduledDate: string;
  scheduledTime: string;
  status: 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'rejected';
  client: string;
  preview?: string;
  caption?: string;
}

interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  engagement_rate: number;
  followers_growth: number;
}

export default function SocialMediaPage() {
  const [selectedClient, setSelectedClient] = useState('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  const clients = [
    { id: 'all', name: 'Todos os Clientes' },
    { id: 'cliente-a', name: 'Cliente A - Restaurante' },
    { id: 'cliente-b', name: 'Cliente B - Loja Online' },
    { id: 'cliente-c', name: 'Cliente C - Consultoria' },
    { id: 'cliente-d', name: 'Cliente D - Academia' },
  ];

  const posts: Post[] = [
    {
      id: '1',
      title: 'Post Instagram - Lançamento Novo Produto',
      type: 'carousel',
      platform: 'Instagram',
      scheduledDate: '15/11/2025',
      scheduledTime: '10:00',
      status: 'pending_approval',
      client: 'Cliente A - Restaurante',
      caption: 'Conheça nosso novo prato! 🍽️ Feito com ingredientes frescos...',
    },
    {
      id: '2',
      title: 'Story - Promoção de Fim de Semana',
      type: 'story',
      platform: 'Instagram',
      scheduledDate: '16/11/2025',
      scheduledTime: '09:00',
      status: 'pending_approval',
      client: 'Cliente A - Restaurante',
    },
    {
      id: '3',
      title: 'Carrossel LinkedIn - Cases de Sucesso',
      type: 'carousel',
      platform: 'LinkedIn',
      scheduledDate: '17/11/2025',
      scheduledTime: '14:00',
      status: 'approved',
      client: 'Cliente C - Consultoria',
    },
    {
      id: '4',
      title: 'Reels - Dicas de Treino',
      type: 'video',
      platform: 'Instagram',
      scheduledDate: '18/11/2025',
      scheduledTime: '16:00',
      status: 'scheduled',
      client: 'Cliente D - Academia',
    },
    {
      id: '5',
      title: 'Post Motivacional Segunda-feira',
      type: 'image',
      platform: 'Facebook',
      scheduledDate: '18/11/2025',
      scheduledTime: '08:00',
      status: 'scheduled',
      client: 'Cliente B - Loja Online',
    },
  ];

  const metrics: EngagementMetrics = {
    likes: 2487,
    comments: 456,
    shares: 892,
    reach: 45234,
    engagement_rate: 8.5,
    followers_growth: 234,
  };

  const filteredPosts = selectedClient === 'all'
    ? posts
    : posts.filter(p => p.client.includes(selectedClient));

  const pendingApprovals = filteredPosts.filter(p => p.status === 'pending_approval');
  const scheduledPosts = filteredPosts.filter(p => p.status === 'scheduled' || p.status === 'approved');

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram':
        return <Instagram className="w-4 h-4" />;
      case 'Facebook':
        return <Facebook className="w-4 h-4" />;
      case 'LinkedIn':
        return <Linkedin className="w-4 h-4" />;
      case 'Twitter':
        return <Twitter className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'carousel':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending_approval: { color: 'bg-amber-100 text-amber-700', label: 'Aguardando Aprovação' },
      approved: { color: 'bg-blue-100 text-blue-700', label: 'Aprovado' },
      scheduled: { color: 'bg-green-100 text-green-700', label: 'Agendado' },
      published: { color: 'bg-gray-100 text-gray-700', label: 'Publicado' },
      rejected: { color: 'bg-red-100 text-red-700', label: 'Rejeitado' },
    };
    const variant = variants[status as keyof typeof variants];
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard - Social Media</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestão completa de conteúdo e publicações nas redes sociais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <a href="/app/social-media/upload">
              <Upload className="w-4 h-4" />
              Agendar Postagem
            </a>
          </Button>
          <Button className="bg-primary hover:bg-[#1260b5]">
            <Plus className="w-4 h-4 mr-2" />
            Novo Post
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Selecionar Cliente</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-primary' : ''}
              >
                <FileText className="w-4 h-4 mr-2" />
                Lista
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={viewMode === 'calendar' ? 'bg-primary' : ''}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendário
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex gap-3">
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Cliente
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-amber-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">Aguardando Aprovação</p>
                <p className="text-3xl font-bold text-primary">{pendingApprovals.length}</p>
                <p className="text-xs text-primary dark:text-amber-400 mt-1">Requer atenção</p>
              </div>
              <AlertCircle className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Posts Agendados</p>
                <p className="text-3xl font-bold text-blue-600">{scheduledPosts.length}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Próximos 7 dias</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">Publicados Hoje</p>
                <p className="text-3xl font-bold text-green-600">12</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Todas as plataformas</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Métricas de Engajamento</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Últimos 7 dias - {selectedClient === 'all' ? 'Todos os clientes' : clients.find(c => c.id === selectedClient)?.name}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Relatório Completo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg border border-pink-200">
              <Heart className="w-6 h-6 mx-auto mb-2 text-pink-600" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.likes.toLocaleString()}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Curtidas</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200">
              <MessageCircle className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.comments}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Comentários</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200">
              <Share2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.shares}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Compartilhamentos</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200">
              <Eye className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{(metrics.reach / 1000).toFixed(1)}K</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Alcance</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border border-amber-200">
              <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.engagement_rate}%</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Taxa Engajamento</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-lg border border-teal-200">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-teal-600" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">+{metrics.followers_growth}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Novos Seguidores</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-amber-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-amber-900 dark:text-amber-200">Posts Pendentes de Aprovação</CardTitle>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Aguardando aprovação do cliente
              </p>
            </div>
            <Badge className="bg-primary text-white text-lg px-3 py-1">
              {pendingApprovals.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum post aguardando aprovação</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow border-amber-100">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white">
                          {getTypeIcon(post.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{post.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center gap-1">
                              {getPlatformIcon(post.platform)}
                              <span>{post.platform}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{post.scheduledDate}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{post.scheduledTime}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">{post.client}</p>
                          {post.caption && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              "{post.caption}"
                            </p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="bg-primary hover:bg-[#1260b5]">
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendário de Publicações</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Posts aprovados e agendados para publicação
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Ver Calendário Completo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduledPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 min-w-[100px]">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{post.scheduledDate}</span>
                </div>
                <div className="flex items-center gap-2 min-w-[80px]">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{post.scheduledTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                    {getPlatformIcon(post.platform)}
                  </div>
                  <Badge variant="outline">{post.platform}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {getTypeIcon(post.type)}
                  <Badge variant="outline" className="text-xs">{post.type}</Badge>
                </div>
                <span className="text-sm text-gray-900 dark:text-white flex-1">{post.title}</span>
                {getStatusBadge(post.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
