'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Globe,
  Code,
  Smartphone,
  Monitor,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Activity,
  Zap,
  TrendingUp,
  Bug,
  Settings,
  Rocket,
  Database,
  Shield,
  Calendar,
  User,
  ExternalLink,
  GitBranch,
  BarChart3,
} from 'lucide-react';

interface WebProject {
  id: string;
  title: string;
  client: string;
  type: 'landing_page' | 'ecommerce' | 'institucional' | 'blog' | 'sistema' | 'app';
  status: 'planejamento' | 'desenvolvimento' | 'revisao' | 'testes' | 'homologacao' | 'producao' | 'manutencao';
  progress: number;
  deadline: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  technologies: string[];
  developer?: string;
  url?: string;
  repository?: string;
}

interface Ticket {
  id: string;
  title: string;
  client: string;
  type: 'bug' | 'feature' | 'improvement' | 'support';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'aberto' | 'em_andamento' | 'aguardando' | 'resolvido' | 'fechado';
  createdAt: string;
  assignedTo?: string;
  description?: string;
}

interface PerformanceMetric {
  site: string;
  client: string;
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  uptime: number;
  loadTime: number;
}

export default function WebDesignerPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<'projects' | 'tickets' | 'performance'>('projects');

  const projects: WebProject[] = [
    {
      id: '1',
      title: 'Landing Page Black Friday',
      client: 'Cliente B - Loja Online',
      type: 'landing_page',
      status: 'desenvolvimento',
      progress: 65,
      deadline: '08/11/2025',
      priority: 'urgente',
      technologies: ['Next.js', 'Tailwind', 'Vercel'],
      developer: 'Ana Lima',
      repository: 'github.com/valle/landing-bf',
    },
    {
      id: '2',
      title: 'E-commerce Completo',
      client: 'Cliente A - Restaurante',
      type: 'ecommerce',
      status: 'desenvolvimento',
      progress: 45,
      deadline: '30/11/2025',
      priority: 'alta',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      developer: 'Ana Lima',
    },
    {
      id: '3',
      title: 'Site Institucional',
      client: 'Cliente C - Consultoria',
      type: 'institucional',
      status: 'testes',
      progress: 90,
      deadline: '12/11/2025',
      priority: 'media',
      technologies: ['WordPress', 'PHP', 'MySQL'],
      developer: 'Roberto Lima',
      url: 'https://preview.cliente-c.com',
    },
    {
      id: '4',
      title: 'Sistema de Agendamentos',
      client: 'Cliente D - Academia',
      type: 'sistema',
      status: 'planejamento',
      progress: 15,
      deadline: '25/11/2025',
      priority: 'alta',
      technologies: ['Vue.js', 'Laravel', 'PostgreSQL'],
      developer: 'Ana Lima',
    },
    {
      id: '5',
      title: 'Manutenção Site Principal',
      client: 'Cliente A - Restaurante',
      type: 'institucional',
      status: 'manutencao',
      progress: 100,
      deadline: '-',
      priority: 'baixa',
      technologies: ['WordPress'],
      developer: 'Roberto Lima',
      url: 'https://cliente-a.com',
    },
  ];

  const tickets: Ticket[] = [
    {
      id: '1',
      title: 'Correção de layout mobile',
      client: 'Cliente B - Loja Online',
      type: 'bug',
      priority: 'alta',
      status: 'em_andamento',
      createdAt: '06/11/2025',
      assignedTo: 'Ana Lima',
      description: 'Menu não abre corretamente em dispositivos iOS',
    },
    {
      id: '2',
      title: 'Implementar sistema de avaliações',
      client: 'Cliente A - Restaurante',
      type: 'feature',
      priority: 'media',
      status: 'aberto',
      createdAt: '05/11/2025',
    },
    {
      id: '3',
      title: 'Otimização de velocidade',
      client: 'Cliente C - Consultoria',
      type: 'improvement',
      priority: 'baixa',
      status: 'aguardando',
      createdAt: '04/11/2025',
      assignedTo: 'Roberto Lima',
      description: 'Comprimir imagens e lazy loading',
    },
    {
      id: '4',
      title: 'Erro 404 em páginas de produto',
      client: 'Cliente B - Loja Online',
      type: 'bug',
      priority: 'urgente',
      status: 'aberto',
      createdAt: '07/11/2025',
    },
  ];

  const performanceMetrics: PerformanceMetric[] = [
    {
      site: 'cliente-a.com',
      client: 'Cliente A - Restaurante',
      performanceScore: 92,
      seoScore: 88,
      accessibilityScore: 95,
      uptime: 99.9,
      loadTime: 1.2,
    },
    {
      site: 'cliente-b.com',
      client: 'Cliente B - Loja Online',
      performanceScore: 78,
      seoScore: 82,
      accessibilityScore: 85,
      uptime: 99.5,
      loadTime: 2.8,
    },
    {
      site: 'cliente-c.com',
      client: 'Cliente C - Consultoria',
      performanceScore: 95,
      seoScore: 94,
      accessibilityScore: 98,
      uptime: 100,
      loadTime: 0.9,
    },
  ];

  const filteredProjects = selectedFilter === 'all'
    ? projects
    : projects.filter(p => p.status === selectedFilter);

  const openTickets = tickets.filter(t => t.status === 'aberto' || t.status === 'em_andamento');
  const urgentTickets = tickets.filter(t => t.priority === 'urgente');
  const inDevelopmentCount = projects.filter(p => ['desenvolvimento', 'testes'].includes(p.status)).length;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; color: string }> = {
      planejamento: { label: 'Planejamento', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      desenvolvimento: { label: 'Desenvolvimento', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' },
      revisao: { label: 'Revisão', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' },
      testes: { label: 'Em Testes', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200' },
      homologacao: { label: 'Homologação', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' },
      producao: { label: 'Produção', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' },
      manutencao: { label: 'Manutenção', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200' },
    };
    const variant = variants[status] || variants.planejamento;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgente: { label: 'URGENTE', color: 'bg-red-600 text-white' },
      alta: { label: 'Alta', color: 'bg-amber-100 text-amber-700' },
      media: { label: 'Média', color: 'bg-blue-100 text-blue-700' },
      baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
    };
    const variant = variants[priority as keyof typeof variants];
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'landing_page':
        return <Rocket className="w-4 h-4" />;
      case 'ecommerce':
        return <Globe className="w-4 h-4" />;
      case 'institucional':
        return <Monitor className="w-4 h-4" />;
      case 'blog':
        return <Code className="w-4 h-4" />;
      case 'sistema':
        return <Database className="w-4 h-4" />;
      case 'app':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getTicketTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-4 h-4" />;
      case 'feature':
        return <Zap className="w-4 h-4" />;
      case 'improvement':
        return <TrendingUp className="w-4 h-4" />;
      case 'support':
        return <Settings className="w-4 h-4" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  const getTicketStatusBadge = (status: string) => {
    const variants = {
      aberto: { label: 'Aberto', color: 'bg-red-100 text-red-700' },
      em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
      aguardando: { label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700' },
      resolvido: { label: 'Resolvido', color: 'bg-green-100 text-green-700' },
      fechado: { label: 'Fechado', color: 'bg-gray-100 text-gray-700' },
    };
    const variant = variants[status as keyof typeof variants];
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-primary';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard - Web Designer</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestão de projetos web, tickets e performance de sites
          </p>
        </div>
        <Button className="bg-primary hover:bg-[#1260b5]">
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Em Desenvolvimento</p>
                <p className="text-3xl font-bold text-blue-600">{inDevelopmentCount}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Projetos ativos</p>
              </div>
              <Code className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300 mb-1">Tickets Urgentes</p>
                <p className="text-3xl font-bold text-red-600">{urgentTickets.length}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Requer atenção</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-amber-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">Tickets Abertos</p>
                <p className="text-3xl font-bold text-primary">{openTickets.length}</p>
                <p className="text-xs text-primary dark:text-amber-400 mt-1">Manutenção</p>
              </div>
              <Wrench className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">Sites em Produção</p>
                <p className="text-3xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'producao').length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Online</p>
              </div>
              <Globe className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant={selectedTab === 'projects' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('projects')}
          className={selectedTab === 'projects' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <Globe className="w-4 h-4 mr-2" />
          Projetos ({projects.length})
        </Button>
        <Button
          variant={selectedTab === 'tickets' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('tickets')}
          className={selectedTab === 'tickets' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <Wrench className="w-4 h-4 mr-2" />
          Tickets ({openTickets.length})
        </Button>
        <Button
          variant={selectedTab === 'performance' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('performance')}
          className={selectedTab === 'performance' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <Activity className="w-4 h-4 mr-2" />
          Performance
        </Button>
      </div>

      {selectedTab === 'projects' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Projetos Web</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Acompanhe o desenvolvimento de todos os projetos
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('all')}
                  className={selectedFilter === 'all' ? 'bg-primary' : ''}
                >
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant={selectedFilter === 'desenvolvimento' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('desenvolvimento')}
                  className={selectedFilter === 'desenvolvimento' ? 'bg-primary' : ''}
                >
                  Desenvolvimento
                </Button>
                <Button
                  size="sm"
                  variant={selectedFilter === 'testes' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('testes')}
                  className={selectedFilter === 'testes' ? 'bg-primary' : ''}
                >
                  Testes
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className={`hover:shadow-md transition-shadow ${
                    project.priority === 'urgente' ? 'border-2 border-red-300 bg-red-50 dark:bg-red-900/20' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white">
                          {getTypeIcon(project.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{project.title}</h3>
                            {getPriorityBadge(project.priority)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{project.client}</p>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Prazo: {project.deadline}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{project.developer || 'Não atribuído'}</span>
                            </div>
                            {project.url && (
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Ver Site</span>
                              </a>
                            )}
                            {project.repository && (
                              <div className="flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                <span className="text-xs">{project.repository}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {project.technologies.map((tech) => (
                              <Badge key={tech} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Progresso: {project.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            project.progress === 100
                              ? 'bg-green-600'
                              : project.progress > 75
                              ? 'bg-blue-600'
                              : project.progress > 50
                              ? 'bg-primary'
                              : 'bg-yellow-600'
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'tickets' && (
        <Card className="border-2 border-amber-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-amber-900 dark:text-amber-200">Tickets de Manutenção</CardTitle>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Bugs, melhorias e solicitações de suporte
                </p>
              </div>
              <Button size="sm" className="bg-primary hover:bg-[#1260b5]">
                <Plus className="w-4 h-4 mr-2" />
                Novo Ticket
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          ticket.type === 'bug'
                            ? 'bg-gradient-to-br from-red-400 to-red-600'
                            : ticket.type === 'feature'
                            ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                            : 'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}>
                          <div className="text-white">
                            {getTicketTypeIcon(ticket.type)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{ticket.title}</h3>
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ticket.client}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{ticket.createdAt}</span>
                            </div>
                            {ticket.assignedTo && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{ticket.assignedTo}</span>
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs capitalize">
                              {ticket.type}
                            </Badge>
                          </div>
                          {ticket.description && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ticket.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getTicketStatusBadge(ticket.status)}
                        {ticket.status === 'aberto' && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Atribuir
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'performance' && (
        <Card>
          <CardHeader>
            <CardTitle>Performance dos Sites</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Métricas de velocidade, SEO e acessibilidade
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.map((metric, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{metric.site}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{metric.client}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className={`w-5 h-5 ${getScoreColor(metric.performanceScore)}`} />
                        <span className={`text-2xl font-bold ${getScoreColor(metric.performanceScore)}`}>
                          {metric.performanceScore}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200">
                        <Zap className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                        <p className={`text-lg font-bold ${getScoreColor(metric.performanceScore)}`}>
                          {metric.performanceScore}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Performance</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200">
                        <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-600" />
                        <p className={`text-lg font-bold ${getScoreColor(metric.seoScore)}`}>
                          {metric.seoScore}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">SEO</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200">
                        <Shield className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                        <p className={`text-lg font-bold ${getScoreColor(metric.accessibilityScore)}`}>
                          {metric.accessibilityScore}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Acessibilidade</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border border-amber-200">
                        <CheckCircle className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold text-primary">
                          {metric.uptime}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Uptime</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Tempo de Carregamento: <span className="font-bold">{metric.loadTime}s</span>
                      </span>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3 h-3 mr-2" />
                        Ver Relatório Completo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Deploy Tracking</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Últimos deploys realizados
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { site: 'cliente-a.com', status: 'success', time: 'Há 2 horas', branch: 'main' },
                { site: 'cliente-b.com', status: 'success', time: 'Há 5 horas', branch: 'main' },
                { site: 'preview.cliente-c.com', status: 'building', time: 'Agora', branch: 'develop' },
              ].map((deploy, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      deploy.status === 'success' ? 'bg-green-600' : 'bg-primary animate-pulse'
                    }`} />
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{deploy.site}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{deploy.time} • {deploy.branch}</p>
                    </div>
                  </div>
                  <Badge className={deploy.status === 'success' ? 'bg-green-600' : 'bg-primary'}>
                    {deploy.status === 'success' ? 'Live' : 'Building'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas do Mês</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Novembro 2025
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Projetos Entregues</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">4/5</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tickets Resolvidos</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">28/32</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87.5%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Performance Média</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">88/100</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-2">
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Relatório Completo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
