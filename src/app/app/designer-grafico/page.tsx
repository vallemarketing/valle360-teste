'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Palette,
  FileImage,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Image as ImageIcon,
  Layout,
  Layers,
  Type,
  Download,
  Upload,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Calendar,
  User,
  Folder,
  BarChart3,
} from 'lucide-react';

interface DesignProject {
  id: string;
  title: string;
  client: string;
  type: 'logo' | 'banner' | 'post' | 'flyer' | 'branding' | 'illustration' | 'infographic';
  status: 'briefing' | 'em_producao' | 'revisao_interna' | 'aguardando_aprovacao' | 'aprovado' | 'rejeitado' | 'entregue';
  deadline: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  revisions: number;
  maxRevisions: number;
  assignedTo?: string;
  createdAt: string;
  briefingNotes?: string;
}

interface Approval {
  id: string;
  projectTitle: string;
  client: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  feedbackDate?: string;
  feedback?: string;
  imagePreview?: string;
}

export default function DesignerGraficoPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<'projects' | 'approvals' | 'briefings'>('projects');

  const projects: DesignProject[] = [
    {
      id: '1',
      title: 'Logo Nova Marca',
      client: 'Cliente A - Restaurante',
      type: 'logo',
      status: 'em_producao',
      deadline: '15/11/2025',
      priority: 'alta',
      revisions: 1,
      maxRevisions: 3,
      assignedTo: 'João Silva',
      createdAt: '01/11/2025',
      briefingNotes: 'Logo moderno, cores quentes, conceito de família',
    },
    {
      id: '2',
      title: 'Banner Black Friday',
      client: 'Cliente B - Loja Online',
      type: 'banner',
      status: 'aguardando_aprovacao',
      deadline: '08/11/2025',
      priority: 'urgente',
      revisions: 0,
      maxRevisions: 2,
      assignedTo: 'João Silva',
      createdAt: '03/11/2025',
    },
    {
      id: '3',
      title: 'Posts Instagram - Novembro',
      client: 'Cliente C - Consultoria',
      type: 'post',
      status: 'em_producao',
      deadline: '10/11/2025',
      priority: 'media',
      revisions: 0,
      maxRevisions: 2,
      assignedTo: 'João Silva',
      createdAt: '02/11/2025',
    },
    {
      id: '4',
      title: 'Flyer Evento Corporativo',
      client: 'Cliente D - Academia',
      type: 'flyer',
      status: 'briefing',
      deadline: '20/11/2025',
      priority: 'baixa',
      revisions: 0,
      maxRevisions: 2,
      createdAt: '05/11/2025',
      briefingNotes: 'Evento fitness, tons de verde e azul, incluir data e local',
    },
    {
      id: '5',
      title: 'Identidade Visual Completa',
      client: 'Cliente A - Restaurante',
      type: 'branding',
      status: 'revisao_interna',
      deadline: '25/11/2025',
      priority: 'alta',
      revisions: 2,
      maxRevisions: 3,
      assignedTo: 'João Silva',
      createdAt: '28/10/2025',
    },
  ];

  const approvals: Approval[] = [
    {
      id: '1',
      projectTitle: 'Banner Black Friday',
      client: 'Cliente B - Loja Online',
      submittedDate: '05/11/2025',
      status: 'pending',
    },
    {
      id: '2',
      projectTitle: 'Post Instagram - Promoção',
      client: 'Cliente A - Restaurante',
      submittedDate: '04/11/2025',
      status: 'approved',
      feedbackDate: '05/11/2025',
      feedback: 'Perfeito! Adoramos a arte.',
    },
    {
      id: '3',
      projectTitle: 'Flyer Inauguração',
      client: 'Cliente C - Consultoria',
      submittedDate: '03/11/2025',
      status: 'rejected',
      feedbackDate: '04/11/2025',
      feedback: 'Mudar cores para tons mais sóbrios e aumentar tamanho da fonte do título.',
    },
  ];

  const filteredProjects = selectedFilter === 'all'
    ? projects
    : projects.filter(p => p.status === selectedFilter);

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const briefingsPending = projects.filter(p => p.status === 'briefing');
  const inProductionCount = projects.filter(p => ['em_producao', 'revisao_interna'].includes(p.status)).length;
  const urgentCount = projects.filter(p => p.priority === 'urgente').length;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; color: string }> = {
      briefing: { label: 'Briefing', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      em_producao: { label: 'Em Produção', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' },
      revisao_interna: { label: 'Revisão Interna', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' },
      aguardando_aprovacao: { label: 'Aguardando Aprovação', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200' },
      aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' },
      rejeitado: { label: 'Rejeitado', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' },
      entregue: { label: 'Entregue', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200' },
    };
    const variant = variants[status] || variants.briefing;
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
      case 'logo':
        return <Palette className="w-4 h-4" />;
      case 'banner':
        return <Layout className="w-4 h-4" />;
      case 'post':
        return <ImageIcon className="w-4 h-4" />;
      case 'flyer':
        return <FileImage className="w-4 h-4" />;
      case 'branding':
        return <Layers className="w-4 h-4" />;
      case 'illustration':
        return <Palette className="w-4 h-4" />;
      case 'infographic':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <ImageIcon className="w-4 h-4" />;
    }
  };

  const getApprovalStatusBadge = (status: string) => {
    const variants = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
      approved: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: <ThumbsUp className="w-3 h-3" /> },
      rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-700', icon: <ThumbsDown className="w-3 h-3" /> },
    };
    const variant = variants[status as keyof typeof variants];
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard - Designer Gráfico</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestão de briefings, produção e aprovações de peças gráficas
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
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Em Produção</p>
                <p className="text-3xl font-bold text-blue-600">{inProductionCount}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Peças ativas</p>
              </div>
              <Palette className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-amber-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">Aguardando Aprovação</p>
                <p className="text-3xl font-bold text-primary">{pendingApprovals.length}</p>
                <p className="text-xs text-primary dark:text-amber-400 mt-1">Do cliente</p>
              </div>
              <Eye className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Briefings Pendentes</p>
                <p className="text-3xl font-bold text-gray-600">{briefingsPending.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">A iniciar</p>
              </div>
              <MessageSquare className="w-10 h-10 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300 mb-1">Urgentes</p>
                <p className="text-3xl font-bold text-red-600">{urgentCount}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Requer atenção</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500" />
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
          <Layers className="w-4 h-4 mr-2" />
          Projetos ({projects.length})
        </Button>
        <Button
          variant={selectedTab === 'approvals' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('approvals')}
          className={selectedTab === 'approvals' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <Eye className="w-4 h-4 mr-2" />
          Aprovações ({pendingApprovals.length})
        </Button>
        <Button
          variant={selectedTab === 'briefings' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('briefings')}
          className={selectedTab === 'briefings' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Briefings ({briefingsPending.length})
        </Button>
      </div>

      {selectedTab === 'projects' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Peças em Produção</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Acompanhe o progresso de todas as peças gráficas
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
                  variant={selectedFilter === 'em_producao' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('em_producao')}
                  className={selectedFilter === 'em_producao' ? 'bg-primary' : ''}
                >
                  Em Produção
                </Button>
                <Button
                  size="sm"
                  variant={selectedFilter === 'aguardando_aprovacao' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('aguardando_aprovacao')}
                  className={selectedFilter === 'aguardando_aprovacao' ? 'bg-primary' : ''}
                >
                  Aguardando
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
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Prazo: {project.deadline}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{project.assignedTo || 'Não atribuído'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Type className="w-3 h-3" />
                              <span className="capitalize">{project.type}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>Revisões: {project.revisions}/{project.maxRevisions}</span>
                            </div>
                          </div>
                          {project.briefingNotes && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                              <p className="text-xs text-blue-800 dark:text-blue-200">
                                📝 {project.briefingNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Folder className="w-3 h-3 mr-2" />
                        Ver Arquivos
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Upload className="w-3 h-3 mr-2" />
                        Upload Versão
                      </Button>
                      <Button size="sm" className="flex-1 bg-primary hover:bg-[#1260b5]">
                        Atualizar Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'approvals' && (
        <Card className="border-2 border-amber-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-amber-900 dark:text-amber-200">Aprovações Pendentes</CardTitle>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Peças aguardando feedback do cliente
                </p>
              </div>
              <Badge className="bg-primary text-white text-lg px-3 py-1">
                {pendingApprovals.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvals.map((approval) => (
                <Card key={approval.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{approval.projectTitle}</h3>
                            {getApprovalStatusBadge(approval.status)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{approval.client}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Enviado: {approval.submittedDate}</span>
                            </div>
                            {approval.feedbackDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Feedback: {approval.feedbackDate}</span>
                              </div>
                            )}
                          </div>
                          {approval.feedback && (
                            <div className={`mt-2 p-2 rounded border ${
                              approval.status === 'approved'
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}>
                              <p className={`text-xs ${
                                approval.status === 'approved'
                                  ? 'text-green-800 dark:text-green-200'
                                  : 'text-red-800 dark:text-red-200'
                              }`}>
                                💬 {approval.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {approval.status === 'pending' && (
                        <Button size="sm" className="bg-primary hover:bg-[#1260b5]">
                          Ver Detalhes
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'briefings' && (
        <Card>
          <CardHeader>
            <CardTitle>Briefings Recebidos</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Novos projetos aguardando início da produção
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {briefingsPending.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                        {getTypeIcon(project.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{project.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{project.client}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Prazo: {project.deadline}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Criado: {project.createdAt}</span>
                          </div>
                        </div>
                        {project.briefingNotes && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">Briefing:</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">{project.briefingNotes}</p>
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-3 h-3 mr-2" />
                            Iniciar Produção
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="w-3 h-3 mr-2" />
                            Solicitar Mais Informações
                          </Button>
                        </div>
                      </div>
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
            <CardTitle>Banco de Artes</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Biblioteca de assets e templates
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200">
                <Folder className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">248</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Assets Salvos</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200">
                <Layout className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">42</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Templates</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Aprovadas</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border border-amber-200">
                <Download className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">3.2 GB</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Armazenamento</p>
              </div>
            </div>
            <Button className="w-full mt-4 bg-primary hover:bg-[#1260b5]">
              <Folder className="w-4 h-4 mr-2" />
              Acessar Banco de Artes
            </Button>
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
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Peças Entregues</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">34/40</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Taxa de Aprovação</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">92%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Média de Revisões</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">1.2</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '40%' }}></div>
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
