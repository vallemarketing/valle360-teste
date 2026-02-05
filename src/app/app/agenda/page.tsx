'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Video, Users, Calendar, MapPin, Link as LinkIcon, Bell, Repeat, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: 'meeting' | 'deadline' | 'recording' | 'company_event' | 'client_meeting' | 'other';
  startDatetime: Date;
  endDatetime: Date;
  allDay: boolean;
  location?: string;
  meetingLink?: string;
  organizer: string;
  participants: string[];
  clientName?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  reminders: number[];
  isRecurring: boolean;
  recurrenceRule?: string;
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Reunião de Alinhamento Semanal',
      description: 'Revisar progresso da semana e definir prioridades',
      eventType: 'meeting',
      startDatetime: new Date('2025-11-15T10:00:00'),
      endDatetime: new Date('2025-11-15T11:00:00'),
      allDay: false,
      location: 'Sala de Reuniões 1',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      organizer: 'João Silva',
      participants: ['Maria Santos', 'Pedro Costa', 'Ana Lima'],
      status: 'confirmed',
      reminders: [15, 60],
      isRecurring: true,
      recurrenceRule: 'Todas as segundas-feiras às 10h',
    },
    {
      id: '2',
      title: 'Apresentação Projeto Cliente A',
      description: 'Apresentar propostas de campanha para o cliente',
      eventType: 'client_meeting',
      startDatetime: new Date('2025-11-15T14:00:00'),
      endDatetime: new Date('2025-11-15T15:30:00'),
      allDay: false,
      location: 'Escritório do Cliente',
      meetingLink: 'https://zoom.us/j/123456789',
      organizer: 'Carlos Souza',
      participants: ['Ana Lima', 'João Silva'],
      clientName: 'Cliente A - Restaurante',
      status: 'scheduled',
      reminders: [30, 120],
      isRecurring: false,
    },
    {
      id: '3',
      title: 'Gravação de Vídeo Institucional',
      description: 'Gravação do vídeo institucional para Cliente B',
      eventType: 'recording',
      startDatetime: new Date('2025-11-16T09:00:00'),
      endDatetime: new Date('2025-11-16T12:00:00'),
      allDay: false,
      location: 'Estúdio Valle 360',
      organizer: 'Pedro Costa',
      participants: ['Julia Alves'],
      clientName: 'Cliente B - Loja Online',
      status: 'confirmed',
      reminders: [60, 1440],
      isRecurring: false,
    },
    {
      id: '4',
      title: 'Webinar: Marketing Digital 2025',
      description: 'Webinar sobre tendências de marketing digital para 2025',
      eventType: 'company_event',
      startDatetime: new Date('2025-11-16T16:00:00'),
      endDatetime: new Date('2025-11-16T17:30:00'),
      allDay: false,
      meetingLink: 'https://youtube.com/live/valle360',
      organizer: 'Fernanda Reis',
      participants: ['Toda a Equipe'],
      status: 'scheduled',
      reminders: [60],
      isRecurring: false,
    },
    {
      id: '5',
      title: 'Prazo: Entrega Campanha Black Friday',
      description: 'Data limite para entrega de todas as peças da campanha',
      eventType: 'deadline',
      startDatetime: new Date('2025-11-20T18:00:00'),
      endDatetime: new Date('2025-11-20T18:00:00'),
      allDay: true,
      organizer: 'Ana Lima',
      participants: ['João Silva', 'Maria Santos', 'Pedro Costa'],
      status: 'scheduled',
      reminders: [1440, 4320],
      isRecurring: false,
    },
  ];

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
      case 'client_meeting':
        return <Users className="w-4 h-4" />;
      case 'recording':
        return <Video className="w-4 h-4" />;
      case 'company_event':
        return <Calendar className="w-4 h-4" />;
      case 'deadline':
        return <Clock className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
      case 'client_meeting':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
      case 'recording':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200';
      case 'company_event':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200';
      case 'deadline':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-600">Confirmado</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-600">Agendado</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-600">Cancelado</Badge>;
      case 'completed':
        return <Badge className="bg-gray-600">Concluído</Badge>;
      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getRemindersText = (reminders: number[]) => {
    return reminders
      .map((minutes) => {
        if (minutes < 60) return `${minutes}min antes`;
        if (minutes === 60) return '1h antes';
        if (minutes < 1440) return `${minutes / 60}h antes`;
        return `${minutes / 1440} dia(s) antes`;
      })
      .join(', ');
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Agenda</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie eventos, reuniões e compromissos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            Hoje
          </Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="ml-4 flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="h-8"
            >
              Mês
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="h-8"
            >
              Semana
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="h-8"
            >
              Dia
            </Button>
          </div>
          <Button className="bg-primary hover:bg-[#1260b5] ml-2">
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${getEventTypeColor(event.eventType)}`}>
                    {getEventTypeIcon(event.eventType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <CardTitle className="text-lg mb-1">{event.title}</CardTitle>
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                        )}
                      </div>
                      {getStatusBadge(event.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>
                            {formatDate(event.startDatetime)}
                            {event.allDay
                              ? ' (Dia inteiro)'
                              : ` • ${formatTime(event.startDatetime)} - ${formatTime(event.endDatetime)}`}
                          </span>
                        </div>

                        {event.location && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        {event.meetingLink && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <LinkIcon className="w-4 h-4 text-gray-500" />
                            <a
                              href={event.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                            >
                              Link da Reunião
                            </a>
                          </div>
                        )}

                        {event.clientName && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{event.clientName}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Organizador:</p>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">{event.organizer}</p>
                        </div>

                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Participantes:</p>
                          <div className="flex flex-wrap gap-1">
                            {event.participants.map((participant, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {participant}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {event.reminders.length > 0 && (
                          <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <Bell className="w-4 h-4 text-gray-500 mt-0.5" />
                            <span className="text-xs">{getRemindersText(event.reminders)}</span>
                          </div>
                        )}

                        {event.isRecurring && event.recurrenceRule && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Repeat className="w-4 h-4 text-gray-500" />
                            <span className="text-xs">{event.recurrenceRule}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm">
                  Editar
                </Button>
                <Button variant="outline" size="sm">
                  Cancelar
                </Button>
                {event.meetingLink && (
                  <Button size="sm" className="bg-primary hover:bg-[#1260b5]">
                    Entrar na Reunião
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
