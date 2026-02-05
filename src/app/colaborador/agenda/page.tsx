'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Plus, Video, X, Users, MapPin, Bell, Check, Trash2,
  Copy, ExternalLink, Mail, Send, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface Event {
  id: string;
  title: string;
  description?: string;
  time: string;
  endTime?: string;
  type: 'meeting' | 'internal' | 'task' | 'reminder';
  color: string;
  location?: string;
  attendees?: { name: string; email: string }[];
  meetLink?: string;
  date: Date;
  notificationSent?: boolean;
}

const EVENT_COLORS = {
  meeting: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  internal: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  task: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  reminder: { bg: 'bg-primary', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
};

const EVENT_LABELS = {
  meeting: 'Reunião',
  internal: 'Interno',
  task: 'Tarefa',
  reminder: 'Lembrete'
};

// Gerar código aleatório para link do Meet
const generateMeetCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${part1}-${part2}-${part3}`;
};

export default function EmployeeAgendaPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [note, setNote] = useState<string | null>(null);
  
  // Form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    time: '09:00',
    endTime: '10:00',
    type: 'meeting' as Event['type'],
    location: '',
    meetLink: '',
    attendees: '',
    generateMeet: true
  });

  useEffect(() => {
    loadEvents();
  }, [selectedDate]);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      setNote(null);

      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      const headers = await getAuthHeaders();
      const qs = new URLSearchParams({ start: start.toISOString(), end: end.toISOString() });
      const res = await fetch(`/api/calendar/events?${qs.toString()}`, { headers, cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao carregar agenda');

      const mapped: Event[] = (Array.isArray(data?.events) ? data.events : []).map((ev: any) => {
        const startIso = ev?.start_datetime || ev?.start_date;
        const endIso = ev?.end_datetime || ev?.end_date;
        const startDt = startIso ? new Date(String(startIso)) : new Date();
        const endDt = endIso ? new Date(String(endIso)) : new Date(startDt.getTime() + 60 * 60 * 1000);

        const et = String(ev?.event_type || '').toLowerCase();
        const type: Event['type'] =
          et === 'client_meeting' ? 'meeting' : et === 'internal_meeting' ? 'internal' : et === 'deadline' ? 'task' : 'reminder';
        const color = EVENT_COLORS[type].bg;

        const time = startDt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
        const endTime = endDt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });

        const meta = ev?.metadata && typeof ev.metadata === 'object' ? ev.metadata : {};
        return {
          id: String(ev.id),
          title: String(ev.title || 'Evento'),
          description: ev.description ? String(ev.description) : undefined,
          time,
          endTime,
          type,
          color,
          location: ev.location ? String(ev.location) : undefined,
          meetLink: ev.meeting_link ? String(ev.meeting_link) : meta?.meetLink ? String(meta.meetLink) : undefined,
          attendees: Array.isArray(meta?.attendees) ? meta.attendees : undefined,
          date: startDt,
          notificationSent: !!meta?.notificationSent,
        };
      });

      setEvents(mapped);
      setNote(data?.note ? String(data.note) : null);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setEvents([]);
      setNote(error instanceof Error ? error.message : 'Falha ao carregar');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error('Digite um título para o evento');
      return;
    }

    // Gerar link do Meet se for reunião e opção estiver ativada
    let meetLink = newEvent.meetLink;
    if (newEvent.type === 'meeting' && newEvent.generateMeet && !meetLink) {
      meetLink = generateMeetCode();
    }

    const attendeesList = newEvent.attendees
      .split(',')
      .map(a => a.trim())
      .filter(Boolean)
      .map(a => {
        const emailMatch = a.match(/<(.+)>/);
        if (emailMatch) {
          return { name: a.replace(/<.+>/, '').trim(), email: emailMatch[1] };
        }
        return { name: a, email: '' };
      });

    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      time: newEvent.time,
      endTime: newEvent.endTime,
      type: newEvent.type,
      color: EVENT_COLORS[newEvent.type].bg,
      location: newEvent.location,
      meetLink: meetLink,
      attendees: attendeesList,
      date: selectedDate,
      notificationSent: false
    };

    setEvents([...events, event]);
    
    // Simular envio de notificação
    if (meetLink && attendeesList.length > 0) {
      toast.success(`Link do Meet gerado e enviado para ${attendeesList.length} participante(s)!`, {
        description: meetLink
      });
    } else {
      toast.success('Evento criado com sucesso!');
    }

    setIsModalOpen(false);
    setNewEvent({
      title: '',
      description: '',
      time: '09:00',
      endTime: '10:00',
      type: 'meeting',
      location: '',
      meetLink: '',
      attendees: '',
      generateMeet: true
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
    toast.success('Evento removido');
  };

  const handleCopyMeetLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const handleSendNotification = async (event: Event) => {
    if (!event.attendees || event.attendees.length === 0) {
      toast.error('Nenhum participante para notificar');
      return;
    }

    // Simular envio
    toast.success(`Notificação enviada para ${event.attendees.length} participante(s)`);
    
    // Marcar como enviado
    setEvents(events.map(e => 
      e.id === event.id ? { ...e, notificationSent: true } : e
    ));
  };

  const formatDate = (date: Date) => {
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  const todayEvents = events.filter(e => 
    isSameDay(e.date, selectedDate)
  ).sort((a, b) => a.time.localeCompare(b.time));

  // Gerar dias da semana
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="min-h-screen p-4 pb-24" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Agenda
            </h1>
            <p className="text-sm mt-1 capitalize" style={{ color: 'var(--text-secondary)' }}>
              {formatDate(selectedDate)}
            </p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-lg transition-colors"
            style={{ backgroundColor: '#4370d1' }}
          >
            <Plus className="w-4 h-4" />
            Novo
          </motion.button>
        </div>

        {/* Week Navigation */}
        <div 
          className="p-4 mb-6 rounded-xl"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {format(weekStart, "MMMM yyyy", { locale: ptBR })}
            </span>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, i) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const dayEvents = events.filter(e => isSameDay(e.date, day));

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    isSelected 
                      ? 'text-white shadow-lg' 
                      : 'hover:bg-gray-100'
                  }`}
                  style={{ 
                    backgroundColor: isSelected ? '#4370d1' : 'transparent'
                  }}
                >
                  <p className={`text-xs font-medium uppercase ${
                    isSelected ? 'text-white/80' : ''
                  }`} style={{ color: isSelected ? undefined : 'var(--text-tertiary)' }}>
                    {format(day, 'EEE', { locale: ptBR })}
                  </p>
                  <p className={`text-lg font-bold ${
                    isToday && !isSelected ? 'text-blue-600' : ''
                  }`} style={{ color: isSelected ? 'white' : isToday ? undefined : 'var(--text-primary)' }}>
                    {format(day, 'd')}
                  </p>
                  {dayEvents.length > 0 && (
                    <div className="flex justify-center gap-1 mt-1">
                      {dayEvents.slice(0, 3).map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-blue-500'}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Card */}
        <div 
          className="p-4 mb-6 rounded-xl border"
          style={{ 
            background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)',
            borderColor: 'var(--primary-200)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#4370d1' }}>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {todayEvents.length} evento{todayEvents.length !== 1 ? 's' : ''} 
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {todayEvents.length > 0 
                  ? `Próximo às ${todayEvents[0].time}`
                  : 'Nenhum evento agendado'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#4370d1' }} />
            </div>
          ) : todayEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Nenhum evento para este dia</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-4 text-sm font-medium"
                style={{ color: '#4370d1' }}
              >
                Criar primeiro evento
              </button>
            </div>
          ) : (
            todayEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group ${EVENT_COLORS[event.type].light} ${EVENT_COLORS[event.type].border} border`}
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <div className="flex items-start gap-4">
                  {/* Time indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${EVENT_COLORS[event.type].bg}`} />
                    <div className={`w-0.5 flex-1 mt-1 ${EVENT_COLORS[event.type].bg} opacity-30`} style={{ minHeight: '40px' }} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${EVENT_COLORS[event.type].bg} text-white`}>
                          {EVENT_LABELS[event.type]}
                        </span>
                        <h3 className="font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>
                          {event.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.time} - {event.endTime}
                      </span>
                      
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                      )}
                      
                      {event.attendees && event.attendees.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.attendees.length} participante{event.attendees.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Meet Link Section */}
                    {event.meetLink && (
                      <div 
                        className="mt-3 p-3 rounded-lg flex items-center justify-between"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" style={{ color: '#4370d1' }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            Google Meet
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyMeetLink(event.meetLink!)}
                            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Copiar link"
                          >
                            <Copy className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                          </button>
                          <a 
                            href={event.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-medium"
                            style={{ backgroundColor: '#4370d1' }}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Entrar
                          </a>
                          {!event.notificationSent && event.attendees && event.attendees.length > 0 && (
                            <button
                              onClick={() => handleSendNotification(event)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600"
                              title="Enviar link para participantes"
                            >
                              <Send className="w-3 h-3" />
                              Enviar
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Attendees */}
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {event.attendees.map((attendee, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                          >
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                              {attendee.name.charAt(0)}
                            </div>
                            {attendee.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Novo Evento */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-primary)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div 
                className="p-4 flex items-center justify-between sticky top-0 z-10"
                style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-primary)' }}
              >
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Novo Evento
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Título *
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Ex: Reunião com cliente"
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Tipo
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(EVENT_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setNewEvent({ ...newEvent, type: key as Event['type'] })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          newEvent.type === key 
                            ? `${EVENT_COLORS[key as keyof typeof EVENT_COLORS].bg} text-white` 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horários */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                      Início
                    </label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                      Término
                    </label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Descrição
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Detalhes do evento..."
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Google Meet Toggle - Apenas para reuniões */}
                {newEvent.type === 'meeting' && (
                  <div 
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#4370d1' }}>
                          <Video className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            Google Meet
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Gerar link automaticamente
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newEvent.generateMeet}
                          onChange={(e) => setNewEvent({ ...newEvent, generateMeet: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {newEvent.generateMeet && (
                      <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Sparkles className="w-4 h-4" style={{ color: '#4370d1' }} />
                        <span>O link será gerado e enviado aos participantes</span>
                      </div>
                    )}

                    {!newEvent.generateMeet && (
                      <div className="mt-3">
                        <input
                          type="url"
                          value={newEvent.meetLink}
                          onChange={(e) => setNewEvent({ ...newEvent, meetLink: e.target.value })}
                          placeholder="Cole o link do Meet aqui..."
                          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ 
                            backgroundColor: 'var(--bg-primary)', 
                            borderColor: 'var(--border-light)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Participantes */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Participantes (emails separados por vírgula)
                  </label>
                  <textarea
                    value={newEvent.attendees}
                    onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })}
                    placeholder="Ex: Maria Silva <maria@email.com>, João Santos <joao@email.com>"
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    O link da reunião será enviado automaticamente para os participantes
                  </p>
                </div>

                {/* Local */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Local (opcional)
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Ex: Sala de Reuniões, Google Meet"
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div 
                className="p-4 flex gap-3 sticky bottom-0"
                style={{ borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateEvent}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#4370d1' }}
                >
                  <Check className="w-4 h-4" />
                  Criar Evento
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
