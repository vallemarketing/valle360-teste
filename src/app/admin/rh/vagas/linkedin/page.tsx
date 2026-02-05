'use client';

/**
 * Valle 360 - Criação de Vagas LinkedIn com IA
 * Gera vagas para funcionários ou franqueados automaticamente
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Linkedin,
  Briefcase,
  Building2,
  Sparkles,
  Copy,
  ExternalLink,
  Check,
  RefreshCw,
  ChevronRight,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Loader2,
  Eye,
  Edit,
  X,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generateContent } from '@/lib/ai/content-generator';

// =====================================================
// TIPOS
// =====================================================

type JobType = 'employee' | 'franchisee';

interface GeneratedJob {
  id: string;
  title: string;
  content: string;
  jobType: JobType;
  createdAt: string;
  suggestions?: string[];
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function LinkedInJobsPage() {
  const [jobType, setJobType] = useState<JobType>('employee');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedJob, setGeneratedJob] = useState<GeneratedJob | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Form data for employee
  const [employeeForm, setEmployeeForm] = useState({
    position: '',
    department: 'Marketing',
    level: 'Pleno',
    location: 'São Paulo, SP',
    workModel: 'Híbrido',
    salary: '',
    benefits: '',
    requirements: ''
  });
  
  // Form data for franchisee
  const [franchiseeForm, setFranchiseeForm] = useState({
    companyName: 'Valle 360',
    location: '',
    initialInvestment: '',
    averageRevenue: '',
    franchiseFee: '',
    royalties: '5%',
    support: 'Treinamento completo, suporte operacional e marketing institucional'
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const context = jobType === 'employee' 
        ? {
            position: employeeForm.position,
            department: employeeForm.department,
            level: employeeForm.level,
            location: employeeForm.location,
            workModel: employeeForm.workModel,
            salary: employeeForm.salary,
            benefits: employeeForm.benefits.split(',').map(b => b.trim()).filter(Boolean),
            requirements: employeeForm.requirements.split(',').map(r => r.trim()).filter(Boolean),
            companyName: 'Valle 360',
            jobType: 'employee'
          }
        : {
            position: `Franquia ${franchiseeForm.companyName}`,
            companyName: franchiseeForm.companyName,
            location: franchiseeForm.location,
            initialInvestment: franchiseeForm.initialInvestment,
            averageRevenue: franchiseeForm.averageRevenue,
            franchiseFee: franchiseeForm.franchiseFee,
            royalties: franchiseeForm.royalties,
            support: franchiseeForm.support,
            jobType: 'franchisee'
          };

      const result = await generateContent({
        type: 'linkedin_job',
        context,
        tone: 'professional'
      });

      setGeneratedJob({
        id: `job_${Date.now()}`,
        title: result.title || (jobType === 'employee' ? employeeForm.position : `Franquia ${franchiseeForm.companyName}`),
        content: result.content,
        jobType,
        createdAt: new Date().toISOString(),
        suggestions: result.suggestions
      });
      
      toast.success('Vaga gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar vaga');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedJob) {
      navigator.clipboard.writeText(generatedJob.content);
      setCopied(true);
      toast.success('Conteúdo copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLinkedIn = () => {
    const url = jobType === 'employee'
      ? 'https://www.linkedin.com/talent/post-a-job'
      : 'https://www.linkedin.com/feed/?shareActive=true';
    window.open(url, '_blank');
    toast.info('Cole o conteúdo no LinkedIn');
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Linkedin className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Criar Vaga LinkedIn</h1>
              <p className="text-sm text-gray-500">IA gera o conteúdo, você só publica</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-xl">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Powered by AI</span>
          </div>
        </div>

        {/* Job Type Selector */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setJobType('employee')}
            className={cn(
              "p-6 rounded-xl border-2 transition-all text-left",
              jobType === 'employee'
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                jobType === 'employee' ? "bg-blue-100" : "bg-gray-100"
              )}>
                <Briefcase className={cn(
                  "w-6 h-6",
                  jobType === 'employee' ? "text-blue-600" : "text-gray-400"
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Vaga de Emprego</h3>
                <p className="text-sm text-gray-500">Colaborador ou funcionário</p>
              </div>
            </div>
            {jobType === 'employee' && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Check className="w-4 h-4" />
                Selecionado
              </div>
            )}
          </button>

          <button
            onClick={() => setJobType('franchisee')}
            className={cn(
              "p-6 rounded-xl border-2 transition-all text-left",
              jobType === 'franchisee'
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                jobType === 'franchisee' ? "bg-purple-100" : "bg-gray-100"
              )}>
                <Building2 className={cn(
                  "w-6 h-6",
                  jobType === 'franchisee' ? "text-purple-600" : "text-gray-400"
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Oportunidade de Franquia</h3>
                <p className="text-sm text-gray-500">Candidato a franqueado</p>
              </div>
            </div>
            {jobType === 'franchisee' && (
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <Check className="w-4 h-4" />
                Selecionado
              </div>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              {jobType === 'employee' ? 'Informações da Vaga' : 'Informações da Franquia'}
            </h2>

            {jobType === 'employee' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
                  <input
                    type="text"
                    value={employeeForm.position}
                    onChange={e => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Social Media Manager"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <select
                      value={employeeForm.department}
                      onChange={e => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Marketing</option>
                      <option>Comercial</option>
                      <option>RH</option>
                      <option>TI</option>
                      <option>Financeiro</option>
                      <option>Operações</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                    <select
                      value={employeeForm.level}
                      onChange={e => setEmployeeForm({ ...employeeForm, level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Estágio</option>
                      <option>Júnior</option>
                      <option>Pleno</option>
                      <option>Sênior</option>
                      <option>Coordenador</option>
                      <option>Gerente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                    <input
                      type="text"
                      value={employeeForm.location}
                      onChange={e => setEmployeeForm({ ...employeeForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="São Paulo, SP"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                    <select
                      value={employeeForm.workModel}
                      onChange={e => setEmployeeForm({ ...employeeForm, workModel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Remoto</option>
                      <option>Híbrido</option>
                      <option>Presencial</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Faixa Salarial (opcional)</label>
                  <input
                    type="text"
                    value={employeeForm.salary}
                    onChange={e => setEmployeeForm({ ...employeeForm, salary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="R$ 5.000 - R$ 7.000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benefícios (separados por vírgula)</label>
                  <input
                    type="text"
                    value={employeeForm.benefits}
                    onChange={e => setEmployeeForm({ ...employeeForm, benefits: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VR, VT, Plano de saúde, Home office"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requisitos (separados por vírgula)</label>
                  <textarea
                    value={employeeForm.requirements}
                    onChange={e => setEmployeeForm({ ...employeeForm, requirements: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Experiência com redes sociais, Conhecimento em métricas"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Franquia</label>
                    <input
                      type="text"
                      value={franchiseeForm.companyName}
                      onChange={e => setFranchiseeForm({ ...franchiseeForm, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Valle 360"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                    <input
                      type="text"
                      value={franchiseeForm.location}
                      onChange={e => setFranchiseeForm({ ...franchiseeForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Todo o Brasil"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Investimento Inicial (R$)</label>
                    <input
                      type="text"
                      value={franchiseeForm.initialInvestment}
                      onChange={e => setFranchiseeForm({ ...franchiseeForm, initialInvestment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="250.000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Faturamento Médio (R$)</label>
                    <input
                      type="text"
                      value={franchiseeForm.averageRevenue}
                      onChange={e => setFranchiseeForm({ ...franchiseeForm, averageRevenue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="80.000/mês"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Franquia (R$)</label>
                    <input
                      type="text"
                      value={franchiseeForm.franchiseFee}
                      onChange={e => setFranchiseeForm({ ...franchiseeForm, franchiseFee: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="50.000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Royalties</label>
                    <input
                      type="text"
                      value={franchiseeForm.royalties}
                      onChange={e => setFranchiseeForm({ ...franchiseeForm, royalties: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="5%"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suporte Oferecido</label>
                  <textarea
                    value={franchiseeForm.support}
                    onChange={e => setFranchiseeForm({ ...franchiseeForm, support: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Treinamento, suporte operacional, marketing..."
                  />
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (jobType === 'employee' && !employeeForm.position) || (jobType === 'franchisee' && !franchiseeForm.location)}
              className={cn(
                "w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition-colors",
                jobType === 'employee' 
                  ? "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                  : "bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar Vaga com IA
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Preview</h2>
              {generatedJob && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                  <button
                    onClick={() => setGeneratedJob(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              )}
            </div>

            {generatedJob ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 max-h-[500px] overflow-y-auto">
                  <h3 className="font-semibold text-gray-900 mb-3">{generatedJob.title}</h3>
                  <div className="whitespace-pre-wrap text-sm text-gray-700">
                    {generatedJob.content}
                  </div>
                </div>

                {generatedJob.suggestions && generatedJob.suggestions.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Sugestões da IA
                    </h4>
                    <ul className="space-y-1">
                      {generatedJob.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-yellow-700 flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={handleOpenLinkedIn}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0a66c2] text-white rounded-xl font-medium hover:bg-[#084c94] transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  Publicar no LinkedIn
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                <Linkedin className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-center">
                  Preencha as informações e clique em<br />
                  <strong>"Gerar Vaga com IA"</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

