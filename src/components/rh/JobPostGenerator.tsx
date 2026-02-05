'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, MapPin, DollarSign, Clock, Users,
  Sparkles, Copy, Check, Send, Linkedin, Globe,
  FileText, ChevronRight, Loader2, Eye
} from 'lucide-react';

interface JobPost {
  id?: string;
  title: string;
  department: string;
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  contractType: 'clt' | 'pj' | 'internship' | 'freelance';
  salaryRange: { min: number; max: number };
  showSalary: boolean;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  status: 'draft' | 'active' | 'paused' | 'closed';
  createdAt?: Date;
  applications?: number;
}

interface JobPostGeneratorProps {
  onSave?: (job: JobPost) => void;
  onPublish?: (job: JobPost, platforms: string[]) => void;
  initialData?: Partial<JobPost>;
}

const DEPARTMENTS = [
  'Design', 'Marketing', 'Desenvolvimento', 'Comercial', 'Financeiro',
  'RH', 'Operações', 'Tráfego Pago', 'Social Media', 'Vídeo'
];

const LOCATION_TYPES = [
  { id: 'remote', label: 'Remoto', icon: '🏠' },
  { id: 'hybrid', label: 'Híbrido', icon: '🔄' },
  { id: 'onsite', label: 'Presencial', icon: '🏢' }
];

const CONTRACT_TYPES = [
  { id: 'clt', label: 'CLT' },
  { id: 'pj', label: 'PJ' },
  { id: 'internship', label: 'Estágio' },
  { id: 'freelance', label: 'Freelance' }
];

export function JobPostGenerator({ onSave, onPublish, initialData }: JobPostGeneratorProps) {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [jobData, setJobData] = useState<JobPost>({
    title: initialData?.title || '',
    department: initialData?.department || '',
    location: initialData?.location || 'São Paulo, SP',
    locationType: initialData?.locationType || 'hybrid',
    contractType: initialData?.contractType || 'clt',
    salaryRange: initialData?.salaryRange || { min: 3000, max: 6000 },
    showSalary: initialData?.showSalary ?? true,
    description: initialData?.description || '',
    responsibilities: initialData?.responsibilities || [],
    requirements: initialData?.requirements || [],
    benefits: initialData?.benefits || [],
    skills: initialData?.skills || [],
    status: 'draft'
  });

  const [newResponsibility, setNewResponsibility] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // Gerar descrição com IA
  const generateWithAI = async () => {
    if (!jobData.title || !jobData.department) {
      alert('Preencha o título e departamento primeiro');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Gere uma descrição de vaga profissional e atrativa para a posição de "${jobData.title}" no departamento de "${jobData.department}". 
            
            A vaga é ${LOCATION_TYPES.find(l => l.id === jobData.locationType)?.label} em ${jobData.location}.
            Contrato: ${CONTRACT_TYPES.find(c => c.id === jobData.contractType)?.label}.
            
            Retorne um JSON com:
            {
              "description": "descrição da vaga em 2-3 parágrafos",
              "responsibilities": ["responsabilidade 1", "responsabilidade 2", ...] (5-7 itens),
              "requirements": ["requisito 1", "requisito 2", ...] (5-7 itens),
              "benefits": ["benefício 1", "benefício 2", ...] (5-7 itens),
              "skills": ["skill 1", "skill 2", ...] (5-8 skills técnicas)
            }
            
            Seja específico e use linguagem moderna e inclusiva.`
          }],
          context: { type: 'job_generation' }
        })
      });

      const data = await response.json();
      
      // Tentar parsear o JSON da resposta
      try {
        const jsonMatch = data.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const generated = JSON.parse(jsonMatch[0]);
          setJobData(prev => ({
            ...prev,
            description: generated.description || prev.description,
            responsibilities: generated.responsibilities || prev.responsibilities,
            requirements: generated.requirements || prev.requirements,
            benefits: generated.benefits || prev.benefits,
            skills: generated.skills || prev.skills
          }));
        }
      } catch (e) {
        console.error('Erro ao parsear resposta:', e);
      }
    } catch (error) {
      console.error('Erro ao gerar com IA:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar para clipboard
  const copyToClipboard = async () => {
    const text = formatJobForLinkedIn();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Formatar para LinkedIn
  const formatJobForLinkedIn = () => {
    return `🚀 VAGA: ${jobData.title.toUpperCase()}

📍 ${jobData.location} | ${LOCATION_TYPES.find(l => l.id === jobData.locationType)?.label}
📋 ${CONTRACT_TYPES.find(c => c.id === jobData.contractType)?.label}
${jobData.showSalary ? `💰 R$ ${jobData.salaryRange.min.toLocaleString()} - R$ ${jobData.salaryRange.max.toLocaleString()}` : ''}

${jobData.description}

📌 RESPONSABILIDADES:
${jobData.responsibilities.map(r => `• ${r}`).join('\n')}

✅ REQUISITOS:
${jobData.requirements.map(r => `• ${r}`).join('\n')}

🎁 BENEFÍCIOS:
${jobData.benefits.map(b => `• ${b}`).join('\n')}

🔧 SKILLS:
${jobData.skills.join(' • ')}

📩 Interessado? Envie seu currículo ou comente "QUERO"!

#vaga #emprego #${jobData.department.toLowerCase().replace(/\s+/g, '')} #oportunidade`;
  };

  // Adicionar item a uma lista
  const addToList = (list: keyof Pick<JobPost, 'responsibilities' | 'requirements' | 'benefits' | 'skills'>, value: string, setValue: (v: string) => void) => {
    if (!value.trim()) return;
    setJobData(prev => ({
      ...prev,
      [list]: [...prev[list], value.trim()]
    }));
    setValue('');
  };

  // Remover item de uma lista
  const removeFromList = (list: keyof Pick<JobPost, 'responsibilities' | 'requirements' | 'benefits' | 'skills'>, index: number) => {
    setJobData(prev => ({
      ...prev,
      [list]: prev[list].filter((_, i) => i !== index)
    }));
  };

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>
            Etapa {step} de {totalSteps}
          </span>
          <span style={{ color: 'var(--text-tertiary)' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full rounded-full"
            style={{ backgroundColor: 'var(--primary-500)' }}
          />
        </div>
      </div>

      {/* Step 1: Informações Básicas */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Informações Básicas
          </h3>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Título da Vaga *
            </label>
            <input
              type="text"
              value={jobData.title}
              onChange={(e) => setJobData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Designer Gráfico Sênior"
              className="w-full px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Departamento */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Departamento *
            </label>
            <select
              value={jobData.department}
              onChange={(e) => setJobData(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">Selecione...</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Localização */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Localização
              </label>
              <input
                type="text"
                value={jobData.location}
                onChange={(e) => setJobData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="São Paulo, SP"
                className="w-full px-4 py-3 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Tipo
              </label>
              <div className="flex gap-2">
                {LOCATION_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setJobData(prev => ({ ...prev, locationType: type.id as any }))}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: jobData.locationType === type.id ? 'var(--primary-500)' : 'var(--bg-secondary)',
                      color: jobData.locationType === type.id ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contrato e Salário */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Tipo de Contrato
              </label>
              <select
                value={jobData.contractType}
                onChange={(e) => setJobData(prev => ({ ...prev, contractType: e.target.value as any }))}
                className="w-full px-4 py-3 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              >
                {CONTRACT_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Faixa Salarial
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={jobData.salaryRange.min}
                  onChange={(e) => setJobData(prev => ({ 
                    ...prev, 
                    salaryRange: { ...prev.salaryRange, min: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="Min"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                />
                <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                <input
                  type="number"
                  value={jobData.salaryRange.max}
                  onChange={(e) => setJobData(prev => ({ 
                    ...prev, 
                    salaryRange: { ...prev.salaryRange, max: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="Max"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <label className="flex items-center gap-2 mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                <input
                  type="checkbox"
                  checked={jobData.showSalary}
                  onChange={(e) => setJobData(prev => ({ ...prev, showSalary: e.target.checked }))}
                />
                Exibir salário na vaga
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 2: Descrição */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Descrição da Vaga
            </h3>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateWithAI}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--purple-500)' }}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Gerar com IA
            </motion.button>
          </div>

          <textarea
            value={jobData.description}
            onChange={(e) => setJobData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descreva a vaga, a empresa e o que buscamos no candidato ideal..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl border resize-none"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-light)',
              color: 'var(--text-primary)'
            }}
          />

          {/* Responsabilidades */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Responsabilidades
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newResponsibility}
                onChange={(e) => setNewResponsibility(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToList('responsibilities', newResponsibility, setNewResponsibility)}
                placeholder="Adicionar responsabilidade..."
                className="flex-1 px-4 py-2 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={() => addToList('responsibilities', newResponsibility, setNewResponsibility)}
                className="px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {jobData.responsibilities.map((item, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {item}
                  <button
                    onClick={() => removeFromList('responsibilities', index)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 3: Requisitos e Skills */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Requisitos e Skills
          </h3>

          {/* Requisitos */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Requisitos
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToList('requirements', newRequirement, setNewRequirement)}
                placeholder="Adicionar requisito..."
                className="flex-1 px-4 py-2 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={() => addToList('requirements', newRequirement, setNewRequirement)}
                className="px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {jobData.requirements.map((item, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {item}
                  <button onClick={() => removeFromList('requirements', index)} className="ml-1 text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Skills Técnicas
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToList('skills', newSkill, setNewSkill)}
                placeholder="Adicionar skill..."
                className="flex-1 px-4 py-2 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={() => addToList('skills', newSkill, setNewSkill)}
                className="px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {jobData.skills.map((item, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}
                >
                  {item}
                  <button onClick={() => removeFromList('skills', index)} className="ml-1 text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Benefícios */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Benefícios
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToList('benefits', newBenefit, setNewBenefit)}
                placeholder="Adicionar benefício..."
                className="flex-1 px-4 py-2 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={() => addToList('benefits', newBenefit, setNewBenefit)}
                className="px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {jobData.benefits.map((item, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: 'var(--success-100)', color: 'var(--success-700)' }}
                >
                  {item}
                  <button onClick={() => removeFromList('benefits', index)} className="ml-1 text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 4: Preview e Publicação */}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Preview e Publicação
            </h3>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          {/* Preview */}
          <div 
            className="p-4 rounded-xl border whitespace-pre-wrap text-sm"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-light)',
              color: 'var(--text-primary)'
            }}
          >
            {formatJobForLinkedIn()}
          </div>

          {/* Plataformas de Publicação */}
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              Publicar em:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <PublishOption 
                icon={<Linkedin className="w-5 h-5" />}
                name="LinkedIn"
                color="#0A66C2"
                description="Publicar na página da empresa"
              />
              <PublishOption 
                icon={<Globe className="w-5 h-5" />}
                name="Site de Vagas"
                color="var(--primary-500)"
                description="Página de carreiras Valle 360"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
        <button
          onClick={() => setStep(prev => Math.max(1, prev - 1))}
          disabled={step === 1}
          className="px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)'
          }}
        >
          Anterior
        </button>

        {step < totalSteps ? (
          <button
            onClick={() => setStep(prev => Math.min(totalSteps, prev + 1))}
            className="flex items-center gap-2 px-6 py-2 rounded-xl font-medium text-white"
            style={{ backgroundColor: 'var(--primary-500)' }}
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onSave?.(jobData)}
              className="px-4 py-2 rounded-xl font-medium"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              Salvar Rascunho
            </button>
            <button
              onClick={() => onPublish?.(jobData, ['linkedin', 'website'])}
              className="flex items-center gap-2 px-6 py-2 rounded-xl font-medium text-white"
              style={{ backgroundColor: 'var(--success-500)' }}
            >
              <Send className="w-4 h-4" />
              Publicar Vaga
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Publish Option Component
function PublishOption({ icon, name, color, description }: {
  icon: React.ReactNode;
  name: string;
  color: string;
  description: string;
}) {
  const [checked, setChecked] = useState(true);

  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
        checked ? 'ring-2' : ''
      }`}
      style={{
        backgroundColor: checked ? `${color}10` : 'var(--bg-secondary)',
        borderColor: checked ? color : 'var(--border-light)'
      }}
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <div className="text-left">
        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{name}</p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
      </div>
      <div 
        className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center`}
        style={{ borderColor: checked ? color : 'var(--border-medium)' }}
      >
        {checked && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
      </div>
    </button>
  );
}

export default JobPostGenerator;

