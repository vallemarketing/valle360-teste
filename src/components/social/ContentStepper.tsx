'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  FileText,
  Sparkles,
  Users,
  Edit3,
  Send,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Copy,
  RefreshCw,
  Image as ImageIcon,
  Hash,
  Target,
  Wand2,
} from 'lucide-react';

// Types
export interface StepperClient {
  id: string;
  name: string;
}

export interface ContentGenerationResult {
  strategy?: string;
  copy?: string;
  hashtags?: string[];
  cta?: string;
  visualPrompt?: string;
}

export interface FocusGroupEvaluation {
  personaName: string;
  score: number;
  positives: string[];
  negatives: string[];
  suggestions: string[];
  verdict: 'aprovado' | 'reprovado' | 'precisa_ajustes';
}

export interface FocusGroupResult {
  averageScore: number;
  passed: boolean;
  evaluations: FocusGroupEvaluation[];
}

interface ContentStepperProps {
  clients: StepperClient[];
  connectedNetworks?: { platform: string; accountName: string }[];
  onComplete: (data: {
    clientId: string;
    content: ContentGenerationResult;
    selectedNetworks: string[];
    scheduledAt?: string;
  }) => Promise<void>;
}

type Step = 'briefing' | 'generation' | 'review' | 'editing' | 'approval';

const STEPS: { id: Step; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'briefing', label: 'Briefing', icon: FileText },
  { id: 'generation', label: 'Geração IA', icon: Sparkles },
  { id: 'review', label: 'Review IA', icon: Users },
  { id: 'editing', label: 'Edição', icon: Edit3 },
  { id: 'approval', label: 'Aprovação', icon: Send },
];

const DEMAND_TYPES = [
  { value: 'instagram_post', label: 'Post Instagram', icon: '📸' },
  { value: 'linkedin_post', label: 'Post LinkedIn', icon: '💼' },
  { value: 'carousel', label: 'Carrossel', icon: '🎠' },
  { value: 'reels', label: 'Reels', icon: '🎬' },
  { value: 'youtube_video', label: 'Vídeo YouTube', icon: '▶️' },
  { value: 'meta_ads_campaign', label: 'Campanha Meta Ads', icon: '📢' },
  { value: 'full_campaign', label: 'Campanha Completa', icon: '🚀' },
];

export function ContentStepper({ clients, connectedNetworks = [], onComplete }: ContentStepperProps) {
  const [currentStep, setCurrentStep] = useState<Step>('briefing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Briefing state
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [demandType, setDemandType] = useState<string>('instagram_post');
  const [topic, setTopic] = useState('');
  const [objective, setObjective] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // Generation state
  const [generatedContent, setGeneratedContent] = useState<ContentGenerationResult | null>(null);
  const [generationProgress, setGenerationProgress] = useState<string[]>([]);

  // Review state
  const [focusGroupResult, setFocusGroupResult] = useState<FocusGroupResult | null>(null);

  // Editing state
  const [editedCopy, setEditedCopy] = useState('');
  const [editedHashtags, setEditedHashtags] = useState('');
  const [editedCta, setEditedCta] = useState('');

  // Approval state
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [publishNow, setPublishNow] = useState(false);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 'briefing':
        return selectedClient && topic.trim().length > 10;
      case 'generation':
        return generatedContent !== null;
      case 'review':
        return focusGroupResult !== null;
      case 'editing':
        return editedCopy.trim().length > 0;
      case 'approval':
        return selectedNetworks.length > 0 && (publishNow || scheduledAt);
      default:
        return false;
    }
  }, [currentStep, selectedClient, topic, generatedContent, focusGroupResult, editedCopy, selectedNetworks, publishNow, scheduledAt]);

  const goNext = () => {
    const idx = currentStepIndex;
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id);
    }
  };

  const goBack = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1].id);
    }
  };

  // Step 2: Generate content with AI
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setGenerationProgress([]);

    try {
      setGenerationProgress(prev => [...prev, '🔍 Analisando demanda...']);
      await new Promise(r => setTimeout(r, 500));

      setGenerationProgress(prev => [...prev, '📚 Carregando memória da marca...']);
      await new Promise(r => setTimeout(r, 500));

      setGenerationProgress(prev => [...prev, '🤖 Montando equipe de agentes...']);

      const response = await fetch('/api/admin/agency/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient,
          demand_type: demandType,
          topic,
          objective,
          additional_context: additionalContext,
          use_focus_group: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha na geração');
      }

      setGenerationProgress(prev => [...prev, '✨ Conteúdo gerado com sucesso!']);

      setGeneratedContent(data.outputs);
      setEditedCopy(data.outputs?.copy || '');
      setEditedHashtags(data.outputs?.hashtags?.join(' ') || '');
      setEditedCta(data.outputs?.cta || '');

      await new Promise(r => setTimeout(r, 500));
      goNext();
    } catch (e: any) {
      setError(e.message || 'Erro ao gerar conteúdo');
      toast.error(e.message || 'Erro ao gerar conteúdo');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Run Focus Group
  const handleFocusGroup = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/agency/focus-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          content: {
            copy: editedCopy,
            hashtags: editedHashtags.split(/\s+/).filter(Boolean),
            cta: editedCta,
            visualPrompt: generatedContent?.visualPrompt,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha no focus group');
      }

      setFocusGroupResult({
        averageScore: data.averageScore,
        passed: data.passed,
        evaluations: data.evaluations || [],
      });

      goNext();
    } catch (e: any) {
      setError(e.message || 'Erro no focus group');
      toast.error(e.message || 'Erro no focus group');
    } finally {
      setLoading(false);
    }
  };

  // Skip Focus Group
  const handleSkipFocusGroup = () => {
    setFocusGroupResult({
      averageScore: 0,
      passed: true,
      evaluations: [],
    });
    goNext();
  };

  // Step 5: Submit for approval
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await onComplete({
        clientId: selectedClient,
        content: {
          copy: editedCopy,
          hashtags: editedHashtags.split(/\s+/).filter(Boolean),
          cta: editedCta,
          strategy: generatedContent?.strategy,
          visualPrompt: generatedContent?.visualPrompt,
        },
        selectedNetworks,
        scheduledAt: publishNow ? undefined : scheduledAt,
      });

      toast.success('Post enviado para aprovação!');
    } catch (e: any) {
      setError(e.message || 'Erro ao enviar');
      toast.error(e.message || 'Erro ao enviar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[600px]">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = idx < currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      backgroundColor: isCompleted
                        ? 'var(--success-500)'
                        : isActive
                        ? 'var(--primary-500)'
                        : 'var(--neutral-200)',
                    }}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Icon
                        className="w-5 h-5"
                        style={{ color: isActive ? 'white' : 'var(--text-tertiary)' }}
                      />
                    )}
                  </motion.div>
                  <span
                    className="mt-2 text-xs font-medium"
                    style={{
                      color: isActive ? 'var(--primary-600)' : 'var(--text-tertiary)',
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                {idx < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-1 mx-2 rounded"
                    style={{
                      backgroundColor:
                        idx < currentStepIndex ? 'var(--success-500)' : 'var(--neutral-200)',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl border flex items-center gap-3"
          style={{
            backgroundColor: 'var(--error-50)',
            borderColor: 'var(--error-200)',
          }}
        >
          <AlertCircle className="w-5 h-5" style={{ color: 'var(--error-500)' }} />
          <span style={{ color: 'var(--error-700)' }}>{error}</span>
        </motion.div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* STEP 1: Briefing */}
          {currentStep === 'briefing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Briefing do Conteúdo
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Defina as informações básicas para a IA gerar seu conteúdo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Cliente *
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de demanda */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Tipo de Conteúdo *
                  </label>
                  <select
                    value={demandType}
                    onChange={(e) => setDemandType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {DEMAND_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tópico */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Tópico / Tema *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Lançamento do novo produto X, Dica de produtividade..."
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)',
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Mínimo 10 caracteres
                </p>
              </div>

              {/* Objetivo */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Objetivo (opcional)
                </label>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Ex: Aumentar engajamento, Gerar leads, Educar audiência..."
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Contexto adicional */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Contexto Adicional (opcional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Informações extras que podem ajudar a IA..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Generation */}
          {currentStep === 'generation' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Geração com IA
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Nossa equipe de agentes IA está trabalhando no seu conteúdo.
                </p>
              </div>

              {loading ? (
                <div
                  className="p-8 rounded-2xl border"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Wand2 className="w-12 h-12" style={{ color: 'var(--primary-500)' }} />
                    </motion.div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Gerando conteúdo...
                    </p>
                  </div>

                  <div className="mt-6 space-y-2">
                    {generationProgress.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Check className="w-4 h-4" style={{ color: 'var(--success-500)' }} />
                        {msg}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : generatedContent ? (
                <div className="space-y-4">
                  <div
                    className="p-4 rounded-xl border"
                    style={{ backgroundColor: 'var(--success-50)', borderColor: 'var(--success-200)' }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--success-700)' }}>
                      ✅ Conteúdo gerado com sucesso! Avance para o review.
                    </p>
                  </div>

                  {/* Preview do conteúdo gerado */}
                  {generatedContent.copy && (
                    <div
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Copy className="w-4 h-4" style={{ color: 'var(--primary-500)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Copy gerada
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                        {generatedContent.copy.substring(0, 300)}
                        {generatedContent.copy.length > 300 && '...'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="p-8 rounded-2xl border text-center"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
                >
                  <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--primary-300)' }} />
                  <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Pronto para gerar?
                  </p>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Clique em "Gerar Conteúdo" para iniciar a criação com IA.
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white"
                    style={{ backgroundColor: 'var(--primary-500)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Gerar Conteúdo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Review por Focus Group IA
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  3 personas virtuais avaliam seu conteúdo antes de publicar.
                </p>
              </div>

              {loading ? (
                <div
                  className="p-8 rounded-2xl border text-center"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
                >
                  <Loader2
                    className="w-12 h-12 mx-auto mb-4 animate-spin"
                    style={{ color: 'var(--primary-500)' }}
                  />
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    Avaliando com Focus Group...
                  </p>
                </div>
              ) : focusGroupResult ? (
                <div className="space-y-4">
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      backgroundColor: focusGroupResult.passed
                        ? 'var(--success-50)'
                        : 'var(--warning-50)',
                      borderColor: focusGroupResult.passed
                        ? 'var(--success-200)'
                        : 'var(--warning-200)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {focusGroupResult.averageScore.toFixed(1)}/10
                      </span>
                      <span
                        className="text-sm"
                        style={{
                          color: focusGroupResult.passed
                            ? 'var(--success-700)'
                            : 'var(--warning-700)',
                        }}
                      >
                        {focusGroupResult.passed ? 'Aprovado!' : 'Precisa de ajustes'}
                      </span>
                    </div>
                  </div>

                  {focusGroupResult.evaluations.map((ev, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {ev.personaName}
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{
                            color:
                              ev.score >= 7
                                ? 'var(--success-600)'
                                : ev.score >= 5
                                ? 'var(--warning-600)'
                                : 'var(--error-600)',
                          }}
                        >
                          {ev.score}/10
                        </span>
                      </div>
                      {ev.suggestions.length > 0 && (
                        <ul className="text-sm list-disc pl-4" style={{ color: 'var(--text-secondary)' }}>
                          {ev.suggestions.slice(0, 2).map((s, j) => (
                            <li key={j}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="p-8 rounded-2xl border text-center"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
                >
                  <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--primary-300)' }} />
                  <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Validar com Focus Group?
                  </p>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    3 personas virtuais avaliarão seu conteúdo.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleFocusGroup}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white"
                      style={{ backgroundColor: 'var(--primary-500)' }}
                    >
                      <Users className="w-4 h-4" />
                      Executar Focus Group
                    </button>
                    <button
                      onClick={handleSkipFocusGroup}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium border"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Pular
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Editing */}
          {currentStep === 'editing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Edição Final
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Faça os ajustes finais no conteúdo antes de enviar para aprovação.
                </p>
              </div>

              {/* Copy */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  <Copy className="w-4 h-4" />
                  Legenda / Copy
                </label>
                <textarea
                  value={editedCopy}
                  onChange={(e) => setEditedCopy(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)',
                  }}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {editedCopy.length} caracteres
                  </span>
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  <Hash className="w-4 h-4" />
                  Hashtags
                </label>
                <input
                  type="text"
                  value={editedHashtags}
                  onChange={(e) => setEditedHashtags(e.target.value)}
                  placeholder="#marketing #socialmedia #dica"
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* CTA */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  <Target className="w-4 h-4" />
                  Call-to-Action
                </label>
                <input
                  type="text"
                  value={editedCta}
                  onChange={(e) => setEditedCta(e.target.value)}
                  placeholder="Ex: Comente abaixo sua opinião!"
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Visual Prompt Preview */}
              {generatedContent?.visualPrompt && (
                <div
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-4 h-4" style={{ color: 'var(--primary-500)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Prompt Visual (para Design)
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {generatedContent.visualPrompt}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Approval */}
          {currentStep === 'approval' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Enviar para Aprovação
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Selecione as redes e defina quando publicar.
                </p>
              </div>

              {/* Redes disponíveis */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                  Redes Sociais *
                </label>
                {connectedNetworks.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {connectedNetworks.map((net) => {
                      const isSelected = selectedNetworks.includes(net.platform);
                      return (
                        <button
                          key={net.platform}
                          onClick={() => {
                            setSelectedNetworks((prev) =>
                              isSelected
                                ? prev.filter((p) => p !== net.platform)
                                : [...prev, net.platform]
                            );
                          }}
                          className="p-4 rounded-xl border text-left transition-all"
                          style={{
                            backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-secondary)',
                            borderColor: isSelected ? 'var(--primary-300)' : 'var(--border-light)',
                          }}
                        >
                          <div className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                            {net.platform}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {net.accountName}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="p-4 rounded-xl border"
                    style={{ backgroundColor: 'var(--warning-50)', borderColor: 'var(--warning-200)' }}
                  >
                    <p className="text-sm" style={{ color: 'var(--warning-700)' }}>
                      ⚠️ Nenhuma rede social conectada. O cliente precisa conectar suas redes primeiro.
                    </p>
                  </div>
                )}
              </div>

              {/* Agendamento */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                  Quando publicar? *
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer" style={{ backgroundColor: publishNow ? 'var(--primary-50)' : 'var(--bg-secondary)', borderColor: publishNow ? 'var(--primary-300)' : 'var(--border-light)' }}>
                    <input
                      type="radio"
                      checked={publishNow}
                      onChange={() => setPublishNow(true)}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        Publicar após aprovação
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        O post será publicado assim que aprovado
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer" style={{ backgroundColor: !publishNow ? 'var(--primary-50)' : 'var(--bg-secondary)', borderColor: !publishNow ? 'var(--primary-300)' : 'var(--border-light)' }}>
                    <input
                      type="radio"
                      checked={!publishNow}
                      onChange={() => setPublishNow(false)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        Agendar para data específica
                      </div>
                      {!publishNow && (
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                          className="mt-2 px-3 py-2 rounded-lg border text-sm w-full"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            borderColor: 'var(--border-light)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between pt-6 border-t" style={{ borderColor: 'var(--border-light)' }}>
        <button
          onClick={goBack}
          disabled={currentStepIndex === 0 || loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium border disabled:opacity-50"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-light)',
            color: 'var(--text-secondary)',
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>

        {currentStep === 'approval' ? (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--success-500)' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar para Aprovação
              </>
            )}
          </button>
        ) : currentStep === 'generation' && !generatedContent ? (
          <button
            onClick={handleGenerate}
            disabled={!canProceed() || loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary-500)' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar Conteúdo
              </>
            )}
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={!canProceed() || loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary-500)' }}
          >
            Avançar
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
