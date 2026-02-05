"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Check,
  LayoutDashboard,
  Brain,
  FileCheck,
  MessageCircle,
  TrendingUp,
  Calendar,
  CreditCard,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================
// GUIDED TOUR - VALLE AI
// Tour guiado completo para primeira visita
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

interface TourStep {
  id: string;
  title: string;
  description: string;
  details: string[];
  icon: React.ReactNode;
  tip?: string;
}

export type GuidedTourVariant = "admin" | "client" | "employee";

function storageKeyForVariant(variant: GuidedTourVariant) {
  return `valle_tour_completed:${variant}`;
}

const CLIENT_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo à Valle 360! 🎉",
    description: "Estamos muito felizes em ter você conosco! Vamos fazer um tour rápido para você conhecer todas as funcionalidades disponíveis.",
    details: [
      "Este tour levará apenas 2 minutos",
      "Você pode pular a qualquer momento",
      "Pode refazer o tour nas configurações"
    ],
    icon: <Sparkles className="size-8 text-white" />,
    tip: "Dica: Use o menu (☰) e a barra inferior no mobile para navegar"
  },
  {
    id: "dashboard",
    title: "Seu Dashboard Personalizado",
    description: "O dashboard é sua central de comando. Aqui você acompanha tudo sobre suas campanhas em tempo real.",
    details: [
      "📊 Métricas de desempenho (impressões, cliques, conversões)",
      "💰 Acompanhamento de investimento e ROI",
      "🎯 Cards interativos que levam a análises detalhadas",
      "⚡ Ações rápidas para as tarefas mais comuns"
    ],
    icon: <LayoutDashboard className="size-8 text-white" />,
    tip: "Dica: Clique nos cards de métricas para ver detalhes"
  },
  {
    id: "intelligence",
    title: "Central de Inteligência",
    description: "Acesse análises profundas e insights exclusivos gerados pela nossa IA para impulsionar seus resultados.",
    details: [
      "📈 Desempenho: métricas detalhadas das suas campanhas",
      "📰 Seu Setor: notícias e tendências do seu mercado",
      "🎯 Concorrentes: análise competitiva atualizada",
      "🧠 Insights da Val: recomendações personalizadas da IA"
    ],
    icon: <Brain className="size-8 text-white" />,
    tip: "Dica: A Val analisa seus dados e gera insights automaticamente"
  },
  {
    id: "approvals",
    title: "Aprovações de Materiais",
    description: "Revise e aprove todos os materiais criados pela nossa equipe antes da publicação.",
    details: [
      "🖼️ Visualize posts, stories, vídeos e banners",
      "✅ Aprove com um clique ou solicite ajustes",
      "💬 Deixe comentários para a equipe",
      "📱 Veja como ficará em cada rede social"
    ],
    icon: <FileCheck className="size-8 text-white" />,
    tip: "Dica: Aprove no prazo para manter suas campanhas em dia"
  },
  {
    id: "messages",
    title: "Mensagens e Comunicação",
    description: "Mantenha contato direto com toda a equipe Valle 360 em um só lugar.",
    details: [
      "💬 Chat em tempo real com sua equipe",
      "👥 Grupos por projeto ou área",
      "📎 Envie arquivos e documentos",
      "⭐ Avalie o atendimento após cada conversa"
    ],
    icon: <MessageCircle className="size-8 text-white" />,
    tip: "Dica: Ative as notificações para não perder mensagens importantes"
  },
  {
    id: "evolution",
    title: "Sua Evolução",
    description: "Acompanhe o progresso das suas métricas desde que entrou no time Valle 360.",
    details: [
      "📊 Gráficos de evolução mensal",
      "🏆 Comparativo antes x depois",
      "📈 Crescimento em seguidores e engajamento",
      "💹 ROI acumulado ao longo do tempo"
    ],
    icon: <TrendingUp className="size-8 text-white" />,
    tip: "Dica: Compartilhe esses resultados com sua equipe"
  },
  {
    id: "schedule",
    title: "Agenda de Reuniões",
    description: "Gerencie todas as suas reuniões e compromissos com a equipe Valle 360.",
    details: [
      "📅 Visualize reuniões agendadas",
      "🔄 Reagende com facilidade",
      "🔔 Receba lembretes automáticos",
      "📹 Links do Google Meet integrados"
    ],
    icon: <Calendar className="size-8 text-white" />,
    tip: "Dica: Você recebe lembretes 1 hora e 10 minutos antes"
  },
  {
    id: "financial",
    title: "Financeiro e Créditos",
    description: "Gerencie faturas, pagamentos e créditos de forma simples e transparente.",
    details: [
      "💳 Pague faturas online (Pix, Cartão, Boleto)",
      "📄 Histórico completo de faturas",
      "💰 Adicione créditos para serviços extras",
      "🧾 Baixe notas fiscais"
    ],
    icon: <CreditCard className="size-8 text-white" />,
    tip: "Dica: Pague em dia e ganhe pontos no Valle Club"
  },
  {
    id: "val",
    title: "Conheça a Val, sua Assistente IA",
    description: "A Val está sempre disponível para tirar suas dúvidas e ajudar no que precisar.",
    details: [
      "🤖 Disponível 24/7 no botão flutuante",
      "💡 Tire dúvidas sobre suas campanhas",
      "📊 Peça análises e relatórios",
      "🎯 Receba sugestões personalizadas"
    ],
    icon: <Sparkles className="size-8 text-white" />,
    tip: "Dica: Clique no botão da Val no canto inferior direito"
  },
  {
    id: "finish",
    title: "Pronto para Começar! 🚀",
    description: "Você já conhece as principais funcionalidades. Agora é só explorar e aproveitar!",
    details: [
      "✨ Explore o dashboard e as métricas",
      "✅ Confira se há materiais para aprovar",
      "💬 Envie uma mensagem para a equipe",
      "🎯 Visite a Central de Inteligência"
    ],
    icon: <Check className="size-8 text-white" />,
    tip: "Precisando de ajuda? A Val está sempre disponível!"
  },
];

const EMPLOYEE_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo(a)! 🚀",
    description: "Esse tour é rápido e vai te mostrar onde ficam as partes mais importantes do seu trabalho diário.",
    details: [
      "Tour de 1–2 minutos",
      "Você pode pular a qualquer momento",
      "Pode refazer depois nas configurações",
    ],
    icon: <Sparkles className="size-8 text-white" />,
    tip: "Dica: No desktop use o menu lateral; no mobile use o botão de menu."
  },
  {
    id: "dashboard",
    title: "Dashboard da sua Área",
    description: "Aqui você vê prioridades, KPIs e alertas do que precisa atenção agora.",
    details: [
      "📌 Ações rápidas (Kanban, Mensagens, Agenda)",
      "📈 Indicadores específicos da sua área",
      "🧠 Insights e alertas assistidos por IA",
    ],
    icon: <LayoutDashboard className="size-8 text-white" />,
    tip: "Dica: Use o Kanban como sua central de execução."
  },
  {
    id: "kanban",
    title: "Kanban (Demandas)",
    description: "Organize tarefas por status e acompanhe prazos, aprovações e responsáveis.",
    details: [
      "🧩 Arraste cards entre colunas",
      "⏱️ SLA e prioridades",
      "💬 Comentários e anexos",
    ],
    icon: <FileCheck className="size-8 text-white" />,
    tip: "Dica: Abra um card para ver detalhes e histórico."
  },
  {
    id: "messages",
    title: "Mensagens",
    description: "Fale com cliente e equipe em tempo real, mantendo tudo registrado por projeto.",
    details: [
      "💬 Conversas por contexto",
      "📎 Arquivos e links",
      "🔔 Notificações para não perder prazos",
    ],
    icon: <MessageCircle className="size-8 text-white" />,
    tip: "Dica: Use @menções para agilizar aprovações."
  },
  {
    id: "ia",
    title: "Val e IA por Área",
    description: "Use a Val para acelerar decisões, relatórios e próximos passos — com contexto da sua área.",
    details: [
      "✨ Sugestões e insights",
      "📝 Resumos e relatórios rápidos",
      "🎯 Próximas ações recomendadas",
    ],
    icon: <Brain className="size-8 text-white" />,
    tip: "Dica: Quanto mais contexto você der, melhor a recomendação."
  },
  {
    id: "finish",
    title: "Pronto! ✅",
    description: "Você já pode começar. Se quiser, explore sua área e seu Kanban agora.",
    details: [
      "🧭 Abra sua área no menu",
      "📌 Confira prioridades no Dashboard",
      "💬 Alinhe pelo chat quando necessário",
    ],
    icon: <Check className="size-8 text-white" />,
    tip: "Se precisar, a Val fica no canto para ajudar."
  },
];

const ADMIN_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo(a), Admin! 👑",
    description: "Esse tour foca no que você usa para operar a plataforma: clientes, equipe, inteligência e automações.",
    details: [
      "Tour de 2–3 minutos",
      "Pode pular a qualquer momento",
      "Refaça depois nas configurações",
    ],
    icon: <Sparkles className="size-8 text-white" />,
    tip: "Dica: Use o menu lateral para navegar por módulos."
  },
  {
    id: "dashboard",
    title: "Dashboard & Operação",
    description: "Visão geral do sistema e atalhos para rotinas do dia.",
    details: [
      "📊 Indicadores do negócio",
      "📌 Alertas operacionais",
      "⚡ Atalhos para ações frequentes",
    ],
    icon: <LayoutDashboard className="size-8 text-white" />,
  },
  {
    id: "intelligence",
    title: "Inteligência & Preditivo",
    description: "Insights de performance e sinais de risco para agir antes do problema virar impacto.",
    details: [
      "🧠 Centro de Inteligência",
      "📈 Analytics preditivo",
      "🎯 Recomendações acionáveis",
    ],
    icon: <Brain className="size-8 text-white" />,
  },
  {
    id: "social",
    title: "Social (Post Center)",
    description: "Agendamento de postagens com padrão unificado e rastreabilidade.",
    details: [
      "📅 Agenda de posts",
      "✅ Fluxos de aprovação",
      "📌 Organização por cliente/canal",
    ],
    icon: <Calendar className="size-8 text-white" />,
    tip: "Dica: Social/Head também têm acesso ao Post Center; Designer não."
  },
  {
    id: "finance",
    title: "Financeiro",
    description: "Acompanhe pagamentos, relatórios e saúde financeira.",
    details: [
      "💳 Cobranças e faturas",
      "🧾 Relatórios",
      "📌 Pendências e alertas",
    ],
    icon: <CreditCard className="size-8 text-white" />,
  },
  {
    id: "finish",
    title: "Pronto! ✅",
    description: "Agora você está no controle. Vamos operar.",
    details: [
      "👥 Revise clientes e colaboradores",
      "📊 Monitore performance e preditivo",
      "🧠 Use a Val para acelerar decisões",
    ],
    icon: <Check className="size-8 text-white" />,
  },
];

function stepsForVariant(variant: GuidedTourVariant): TourStep[] {
  switch (variant) {
    case "admin":
      return ADMIN_TOUR_STEPS;
    case "employee":
      return EMPLOYEE_TOUR_STEPS;
    case "client":
    default:
      return CLIENT_TOUR_STEPS;
  }
}

export function GuidedTour({ variant = "client" }: { variant?: GuidedTourVariant }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const tourSteps = useMemo(() => stepsForVariant(variant), [variant]);

  useEffect(() => {
    // Verificar se é a primeira visita
    const hasSeenTour = localStorage.getItem(storageKeyForVariant(variant));
    if (!hasSeenTour) {
      // Esperar um pouco para o dashboard carregar
      setTimeout(() => setIsOpen(true), 2000);
    }
  }, [variant]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  const completeTour = () => {
    localStorage.setItem(storageKeyForVariant(variant), "true");
    setIsOpen(false);
    setCurrentStep(0);
  };

  const skipTour = () => {
    localStorage.setItem(storageKeyForVariant(variant), "true");
    setIsOpen(false);
    setCurrentStep(0);
  };

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay escuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={skipTour}
          />

          {/* Modal do Tour */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg">
              <div
                className="bg-white dark:bg-[#0a0f1a] rounded-2xl shadow-2xl overflow-hidden border border-[#001533]/10 dark:border-white/10 flex flex-col"
                style={{
                  maxHeight: 'min(90vh, 720px)',
                  paddingBottom: 'env(safe-area-inset-bottom)',
                }}
              >
              
              {/* Header com ícone e botão fechar */}
              <div className="bg-gradient-to-br from-[#001533] to-[#1672d6] p-6 relative">
                {/* Botão Fechar */}
                <button
                  onClick={skipTour}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  title="Fechar tour"
                >
                  <X className="size-5 text-white" />
                </button>

                {/* Ícone animado */}
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="size-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-4"
                >
                  {step.icon}
                </motion.div>
                
                {/* Barra de progresso */}
                <div className="w-full bg-white/20 rounded-full h-2 mb-3">
                  <motion.div
                    className="bg-white h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Indicadores de etapas clicáveis */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {tourSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToStep(index)}
                      className={cn(
                        "h-2 rounded-full transition-all cursor-pointer hover:opacity-80",
                        index === currentStep 
                          ? "w-6 bg-white" 
                          : index < currentStep 
                            ? "w-2 bg-white/80" 
                            : "w-2 bg-white/30"
                      )}
                      title={`Ir para etapa ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Conteúdo (rolável para não cortar em telas menores) */}
              <div className="p-6 overflow-y-auto flex-1 min-h-0 pr-2">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Título */}
                  <h3 className="text-xl font-bold text-[#001533] dark:text-white mb-2">
                    {step.title}
                  </h3>
                  
                  {/* Descrição */}
                  <p className="text-[#001533]/70 dark:text-white/70 mb-4">
                    {step.description}
                  </p>

                  {/* Lista de detalhes */}
                  <div className="bg-[#001533]/5 dark:bg-white/5 rounded-xl p-4 mb-4">
                    <ul className="space-y-2">
                      {step.details.map((detail, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="text-sm text-[#001533]/80 dark:text-white/80 flex items-start gap-2"
                        >
                          <span>{detail}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Dica */}
                  {step.tip && (
                    <div className="flex items-start gap-2 p-3 bg-[#1672d6]/10 rounded-lg border border-[#1672d6]/20">
                      <Sparkles className="size-4 text-[#1672d6] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-[#1672d6] font-medium">{step.tip}</p>
                    </div>
                  )}
                </motion.div>

                {/* Contador de etapas */}
                <p className="text-sm text-[#001533]/50 dark:text-white/50 mt-4 text-center">
                  Etapa {currentStep + 1} de {tourSteps.length}
                </p>
              </div>

              {/* Footer com botões de navegação grandes */}
              <div className="px-6 pb-6 space-y-4 flex-shrink-0">
                {/* Botões de setas grandes */}
                <div className="flex items-center justify-center gap-4">
                  {/* Seta Voltar */}
                  <button
                    onClick={handlePrev}
                    disabled={isFirstStep}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                      "border-2 border-[#001533]/20 dark:border-white/20",
                      isFirstStep 
                        ? "opacity-30 cursor-not-allowed" 
                        : "hover:border-[#1672d6] hover:bg-[#1672d6]/10 hover:scale-110"
                    )}
                  >
                    <ChevronLeft className="size-7 text-[#001533] dark:text-white" />
                  </button>
                  
                  {/* Contador central */}
                  <div className="text-center px-4">
                    <p className="text-lg font-bold text-[#001533] dark:text-white">
                      {currentStep + 1} / {tourSteps.length}
                    </p>
                  </div>
                  
                  {/* Seta Próximo */}
                  <button
                    onClick={handleNext}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                      isLastStep
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-[#1672d6] hover:bg-[#1260b5]",
                      "hover:scale-110"
                    )}
                  >
                    {isLastStep ? (
                      <Check className="size-7 text-white" />
                    ) : (
                      <ChevronRight className="size-7 text-white" />
                    )}
                  </button>
                </div>

                {/* Botões de texto (explícitos) */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={isFirstStep}
                    className="h-11 px-4 rounded-xl border-[#001533]/20 dark:border-white/20"
                  >
                    Anterior
                  </Button>

                  <Button
                    onClick={handleNext}
                    className={cn(
                      "h-11 px-5 rounded-xl",
                      isLastStep ? "bg-emerald-500 hover:bg-emerald-600" : "bg-[#1672d6] hover:bg-[#1260b5]"
                    )}
                  >
                    {isLastStep ? "Começar" : "Próximo"}
                  </Button>
                </div>

                {/* Rodapé auxiliar */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={skipTour}
                    className="text-sm text-[#001533]/50 dark:text-white/50 hover:text-[#001533] dark:hover:text-white transition-colors"
                  >
                    Pular tour
                  </button>
                  
                  <p className="text-sm text-[#001533]/50 dark:text-white/50">
                    {isLastStep ? "Tudo pronto para começar" : "Use Próximo/Anterior para navegar"}
                  </p>
                </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Botão para reiniciar o tour (usar em configurações)
export function RestartTourButton() {
  // Mantém compatibilidade: se não passar variant, reinicia o tour do cliente.
  // (Esse botão pode ser usado em configurações específicas por persona futuramente.)
  const handleRestart = () => {
    localStorage.removeItem(storageKeyForVariant("client"));
    localStorage.removeItem(storageKeyForVariant("admin"));
    localStorage.removeItem(storageKeyForVariant("employee"));
    window.location.reload();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestart}
      className="border-[#1672d6]/30 text-[#1672d6] hover:bg-[#1672d6]/10"
    >
      <Sparkles className="size-4 mr-2" />
      Refazer Tour Guiado
    </Button>
  );
}
