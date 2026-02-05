"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  ArrowRight, 
  ArrowLeft,
  Check, 
  User, 
  Share2, 
  Target, 
  LayoutDashboard,
  Sparkles,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

// ============================================
// ONBOARDING DO CLIENTE - VALLE AI
// Passo a passo guiado para novos clientes
// ============================================

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof User;
  component: React.FC<{ onComplete: () => void; data: OnboardingData; setData: (data: OnboardingData) => void }>;
}

interface OnboardingData {
  profileCompleted: boolean;
  socialConnected: string[];
  competitorAdded: string;
  preferencesSet: boolean;
}

interface ClientOnboardingProps {
  userName?: string;
  onComplete?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

// Componentes de cada etapa
const WelcomeStep = ({ onComplete }: { onComplete: () => void; data: OnboardingData; setData: (data: OnboardingData) => void }) => (
  <div className="text-center py-8">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center"
    >
      <Sparkles className="w-12 h-12 text-white" />
    </motion.div>
    <h2 className="text-2xl font-bold text-[#001533] dark:text-white mb-3">
      Bem-vindo ao Valle 360!
    </h2>
    <p className="text-[#001533]/60 dark:text-white/60 max-w-md mx-auto mb-8">
      Vamos configurar sua conta em poucos passos para você aproveitar ao máximo nossa plataforma.
    </p>
    <Button 
      onClick={onComplete}
      className="bg-[#1672d6] hover:bg-[#1260b5] text-white px-8"
    >
      Começar <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </div>
);

const ProfileStep = ({ onComplete, data, setData }: { onComplete: () => void; data: OnboardingData; setData: (data: OnboardingData) => void }) => {
  const [formData, setFormData] = useState({
    companyName: "",
    segment: "",
    website: "",
    phone: ""
  });

  const handleSubmit = () => {
    setData({ ...data, profileCompleted: true });
    onComplete();
  };

  return (
    <div className="py-6">
      <h2 className="text-xl font-bold text-[#001533] dark:text-white mb-2">
        Complete seu perfil
      </h2>
      <p className="text-[#001533]/60 dark:text-white/60 mb-6">
        Essas informações nos ajudam a personalizar sua experiência
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#001533] dark:text-white mb-1.5">
            Nome da Empresa
          </label>
          <Input 
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="Sua Empresa Ltda"
            className="border-[#001533]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#001533] dark:text-white mb-1.5">
            Segmento
          </label>
          <Input 
            value={formData.segment}
            onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
            placeholder="Ex: E-commerce, Serviços, Varejo"
            className="border-[#001533]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#001533] dark:text-white mb-1.5">
            Website
          </label>
          <Input 
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://suaempresa.com.br"
            className="border-[#001533]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#001533] dark:text-white mb-1.5">
            Telefone/WhatsApp
          </label>
          <Input 
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(11) 99999-9999"
            className="border-[#001533]/20"
          />
        </div>
      </div>

      <Button 
        onClick={handleSubmit}
        className="w-full mt-6 bg-[#1672d6] hover:bg-[#1260b5] text-white"
      >
        Continuar <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

const SocialStep = ({ onComplete, data, setData }: { onComplete: () => void; data: OnboardingData; setData: (data: OnboardingData) => void }) => {
  const [connected, setConnected] = useState<string[]>([]);

  const socialNetworks = [
    { id: "instagram", name: "Instagram", color: "bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500" },
    { id: "facebook", name: "Facebook", color: "bg-[#1877f2]" },
    { id: "linkedin", name: "LinkedIn", color: "bg-[#0a66c2]" },
  ];

  const toggleConnect = (id: string) => {
    setConnected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    setData({ ...data, socialConnected: connected });
    onComplete();
  };

  return (
    <div className="py-6">
      <h2 className="text-xl font-bold text-[#001533] dark:text-white mb-2">
        Conecte suas redes sociais
      </h2>
      <p className="text-[#001533]/60 dark:text-white/60 mb-6">
        Conecte suas redes para gerenciar tudo em um só lugar
      </p>
      
      <div className="space-y-3">
        {socialNetworks.map((network) => (
          <button
            key={network.id}
            onClick={() => toggleConnect(network.id)}
            className={cn(
              "w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all",
              connected.includes(network.id)
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-[#001533]/10 dark:border-white/10 hover:border-[#1672d6]/30"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", network.color)}>
                <Share2 className="w-5 h-5" />
              </div>
              <span className="font-medium text-[#001533] dark:text-white">{network.name}</span>
            </div>
            {connected.includes(network.id) ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            ) : (
              <span className="text-sm text-[#1672d6]">Conectar</span>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-[#001533]/50 dark:text-white/50 mt-4 text-center">
        Você pode conectar mais redes depois em Configurações
      </p>

      <Button 
        onClick={handleContinue}
        className="w-full mt-6 bg-[#1672d6] hover:bg-[#1260b5] text-white"
      >
        {connected.length > 0 ? "Continuar" : "Pular por agora"} <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

const CompetitorStep = ({ onComplete, data, setData }: { onComplete: () => void; data: OnboardingData; setData: (data: OnboardingData) => void }) => {
  const [competitor, setCompetitor] = useState("");

  const handleContinue = () => {
    setData({ ...data, competitorAdded: competitor });
    onComplete();
  };

  return (
    <div className="py-6">
      <h2 className="text-xl font-bold text-[#001533] dark:text-white mb-2">
        Adicione um concorrente
      </h2>
      <p className="text-[#001533]/60 dark:text-white/60 mb-6">
        Monitore seus concorrentes e receba insights comparativos
      </p>
      
      <div>
        <label className="block text-sm font-medium text-[#001533] dark:text-white mb-1.5">
          Site ou nome do concorrente
        </label>
        <Input 
          value={competitor}
          onChange={(e) => setCompetitor(e.target.value)}
          placeholder="Ex: concorrente.com.br"
          className="border-[#001533]/20"
        />
      </div>

      <div className="mt-4 p-4 rounded-xl bg-[#1672d6]/5 border border-[#1672d6]/20">
        <p className="text-sm text-[#001533]/70 dark:text-white/70">
          💡 A Val vai analisar o concorrente e trazer insights sobre estratégias de marketing, presença digital e oportunidades para você.
        </p>
      </div>

      <Button 
        onClick={handleContinue}
        className="w-full mt-6 bg-[#1672d6] hover:bg-[#1260b5] text-white"
      >
        {competitor ? "Continuar" : "Pular por agora"} <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

const CompleteStep = ({ onComplete }: { onComplete: () => void; data: OnboardingData; setData: (data: OnboardingData) => void }) => (
  <div className="text-center py-8">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center"
    >
      <Check className="w-12 h-12 text-white" />
    </motion.div>
    <h2 className="text-2xl font-bold text-[#001533] dark:text-white mb-3">
      Tudo pronto!
    </h2>
    <p className="text-[#001533]/60 dark:text-white/60 max-w-md mx-auto mb-8">
      Sua conta está configurada. Explore o dashboard e descubra todas as ferramentas disponíveis para você.
    </p>
    <Button 
      onClick={onComplete}
      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
    >
      Ir para o Dashboard <LayoutDashboard className="w-4 h-4 ml-2" />
    </Button>
  </div>
);

const steps: OnboardingStep[] = [
  { id: "welcome", title: "Boas-vindas", description: "Conheça o Valle 360", icon: Sparkles, component: WelcomeStep },
  { id: "profile", title: "Perfil", description: "Complete seu cadastro", icon: User, component: ProfileStep },
  { id: "social", title: "Redes Sociais", description: "Conecte suas redes", icon: Share2, component: SocialStep },
  { id: "competitor", title: "Concorrentes", description: "Adicione um concorrente", icon: Target, component: CompetitorStep },
  { id: "complete", title: "Concluído", description: "Pronto para começar", icon: Check, component: CompleteStep },
];

export function ClientOnboarding({ userName = "Cliente", onComplete, isOpen = true, onClose }: ClientOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    profileCompleted: false,
    socialConnected: [],
    competitorAdded: "",
    preferencesSet: false
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#001533]/10 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md overflow-hidden">
                  <Image src="/icons/valle360-icon.png" alt="Valle 360" width={32} height={32} className="object-contain" />
                </div>
                <div>
                  <h1 className="font-bold text-[#001533] dark:text-white">Valle 360</h1>
                  <p className="text-xs text-[#001533]/50 dark:text-white/50">
                    Configuração • Etapa {currentStep + 1} de {steps.length}
                  </p>
                </div>
              </div>
              {onClose && (
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-[#001533]/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#001533]/50" />
                </button>
              )}
            </div>
            
            {/* Progress */}
            <Progress value={progress} className="h-2" />
            
            {/* Steps indicator */}
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div 
                    key={step.id}
                    className={cn(
                      "flex flex-col items-center gap-1",
                      isActive ? "text-[#1672d6]" : isCompleted ? "text-emerald-500" : "text-[#001533]/30 dark:text-white/30"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      isActive ? "bg-[#1672d6] text-white" : isCompleted ? "bg-emerald-500 text-white" : "bg-[#001533]/10 dark:bg-white/10"
                    )}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="text-[10px] font-medium hidden sm:block">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CurrentStepComponent 
                  onComplete={handleNext} 
                  data={data} 
                  setData={setData}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="px-6 pb-6">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-[#001533]/50 dark:text-white/50 hover:text-[#1672d6] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ClientOnboarding;

