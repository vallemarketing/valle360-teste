'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Video,
  Users,
  Clock,
  CheckCircle,
  Star,
  CalendarDays,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// AGENDA - COM CALENDÁRIO PARA REAGENDAR
// Inclui modal de confirmação e estrutura de notificações
// ============================================

type TabType = 'eventos' | 'reunioes' | 'disponibilidade';

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  type: 'evento' | 'webinar' | 'workshop';
  description: string;
  spots?: number;
  registered: boolean;
}

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  attendees: string[];
  status: 'confirmed' | 'pending' | 'completed';
  link?: string;
}

// Gerar dias do mês
const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  
  // Dias do mês anterior para preencher a primeira semana
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }
  
  // Dias do mês atual
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  
  // Dias do próximo mês para completar
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }
  
  return days;
};

const timeSlots = [
  '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
];

export default function ClienteAgendaPage() {
  const [activeTab, setActiveTab] = useState<TabType>('reunioes');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const events: Event[] = [
    {
      id: 1,
      title: 'Webinar: Estratégias de Marketing 2025',
      date: '2025-12-20',
      time: '14:00 - 15:30',
      type: 'webinar',
      description: 'Descubra as tendências de marketing para o próximo ano',
      spots: 150,
      registered: true,
    },
    {
      id: 2,
      title: 'Workshop: Design de Conteúdo',
      date: '2025-12-25',
      time: '16:00 - 18:00',
      type: 'workshop',
      description: 'Aprenda técnicas avançadas de design para redes sociais',
      spots: 50,
      registered: false,
    },
  ];

  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: 1,
      title: 'Reunião de Alinhamento Mensal',
      date: '2025-12-15',
      time: '10:00 - 11:00',
      attendees: ['Guilherme', 'Gestor Valle', 'Designer'],
      status: 'confirmed',
      link: 'https://meet.google.com/abc-defg-hij',
    },
    {
      id: 2,
      title: 'Apresentação de Resultados',
      date: '2025-12-18',
      time: '14:00 - 15:00',
      attendees: ['Guilherme', 'Analista de Performance'],
      status: 'pending',
    },
    {
      id: 3,
      title: 'Review de Campanha',
      date: '2025-12-10',
      time: '16:00 - 17:00',
      attendees: ['Guilherme', 'Gestor Valle'],
      status: 'completed',
    },
  ]);

  const tabs = [
    { id: 'reunioes' as TabType, label: 'Suas Reuniões', icon: Users },
    { id: 'eventos' as TabType, label: 'Eventos Valle', icon: Star },
    { id: 'disponibilidade' as TabType, label: 'Agendar', icon: CalendarDays },
  ];

  const getMeetingStatusBadge = (status: Meeting['status']) => {
    const config = {
      confirmed: { label: 'Confirmada', className: 'bg-emerald-100 text-emerald-700' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
      completed: { label: 'Concluída', className: 'bg-gray-100 text-gray-700' },
    };
    return <Badge className={config[status].className}>{config[status].label}</Badge>;
  };

  const calendarDays = generateCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth());
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const handleReschedule = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowRescheduleModal(true);
  };

  const handleConfirmMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowConfirmModal(true);
  };

  const confirmReschedule = () => {
    if (selectedMeeting && selectedDate && selectedTime) {
      setMeetings(prev => prev.map(m => 
        m.id === selectedMeeting.id 
          ? { ...m, date: selectedDate.toISOString().split('T')[0], time: `${selectedTime} - ${parseInt(selectedTime) + 1}:00`, status: 'confirmed' as const }
          : m
      ));
      setShowRescheduleModal(false);
      setSelectedDate(null);
      setSelectedTime(null);
      // Aqui enviaria notificações por email e WhatsApp
    }
  };

  const confirmMeeting = () => {
    if (selectedMeeting) {
      setMeetings(prev => prev.map(m => 
        m.id === selectedMeeting.id ? { ...m, status: 'confirmed' as const } : m
      ));
      setShowConfirmModal(false);
      setSelectedMeeting(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Agenda</h1>
        <p className="text-[#001533]/60 dark:text-white/60 mt-2">
          Eventos exclusivos, reuniões e horários disponíveis
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all",
                isActive
                  ? "bg-[#1672d6] text-white shadow-lg"
                  : "bg-white dark:bg-[#001533]/50 text-[#001533] dark:text-white hover:bg-[#001533]/5 dark:hover:bg-white/10 border-2 border-[#001533]/10 dark:border-white/10"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Reuniões */}
      {activeTab === 'reunioes' && (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <Card key={meeting.id} className="border-2 border-[#001533]/10 dark:border-white/10 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[#001533] dark:text-white">
                        {meeting.title}
                      </h3>
                      {getMeetingStatusBadge(meeting.status)}
                    </div>
                    <div className="space-y-2 text-sm text-[#001533]/60 dark:text-white/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(meeting.date).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {meeting.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {meeting.attendees.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                {meeting.link && meeting.status === 'confirmed' && (
                  <Button className="w-full bg-[#1672d6] hover:bg-[#1260b5] text-white">
                    <Video className="w-4 h-4 mr-2" />
                    Entrar na Reunião
                  </Button>
                )}

                {meeting.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleConfirmMeeting(meeting)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-[#001533]/20"
                      onClick={() => handleReschedule(meeting)}
                    >
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Reagendar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Eventos */}
      {activeTab === 'eventos' && (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id} className="border-2 border-[#001533]/10 dark:border-white/10 hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {event.type === 'webinar' && <Video className="w-5 h-5 text-[#1672d6]" />}
                    {event.type === 'workshop' && <Star className="w-5 h-5 text-[#1672d6]" />}
                    {event.type === 'evento' && <Users className="w-5 h-5 text-[#1672d6]" />}
                    <CardTitle className="text-base">{event.title}</CardTitle>
                  </div>
                </div>
                <p className="text-sm text-[#001533]/60 dark:text-white/60">{event.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-[#001533]/70 dark:text-white/70">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#001533]/50" />
                    {new Date(event.date).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#001533]/50" />
                    {event.time}
                  </div>
                </div>

                {event.registered ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      Você está inscrito!
                    </span>
                  </div>
                ) : (
                  <Button className="w-full bg-[#1672d6] hover:bg-[#1260b5] text-white">
                    Inscrever-se
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Disponibilidade para Agendar */}
      {activeTab === 'disponibilidade' && (
        <Card className="border-2 border-[#001533]/10 dark:border-white/10">
          <CardHeader>
            <CardTitle>Agendar Nova Reunião</CardTitle>
            <p className="text-sm text-[#001533]/60 dark:text-white/60 mt-2">
              Escolha uma data e horário para agendar com seu gestor
            </p>
          </CardHeader>
          <CardContent>
            {/* Calendário */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-[#001533]/5 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-[#001533]/70" />
                </button>
                <h3 className="font-semibold text-[#001533] dark:text-white">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-[#001533]/5 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-[#001533]/70" />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-[#001533]/50 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === day.date.toDateString();
                  const isPast = day.date < new Date(new Date().setHours(0,0,0,0));
                  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                  
                  return (
                    <button
                      key={index}
                      disabled={isPast || !day.isCurrentMonth || isWeekend}
                      onClick={() => setSelectedDate(day.date)}
                      className={cn(
                        "aspect-square rounded-lg text-sm transition-all",
                        day.isCurrentMonth ? "text-[#001533] dark:text-white" : "text-[#001533]/30 dark:text-white/30",
                        isToday && "ring-2 ring-[#1672d6]",
                        isSelected && "bg-[#1672d6] text-white",
                        !isPast && !isWeekend && day.isCurrentMonth && !isSelected && "hover:bg-[#1672d6]/10 cursor-pointer",
                        (isPast || isWeekend) && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      {day.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horários */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h4 className="font-medium text-[#001533] dark:text-white mb-3">
                  Horários disponíveis para {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                </h4>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-sm font-medium transition-all",
                        selectedTime === time 
                          ? "bg-[#1672d6] text-white border-[#1672d6]" 
                          : "border-[#001533]/10 text-[#001533] dark:text-white hover:border-[#1672d6]"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>

                <Button 
                  disabled={!selectedTime}
                  className="w-full bg-[#1672d6] hover:bg-[#1260b5] text-white"
                >
                  Confirmar Agendamento
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Reagendamento */}
      <AnimatePresence>
        {showRescheduleModal && selectedMeeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowRescheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0a0f1a] rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#001533] dark:text-white">Reagendar Reunião</h2>
                <button onClick={() => setShowRescheduleModal(false)} className="p-2 hover:bg-[#001533]/5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-[#001533]/60 dark:text-white/60 mb-4">
                Reagendando: <span className="font-medium text-[#001533] dark:text-white">{selectedMeeting.title}</span>
              </p>

              {/* Mini Calendário */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-1 hover:bg-[#001533]/5 rounded"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-medium text-sm">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-1 hover:bg-[#001533]/5 rounded"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-center py-1 text-[#001533]/50">{d}</div>
                  ))}
                  {calendarDays.slice(0, 35).map((day, index) => {
                    const isSelected = selectedDate?.toDateString() === day.date.toDateString();
                    const isPast = day.date < new Date(new Date().setHours(0,0,0,0));
                    
                    return (
                      <button
                        key={index}
                        disabled={isPast || !day.isCurrentMonth}
                        onClick={() => setSelectedDate(day.date)}
                        className={cn(
                          "aspect-square rounded text-xs",
                          isSelected && "bg-[#1672d6] text-white",
                          !isPast && day.isCurrentMonth && !isSelected && "hover:bg-[#1672d6]/10",
                          (isPast || !day.isCurrentMonth) && "opacity-30"
                        )}
                      >
                        {day.date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horários */}
              {selectedDate && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Horário:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "p-2 rounded text-xs font-medium border transition-all",
                          selectedTime === time 
                            ? "bg-[#1672d6] text-white border-[#1672d6]" 
                            : "border-[#001533]/10 hover:border-[#1672d6]"
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notificações */}
              <div className="bg-[#1672d6]/5 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-[#001533] dark:text-white mb-2">Lembretes automáticos:</p>
                <div className="space-y-1 text-xs text-[#001533]/60">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    <span>Email 1 hora e 10 minutos antes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    <span>WhatsApp 1 hora e 10 minutos antes</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={confirmReschedule}
                disabled={!selectedDate || !selectedTime}
                className="w-full bg-[#1672d6] hover:bg-[#1260b5] text-white"
              >
                Confirmar Reagendamento
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação */}
      <AnimatePresence>
        {showConfirmModal && selectedMeeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0a0f1a] rounded-2xl p-6 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              
              <h2 className="text-xl font-bold text-[#001533] dark:text-white mb-2">Confirmar Reunião?</h2>
              <p className="text-[#001533]/60 dark:text-white/60 mb-4">
                {selectedMeeting.title}<br/>
                {new Date(selectedMeeting.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}<br/>
                às {selectedMeeting.time}
              </p>

              <div className="bg-[#1672d6]/5 rounded-lg p-3 mb-4 text-left">
                <p className="text-xs text-[#001533]/60">
                  Você receberá lembretes por email e WhatsApp 1 hora e 10 minutos antes da reunião.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={confirmMeeting}
                >
                  Confirmar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
