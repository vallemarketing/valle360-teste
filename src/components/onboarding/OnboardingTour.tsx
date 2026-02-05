'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingStep } from './OnboardingStep';

interface OnboardingTourProps {
  userType: 'client' | 'employee' | 'admin';
  onComplete: () => void;
  onSkip?: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  content?: React.ReactNode;
}

const TOUR_STEPS: Record<string, TourStep[]> = {
  client: [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Valle 360!',
      description: 'Seu portal exclusivo para acompanhar todos os serviços de marketing.',
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Visualize métricas, insights e o progresso das suas campanhas.',
    },
    {
      id: 'approvals',
      title: 'Aprovações',
      description: 'Aprove ou solicite alterações nos conteúdos criados para você.',
    },
    {
      id: 'financial',
      title: 'Financeiro',
      description: 'Acompanhe suas faturas e realize pagamentos de forma simples.',
    },
    {
      id: 'messages',
      title: 'Mensagens',
      description: 'Comunique-se diretamente com nossa equipe.',
    },
  ],
  employee: [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Valle 360!',
      description: 'Sua central de produtividade e gestão de tarefas.',
    },
    {
      id: 'kanban',
      title: 'Kanban',
      description: 'Gerencie suas tarefas de forma visual e organizada.',
    },
    {
      id: 'clients',
      title: 'Clientes',
      description: 'Acesse informações e arquivos de cada cliente.',
    },
    {
      id: 'gamification',
      title: 'Gamificação',
      description: 'Acompanhe seus pontos, conquistas e posição no ranking.',
    },
    {
      id: 'val',
      title: 'Val - Assistente IA',
      description: 'Sua assistente virtual para ajudar nas tarefas do dia a dia.',
    },
  ],
  admin: [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Painel Admin!',
      description: 'Central de controle completa da agência.',
    },
    {
      id: 'intelligence',
      title: 'Centro de Inteligência',
      description: 'Insights, previsões e análises em tempo real.',
    },
    {
      id: 'commercial',
      title: 'Comercial',
      description: 'Prospecção, propostas e gestão de contratos.',
    },
    {
      id: 'operations',
      title: 'Operações',
      description: 'Gerencie equipe, tarefas e produtividade.',
    },
    {
      id: 'financial',
      title: 'Financeiro',
      description: 'Faturamento, cobranças e relatórios.',
    },
  ],
};

export function OnboardingTour({ userType, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  const steps = TOUR_STEPS[userType] || TOUR_STEPS.client;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    setCompletedSteps(prev => [...prev, currentStepData.id]);
    
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1672d6] to-[#0d4f8c] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#001533] dark:text-white">
                Tour Guiado
              </h2>
              <p className="text-sm text-gray-500">
                Passo {currentStep + 1} de {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="h-full bg-gradient-to-r from-[#1672d6] to-[#0d4f8c]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepData.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <OnboardingStep
                step={currentStep + 1}
                title={currentStepData.title}
                description={currentStepData.description}
                isActive={true}
                isCompleted={completedSteps.includes(currentStepData.id)}
              >
                {currentStepData.content}
              </OnboardingStep>
            </motion.div>
          </AnimatePresence>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 pt-4">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`
                  w-2 h-2 rounded-full transition-all
                  ${index === currentStep 
                    ? 'w-6 bg-[#1672d6]' 
                    : completedSteps.includes(step.id)
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }
                `}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Pular tour
          </button>
          
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Concluir
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default OnboardingTour;
