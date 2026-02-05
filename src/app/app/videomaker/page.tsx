'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Video,
  Calendar,
  Clock,
  FileVideo,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Film,
  Upload,
  Download,
  Folder,
  Edit3,
  Users,
  MapPin,
  Plus,
  BarChart3,
  Timer,
  HardDrive,
} from 'lucide-react';

interface VideoProject {
  id: string;
  title: string;
  client: string;
  type: 'institucional' | 'reels' | 'tutorial' | 'depoimento' | 'making_of' | 'comercial';
  deadline: string;
  status: 'planejamento' | 'gravacao' | 'edicao' | 'revisao' | 'finalizado' | 'entregue';
  progress: number;
  duration: string;
  urgent?: boolean;
  location?: string;
  recordingDate?: string;
  editor?: string;
}

interface RecordingRequest {
  id: string;
  client: string;
  date: string;
  time: string;
  type: string;
  location: string;
  duration: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export default function VideoMakerPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const projects: VideoProject[] = [
    {
      id: '1',
      title: 'Vídeo Institucional - Empresa A',
      client: 'Cliente A - Restaurante',
      type: 'institucional',
      deadline: '20/11/2025',
      status: 'edicao',
      progress: 65,
      duration: '2:30',
      editor: 'Pedro Costa',
    },
    {
      id: '2',
      title: 'Reels Black Friday - Empresa B',
      client: 'Cliente B - Loja Online',
      type: 'reels',
      deadline: '08/11/2025',
      status: 'revisao',
      progress: 85,
      duration: '0:30',
      urgent: true,
      editor: 'Pedro Costa',
    },
    {
      id: '3',
      title: 'Tutorial Produto X - Empresa C',
      client: 'Cliente C - Consultoria',
      type: 'tutorial',
      deadline: '15/11/2025',
      status: 'planejamento',
      progress: 20,
      duration: '5:00',
      recordingDate: '10/11/2025',
    },
    {
      id: '4',
      title: 'Depoimento Cliente Satisfeito',
      client: 'Cliente D - Academia',
      type: 'depoimento',
      deadline: '12/11/2025',
      status: 'gravacao',
      progress: 45,
      duration: '1:30',
      location: 'Estúdio Valle 360',
      recordingDate: '07/11/2025',
    },
    {
      id: '5',
      title: 'Making Of Campanha',
      client: 'Cliente A - Restaurante',
      type: 'making_of',
      deadline: '18/11/2025',
      status: 'finalizado',
      progress: 100,
      duration: '3:00',
      editor: 'Pedro Costa',
    },
  ];

  const recordingRequests: RecordingRequest[] = [
    {
      id: '1',
      client: 'Cliente A - Restaurante',
      date: '06/11/2025',
      time: '14:00',
      type: 'Depoimento',
      location: 'Escritório do Cliente',
      duration: '2 horas',
      status: 'confirmed',
      notes: 'Levar microfone lapela e iluminação portátil',
    },
    {
      id: '2',
      client: 'Cliente B - Loja Online',
      date: '08/11/2025',
      time: '10:00',
      type: 'Making Of',
      location: 'Estúdio Valle 360',
      duration: '4 horas',
      status: 'confirmed',
    },
    {
      id: '3',
      client: 'Cliente C - Consultoria',
      date: '12/11/2025',
      time: '16:00',
      type: 'Entrevista',
      location: 'Online (Google Meet)',
      duration: '1 hora',
      status: 'pending',
    },
    {
      id: '4',
      client: 'Cliente D - Academia',
      date: '14/11/2025',
      time: '09:00',
      type: 'Tutorial de Treino',
      location: 'Academia do Cliente',
      duration: '3 horas',
      status: 'pending',
      notes: 'Chegada 30 min antes para setup',
    },
  ];

  const filteredProjects = selectedFilter === 'all'
    ? projects
    : projects.filter(p => p.status === selectedFilter);

  const inProductionCount = projects.filter(p => ['gravacao', 'edicao', 'revisao'].includes(p.status)).length;
  const urgentCount = projects.filter(p => p.urgent).length;
  const pendingRecordingsCount = recordingRequests.filter(r => r.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; color: string }> = {
      planejamento: { label: 'Planejamento', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      gravacao: { label: 'Em Gravação', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' },
      edicao: { label: 'Em Edição', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' },
      revisao: { label: 'Em Revisão', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200' },
      finalizado: { label: 'Finalizado', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' },
      entregue: { label: 'Entregue', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200' },
    };
    const variant = variants[status] || variants.planejamento;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'institucional':
        return <Film className="w-4 h-4" />;
      case 'reels':
        return <Video className="w-4 h-4" />;
      case 'tutorial':
        return <Play className="w-4 h-4" />;
      case 'depoimento':
        return <Users className="w-4 h-4" />;
      case 'making_of':
        return <FileVideo className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const getRecordingStatusBadge = (status: string) => {
    const variants = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
      confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-700' },
      completed: { label: 'Concluído', color: 'bg-blue-100 text-blue-700' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
    };
    const variant = variants[status as keyof typeof variants];
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard - Video Maker</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestão completa de projetos e solicitações de gravação
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
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Gravação + Edição</p>
              </div>
              <Video className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-amber-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">Gravações Pendentes</p>
                <p className="text-3xl font-bold text-primary">{pendingRecordingsCount}</p>
                <p className="text-xs text-primary dark:text-amber-400 mt-1">Aguardando confirmação</p>
              </div>
              <Calendar className="w-10 h-10 text-primary" />
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
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">Finalizados</p>
                <p className="text-3xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'finalizado').length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Este mês</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Projetos em Andamento</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Acompanhe o progresso de todos os vídeos
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
                variant={selectedFilter === 'planejamento' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('planejamento')}
                className={selectedFilter === 'planejamento' ? 'bg-primary' : ''}
              >
                Planejamento
              </Button>
              <Button
                size="sm"
                variant={selectedFilter === 'edicao' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('edicao')}
                className={selectedFilter === 'edicao' ? 'bg-primary' : ''}
              >
                Em Edição
              </Button>
              <Button
                size="sm"
                variant={selectedFilter === 'revisao' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('revisao')}
                className={selectedFilter === 'revisao' ? 'bg-primary' : ''}
              >
                Em Revisão
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
                  project.urgent ? 'border-2 border-red-300 bg-red-50 dark:bg-red-900/20' : ''
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
                          {project.urgent && (
                            <Badge className="bg-red-600 text-white">URGENTE</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{project.client}</p>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Prazo: {project.deadline}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            <span>Duração: {project.duration}</span>
                          </div>
                          {project.recordingDate && (
                            <div className="flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              <span>Gravação: {project.recordingDate}</span>
                            </div>
                          )}
                          {project.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{project.location}</span>
                            </div>
                          )}
                          {project.editor && (
                            <div className="flex items-center gap-1">
                              <Edit3 className="w-3 h-3" />
                              <span>Editor: {project.editor}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Progresso: {project.progress}%
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {project.type}
                        </Badge>
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
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Folder className="w-3 h-3 mr-2" />
                        Ver Materiais
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Upload className="w-3 h-3 mr-2" />
                        Upload Arquivo
                      </Button>
                      <Button size="sm" className="flex-1 bg-primary hover:bg-[#1260b5]">
                        <Edit3 className="w-3 h-3 mr-2" />
                        Atualizar Status
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-amber-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-amber-900 dark:text-amber-200">Solicitações de Gravação</CardTitle>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Gravações agendadas e pendentes de confirmação
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Ver Calendário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recordingRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{request.type}</h3>
                          {getRecordingStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{request.client}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{request.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{request.time} ({request.duration})</span>
                          </div>
                          <div className="flex items-center gap-1 col-span-2">
                            <MapPin className="w-3 h-3" />
                            <span>{request.location}</span>
                          </div>
                        </div>
                        {request.notes && (
                          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                              📝 {request.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Confirmar
                          </Button>
                          <Button size="sm" variant="outline">
                            Reagendar
                          </Button>
                        </>
                      )}
                      {request.status === 'confirmed' && (
                        <Button size="sm" className="bg-primary hover:bg-[#1260b5]">
                          Ver Detalhes
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Arquivos e Materiais</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gestão de arquivos do mês atual
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200">
                <FileVideo className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Vídeos Brutos</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200">
                <Edit3 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Em Edição</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Finalizados</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border border-amber-200">
                <HardDrive className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">156 GB</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Armazenamento</p>
              </div>
            </div>
            <Button className="w-full mt-4 bg-primary hover:bg-[#1260b5]">
              <Folder className="w-4 h-4 mr-2" />
              Acessar Biblioteca Completa
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
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vídeos Entregues</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">18/20</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Horas de Gravação</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">42h</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Horas de Edição</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">124h</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
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
