'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  TrendingUp,
  PenTool,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Star,
  Check,
  X,
  Calendar,
  ChevronLeft,
  Clock,
  FileText,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// NOSSOS SERVIÇOS - VALLE AI
// Com popups de contratação e agendamento
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

const categories = [
  { id: 'all', name: 'Todos', icon: Sparkles },
  { id: 'marketing', name: 'Marketing', icon: TrendingUp },
  { id: 'sales', name: 'Vendas', icon: Users },
  { id: 'service', name: 'Atendimento', icon: MessageSquare },
  { id: 'commercial', name: 'Comercial', icon: PenTool },
];

const services = [
  {
    id: 1,
    name: 'Social Media Pro',
    category: 'marketing',
    description: 'Gestão completa de redes sociais com planejamento estratégico',
    features: ['Planejamento mensal', 'Criação de conteúdo', 'Análise de métricas', 'Suporte 24/7'],
    price: 'R$ 2.500',
    isFeatured: true,
    recommended: true,
    recommendationReason: 'Seu engajamento pode aumentar 40%',
  },
  {
    id: 2,
    name: 'Tráfego Pago Estratégico',
    category: 'sales',
    description: 'Campanhas otimizadas para conversão máxima',
    features: ['Gestão de campanhas', 'Otimização de ROAS', 'Relatórios semanais', 'A/B Testing'],
    price: 'R$ 3.200',
    isFeatured: true,
    recommended: true,
    recommendationReason: 'ROAS estimado: 5.2x',
  },
  {
    id: 3,
    name: 'Produção de Vídeo',
    category: 'marketing',
    description: 'Criação de vídeos profissionais para redes sociais',
    features: ['Roteiro', 'Gravação', 'Edição', 'Legendas'],
    price: 'R$ 1.800',
    isFeatured: false,
    recommended: true,
    recommendationReason: 'Vídeos têm 85% mais engajamento',
  },
  {
    id: 4,
    name: 'Design Gráfico',
    category: 'marketing',
    description: 'Criação de peças visuais impactantes',
    features: ['Posts', 'Stories', 'Banners', 'Identidade visual'],
    price: 'R$ 1.500',
    isFeatured: false,
    recommended: false,
  },
  {
    id: 5,
    name: 'Copywriting Estratégico',
    category: 'sales',
    description: 'Textos persuasivos que convertem',
    features: ['Copies para ads', 'E-mail marketing', 'Landing pages', 'Scripts de venda'],
    price: 'R$ 1.200',
    isFeatured: false,
    recommended: false,
  },
  {
    id: 6,
    name: 'Consultoria de Marca',
    category: 'commercial',
    description: 'Posicionamento estratégico da sua marca',
    features: ['Análise de mercado', 'Definição de personas', 'Estratégia de comunicação', 'Plano de ação'],
    price: 'R$ 4.500',
    isFeatured: true,
    recommended: false,
  },
];

// Gerar dias do mês para o calendário
const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }
  
  return days;
};

const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  features: string[];
  price: string;
  isFeatured: boolean;
  recommended: boolean;
  recommendationReason?: string;
}

export default function ServicosPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showContractModal, setShowContractModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [contractStep, setContractStep] = useState<'terms' | 'confirm' | 'success'>('terms');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [scheduleStep, setScheduleStep] = useState<'calendar' | 'success'>('calendar');

  const filteredServices = services.filter(
    (service) => selectedCategory === 'all' || service.category === selectedCategory
  );

  const recommendedServices = filteredServices.filter((s) => s.recommended);
  const otherServices = filteredServices.filter((s) => !s.recommended);

  const calendarDays = generateCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth());

  const handleContract = (service: Service) => {
    setSelectedService(service);
    setShowContractModal(true);
    setContractStep('terms');
    setAcceptedTerms(false);
  };

  const handleSchedule = (service: Service) => {
    setSelectedService(service);
    setShowScheduleModal(true);
    setScheduleStep('calendar');
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const confirmContract = () => {
    setContractStep('success');
    // Aqui enviaria notificação para financeiro, superadmin, jurídico e operação
  };

  const confirmSchedule = () => {
    setScheduleStep('success');
    // Aqui criaria o evento no calendário
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Nossos Serviços</h1>
        <p className="text-[#001533]/60 dark:text-white/60 mt-1">
          Soluções especializadas para impulsionar seu negócio
        </p>
      </div>

      {/* Categorias - Destaque em AZUL */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all font-medium",
                isActive
                  ? "bg-[#1672d6] text-white shadow-lg shadow-[#1672d6]/30"
                  : "bg-white dark:bg-[#001533]/50 text-[#001533] dark:text-white border-2 border-[#001533]/10 dark:border-white/10 hover:border-[#1672d6]/30"
              )}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Serviços Recomendados */}
      {recommendedServices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1672d6]" />
            <h2 className="text-xl font-bold text-[#001533] dark:text-white">
              Recomendados para Você
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedServices.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-xl transition-all border-2 border-[#1672d6]/20 bg-white dark:bg-[#001533]/50"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-[#001533] dark:text-white">{service.name}</CardTitle>
                      {service.isFeatured && (
                        <Badge className="mt-2 bg-[#1672d6]/10 text-[#1672d6]">
                          <Star className="w-3 h-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-[#1672d6] font-medium mt-2 p-2 bg-[#1672d6]/10 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                    {service.recommendationReason}
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-[#001533]/60 dark:text-white/60 mb-4">
                    {service.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    {service.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-[#001533]/70 dark:text-white/70">{feature}</span>
                      </div>
                    ))}
                    {service.features.length > 3 && (
                      <p className="text-xs text-[#001533]/50 dark:text-white/50 ml-6">
                        +{service.features.length - 3} benefícios
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#001533]/10 dark:border-white/10">
                    <div>
                      <p className="text-sm text-[#001533]/60 dark:text-white/60">A partir de</p>
                      <p className="text-xl font-bold text-[#001533] dark:text-white">{service.price}</p>
                    </div>
                    <Button 
                      className="bg-[#1672d6] hover:bg-[#1260b5] text-white"
                      onClick={() => handleContract(service)}
                    >
                      Contratar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Outros Serviços */}
      {otherServices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#001533] dark:text-white">Todos os Serviços</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow border-2 border-[#001533]/10 dark:border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg text-[#001533] dark:text-white">{service.name}</CardTitle>
                    {service.isFeatured && (
                      <Badge className="bg-[#1672d6]/10 text-[#1672d6]">
                        <Star className="w-3 h-3 mr-1" />
                        Destaque
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-[#001533]/60 dark:text-white/60 mb-4">
                    {service.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    {service.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-[#001533]/70 dark:text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#001533]/10 dark:border-white/10">
                    <div>
                      <p className="text-sm text-[#001533]/60 dark:text-white/60">A partir de</p>
                      <p className="text-xl font-bold text-[#001533] dark:text-white">{service.price}</p>
                    </div>
                    <Button 
                      className="bg-[#1672d6] hover:bg-[#1260b5] text-white"
                      onClick={() => handleSchedule(service)}
                    >
                      Saiba Mais
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Contratação */}
      <AnimatePresence>
        {showContractModal && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowContractModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {contractStep === 'terms' && (
                <>
                  <div className="p-6 border-b border-[#001533]/10 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-[#001533] dark:text-white">Contratar Serviço</h2>
                        <p className="text-sm text-[#001533]/60 dark:text-white/60 mt-1">{selectedService.name}</p>
                      </div>
                      <button onClick={() => setShowContractModal(false)} className="p-2 hover:bg-[#001533]/5 rounded-lg">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="bg-[#001533]/5 dark:bg-white/5 rounded-xl p-4 mb-6 max-h-60 overflow-y-auto">
                      <h3 className="font-semibold text-[#001533] dark:text-white mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Termos de Contratação
                      </h3>
                      <div className="text-sm text-[#001533]/70 dark:text-white/70 space-y-2">
                        <p>1. O serviço contratado será iniciado em até 5 dias úteis após a confirmação do pagamento.</p>
                        <p>2. O prazo de entrega varia de acordo com o escopo do projeto, sendo definido em reunião de kickoff.</p>
                        <p>3. O cliente terá direito a 2 rodadas de revisão inclusas no valor contratado.</p>
                        <p>4. O cancelamento pode ser solicitado em até 7 dias após a contratação.</p>
                        <p>5. A Valle 360 se compromete a manter a confidencialidade de todas as informações compartilhadas.</p>
                        <p>6. O pagamento será processado conforme condições definidas na proposta comercial.</p>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer mb-6">
                      <input 
                        type="checkbox" 
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-[#001533]/30 text-[#1672d6] focus:ring-[#1672d6]"
                      />
                      <span className="text-sm text-[#001533]/70 dark:text-white/70">
                        Li e aceito os termos de contratação e autorizo a Valle 360 a prosseguir com o serviço selecionado.
                      </span>
                    </label>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowContractModal(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        disabled={!acceptedTerms}
                        className="flex-1 bg-[#1672d6] hover:bg-[#1260b5] text-white disabled:opacity-50"
                        onClick={() => setContractStep('confirm')}
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {contractStep === 'confirm' && (
                <>
                  <div className="p-6 border-b border-[#001533]/10 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-[#001533] dark:text-white">Confirmar Contratação</h2>
                        <p className="text-sm text-[#001533]/60 dark:text-white/60 mt-1">{selectedService.name}</p>
                      </div>
                      <button onClick={() => setShowContractModal(false)} className="p-2 hover:bg-[#001533]/5 rounded-lg">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="bg-[#1672d6]/5 rounded-xl p-4 mb-6">
                      <h3 className="font-semibold text-[#001533] dark:text-white mb-2">Resumo</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#001533]/60 dark:text-white/60">Serviço</span>
                          <span className="font-medium text-[#001533] dark:text-white">{selectedService.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#001533]/60 dark:text-white/60">Valor</span>
                          <span className="font-medium text-[#001533] dark:text-white">{selectedService.price}/mês</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-[#001533]/60 dark:text-white/60 mb-6 text-center">
                      Ao confirmar, sua solicitação será enviada para análise das equipes de Financeiro, Jurídico e Operações.
                    </p>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setContractStep('terms')}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Voltar
                      </Button>
                      <Button
                        className="flex-1 bg-[#1672d6] hover:bg-[#1260b5] text-white"
                        onClick={confirmContract}
                      >
                        Confirmar Contratação
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {contractStep === 'success' && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-[#001533] dark:text-white mb-2">Solicitação Enviada!</h2>
                  <p className="text-[#001533]/60 dark:text-white/60 mb-6">
                    Sua solicitação foi enviada para as equipes responsáveis. Em breve você receberá um retorno.
                  </p>
                  <Button
                    className="bg-[#1672d6] hover:bg-[#1260b5] text-white"
                    onClick={() => setShowContractModal(false)}
                  >
                    Entendi
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Agendamento (Saiba Mais) */}
      <AnimatePresence>
        {showScheduleModal && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {scheduleStep === 'calendar' && (
                <>
                  <div className="p-6 border-b border-[#001533]/10 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-[#001533] dark:text-white">Agendar Reunião</h2>
                        <p className="text-sm text-[#001533]/60 dark:text-white/60 mt-1">
                          Saiba mais sobre: {selectedService.name}
                        </p>
                      </div>
                      <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-[#001533]/5 rounded-lg">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Calendário */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <button 
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          className="p-2 hover:bg-[#001533]/5 rounded-lg"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="font-semibold text-[#001533] dark:text-white">
                          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>
                        <button 
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                          className="p-2 hover:bg-[#001533]/5 rounded-lg"
                        >
                          <ChevronRight className="w-5 h-5" />
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
                                day.isCurrentMonth ? "text-[#001533] dark:text-white" : "text-[#001533]/30",
                                isSelected && "bg-[#1672d6] text-white",
                                !isPast && !isWeekend && day.isCurrentMonth && !isSelected && "hover:bg-[#1672d6]/10",
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
                        className="mb-6"
                      >
                        <h4 className="font-medium text-[#001533] dark:text-white mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Horários disponíveis
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                          {timeSlots.map(time => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={cn(
                                "p-2 rounded-lg border-2 text-sm font-medium transition-all",
                                selectedTime === time 
                                  ? "bg-[#1672d6] text-white border-[#1672d6]" 
                                  : "border-[#001533]/10 text-[#001533] dark:text-white hover:border-[#1672d6]"
                              )}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <Button
                      disabled={!selectedDate || !selectedTime}
                      className="w-full bg-[#1672d6] hover:bg-[#1260b5] text-white disabled:opacity-50"
                      onClick={confirmSchedule}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Confirmar Agendamento
                    </Button>
                  </div>
                </>
              )}

              {scheduleStep === 'success' && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-[#001533] dark:text-white mb-2">Reunião Agendada!</h2>
                  <p className="text-[#001533]/60 dark:text-white/60 mb-2">
                    {selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {selectedTime}
                  </p>
                  <p className="text-sm text-[#001533]/50 dark:text-white/50 mb-6">
                    Você receberá um e-mail com o link do Google Meet.
                  </p>
                  <Button
                    className="bg-[#1672d6] hover:bg-[#1260b5] text-white"
                    onClick={() => setShowScheduleModal(false)}
                  >
                    Entendi
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
