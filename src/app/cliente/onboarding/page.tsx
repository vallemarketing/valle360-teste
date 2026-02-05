'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Target, 
  Building2, 
  Instagram, 
  Users, 
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// Componentes dos passos
import { StepWelcome } from '@/components/onboarding/steps/StepWelcome';
import { StepSegment } from '@/components/onboarding/steps/StepSegment';
import { StepInstagram } from '@/components/onboarding/steps/StepInstagram';
import { StepCompetitors } from '@/components/onboarding/steps/StepCompetitors';
import { StepGoals } from '@/components/onboarding/steps/StepGoals';

const STEPS = [
  { id: 1, title: 'Boas-vindas', icon: Sparkles, description: 'Defina seus objetivos' },
  { id: 2, title: 'Seu Negócio', icon: Building2, description: 'Conte sobre sua empresa' },
  { id: 3, title: 'Instagram', icon: Instagram, description: 'Conecte sua conta' },
  { id: 4, title: 'Concorrentes', icon: Users, description: 'Monitore o mercado' },
  { id: 5, title: 'Metas', icon: TrendingUp, description: 'Defina suas metas' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>({
    objectives: [],
    segment: '',
    industry: '',
    instagram_connected: false,
    instagram_username: '',
    competitors: [],
    goals: []
  });

  useEffect(() => {
    loadOnboarding();
  }, []);

  const loadOnboarding = async () => {
    try {
      const response = await fetch('/api/client/onboarding');
      const data = await response.json();
      
      if (data.success) {
        if (data.isComplete) {
          // Onboarding já completo, redirecionar para dashboard
          router.push('/cliente/dashboard');
          return;
        }
        
        // Carregar dados existentes
        if (data.onboarding) {
          setOnboardingData({
            objectives: data.onboarding.objectives || [],
            segment: data.onboarding.segment || '',
            industry: data.onboarding.industry || '',
            instagram_connected: data.onboarding.instagram_connected || false,
            instagram_username: data.onboarding.instagram_username || '',
            competitors: data.onboarding.competitors || [],
            goals: []
          });
          setCurrentStep(Math.max(1, (data.onboarding.step_completed || 0) + 1));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepData = (stepData: any) => {
    setOnboardingData((prev: any) => ({ ...prev, ...stepData }));
  };

  const saveStep = async (step: number, data: any) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/client/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, data: { ...onboardingData, ...data } })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return true;
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    const saved = await saveStep(currentStep, onboardingData);
    if (saved) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        // Onboarding completo
        toast.success('🎉 Configuração concluída! Bem-vindo ao Valle 360!');
        router.push('/cliente/dashboard');
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    try {
      await fetch('/api/client/onboarding', { method: 'PATCH' });
      toast.info('Você pode configurar depois em Configurações');
      router.push('/cliente/dashboard');
    } catch (error) {
      console.error('Erro ao pular:', error);
    }
  };

  const progress = (currentStep / 5) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#001533] to-[#1672d6]">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Preparando sua experiência...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001533] via-[#0a2a4d] to-[#1672d6]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#1672d6]" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Valle 360</h1>
                <p className="text-white/60 text-sm">Configuração Inicial</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Pular por agora
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      currentStep > step.id 
                        ? 'bg-green-500 text-white' 
                        : currentStep === step.id 
                          ? 'bg-white text-[#1672d6]' 
                          : 'bg-white/20 text-white/60'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 hidden md:block ${
                    currentStep >= step.id ? 'text-white' : 'text-white/40'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div 
                    className={`flex-1 h-1 mx-2 rounded ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-44 pb-32 px-4">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl">
                <CardContent className="p-8">
                  {currentStep === 1 && (
                    <StepWelcome 
                      data={onboardingData}
                      onChange={handleStepData}
                    />
                  )}
                  {currentStep === 2 && (
                    <StepSegment 
                      data={onboardingData}
                      onChange={handleStepData}
                    />
                  )}
                  {currentStep === 3 && (
                    <StepInstagram 
                      data={onboardingData}
                      onChange={handleStepData}
                    />
                  )}
                  {currentStep === 4 && (
                    <StepCompetitors 
                      data={onboardingData}
                      onChange={handleStepData}
                    />
                  )}
                  {currentStep === 5 && (
                    <StepGoals 
                      data={onboardingData}
                      onChange={handleStepData}
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            
            <div className="text-white/60 text-sm">
              {currentStep} de 5
            </div>
            
            <Button
              onClick={handleNext}
              disabled={isSaving}
              className="bg-white text-[#1672d6] hover:bg-white/90"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentStep === 5 ? (
                <>
                  Concluir
                  <Check className="w-4 h-4 ml-2" />
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
      </div>
    </div>
  );
}
