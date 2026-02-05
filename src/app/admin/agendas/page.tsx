'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Video,
  MapPin,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  location?: string;
  meeting_link?: string;
  status: string;
  participants: string[];
}

export default function AgendasPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, filterType]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      if (data) {
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;
    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.event_type === filterType);
    }
    setFilteredEvents(filtered);
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      company: 'bg-blue-600',
      client_meeting: 'bg-green-600',
      internal_meeting: 'bg-purple-600',
      recording: 'bg-red-600',
      deadline: 'bg-primary',
      other: 'bg-gray-600',
    };
    return colors[type] || 'bg-gray-600';
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      company: 'Empresa',
      client_meeting: 'Reunião Cliente',
      internal_meeting: 'Reunião Interna',
      recording: 'Gravação',
      deadline: 'Prazo',
      other: 'Outro',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const todayEvents = filteredEvents.filter(e => {
    const eventDate = new Date(e.start_datetime);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  const upcomingEvents = filteredEvents.filter(e => {
    const eventDate = new Date(e.start_datetime);
    const today = new Date();
    return eventDate > today;
  }).slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-valle-blue-600 mx-auto mb-4"></div>
          <p className="text-valle-silver-600">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-valle-navy-900">Calendário Unificado</h1>
          <p className="text-valle-silver-600 mt-2">Visualize todos os eventos da equipe</p>
        </div>
        <Button className="bg-valle-blue-600 hover:bg-valle-blue-700 gap-2">
          <Plus className="w-4 h-4" />
          Novo Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-2 border-valle-silver-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-valle-navy-900">Eventos de Hoje</CardTitle>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 border border-valle-silver-300 rounded-lg bg-white text-sm"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="company">Empresa</option>
                  <option value="client_meeting">Reunião Cliente</option>
                  <option value="internal_meeting">Reunião Interna</option>
                  <option value="recording">Gravação</option>
                  <option value="deadline">Prazo</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {todayEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-valle-silver-400 mx-auto mb-3" />
                <p className="text-valle-silver-600">Nenhum evento hoje</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border-l-4 ${getEventTypeColor(event.event_type).replace('bg-', 'border-')} bg-valle-silver-50 hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-valle-navy-900">{event.title}</h3>
                          <Badge className={`${getEventTypeColor(event.event_type)} text-white text-xs`}>
                            {getEventTypeLabel(event.event_type)}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-valle-silver-600 mb-2">{event.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm text-valle-silver-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.meeting_link && (
                            <div className="flex items-center gap-1">
                              <Video className="w-4 h-4" />
                              <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="text-valle-blue-600 hover:underline">
                                Link da reunião
                              </a>
                            </div>
                          )}
                          {event.participants && event.participants.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{event.participants.length} participantes</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-valle-silver-200">
          <CardHeader>
            <CardTitle className="text-valle-navy-900">Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-8 h-8 text-valle-silver-400 mx-auto mb-2" />
                  <p className="text-sm text-valle-silver-600">Nenhum evento futuro</p>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 bg-valle-silver-50 rounded-lg hover:bg-valle-blue-50 transition-colors border border-valle-silver-200"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-valle-blue-500 to-valle-blue-700 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-col">
                        <span>{new Date(event.start_datetime).getDate()}</span>
                        <span className="text-[10px] opacity-80">
                          {new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(event.start_datetime)).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-valle-navy-900 mb-1 truncate">{event.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-valle-silver-600">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(event.start_datetime)}</span>
                        </div>
                        <Badge className={`${getEventTypeColor(event.event_type)} text-white text-xs mt-1`}>
                          {getEventTypeLabel(event.event_type)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-valle-silver-200">
        <CardHeader>
          <CardTitle className="text-valle-navy-900">Estatísticas do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{events.length}</p>
              <p className="text-sm text-valle-silver-600">Total de Eventos</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">
                {events.filter(e => e.event_type === 'client_meeting').length}
              </p>
              <p className="text-sm text-valle-silver-600">Reuniões com Clientes</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-700">
                {events.filter(e => e.event_type === 'internal_meeting').length}
              </p>
              <p className="text-sm text-valle-silver-600">Reuniões Internas</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">
                {events.filter(e => e.event_type === 'recording').length}
              </p>
              <p className="text-sm text-valle-silver-600">Gravações</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
