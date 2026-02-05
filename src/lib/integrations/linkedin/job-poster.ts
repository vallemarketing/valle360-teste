/**
 * Valle 360 - LinkedIn Job Poster
 * Integração com LinkedIn para publicação de vagas com IA
 */

import { generateContent, ContentType } from '@/lib/ai/content-generator';

// =====================================================
// TIPOS
// =====================================================

export type JobType = 'employee' | 'franchisee';

export interface JobPostRequest {
  jobType: JobType;
  position: string;
  companyName: string;
  location: string;
  workModel?: 'remote' | 'hybrid' | 'onsite';
  
  // Para vagas de emprego
  salary?: string;
  benefits?: string[];
  department?: string;
  level?: string;
  requirements?: string[];
  
  // Para franquias
  initialInvestment?: number;
  averageRevenue?: number;
  franchiseFee?: number;
  royalties?: string;
  support?: string;
}

export interface JobPost {
  id: string;
  title: string;
  content: string;
  jobType: JobType;
  status: 'draft' | 'ready' | 'posted';
  createdAt: string;
  postedAt?: string;
  linkedinUrl?: string;
  suggestions?: string[];
}

// =====================================================
// FUNÇÕES
// =====================================================

/**
 * Gera uma vaga usando IA
 */
export async function generateJobPost(request: JobPostRequest): Promise<JobPost> {
  const contentType: ContentType = 'linkedin_job';
  
  const result = await generateContent({
    type: contentType,
    context: {
      ...request,
      jobType: request.jobType
    },
    tone: 'professional'
  });
  
  return {
    id: `job_${Date.now()}`,
    title: result.title || `${request.position} - ${request.companyName}`,
    content: result.content,
    jobType: request.jobType,
    status: 'ready',
    createdAt: new Date().toISOString(),
    suggestions: result.suggestions
  };
}

/**
 * Gera um post de oportunidade para LinkedIn
 */
export async function generateLinkedInPost(request: JobPostRequest): Promise<JobPost> {
  const result = await generateContent({
    type: 'linkedin_post',
    context: {
      topic: request.jobType === 'franchisee' 
        ? `Oportunidade de Franquia ${request.companyName}` 
        : `Vaga: ${request.position}`,
      goal: 'recruitment',
      companyContext: request.companyName,
      audience: request.jobType === 'franchisee' ? 'Empreendedores' : 'Profissionais'
    },
    tone: 'professional'
  });
  
  return {
    id: `post_${Date.now()}`,
    title: request.jobType === 'franchisee' 
      ? `Seja um Franqueado ${request.companyName}` 
      : `${request.position}`,
    content: result.content,
    jobType: request.jobType,
    status: 'ready',
    createdAt: new Date().toISOString(),
    suggestions: result.suggestions
  };
}

/**
 * Copia conteúdo para clipboard (para colar no LinkedIn)
 */
export function copyToClipboard(content: string): boolean {
  try {
    navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}

/**
 * Abre LinkedIn para criar post manualmente
 */
export function openLinkedInComposer(prefilledText?: string): void {
  const baseUrl = 'https://www.linkedin.com/feed/?shareActive=true';
  // Note: LinkedIn não permite pré-preencher o texto via URL
  // O usuário precisará colar o conteúdo manualmente
  window.open(baseUrl, '_blank');
}

/**
 * Abre LinkedIn Jobs para criar vaga
 */
export function openLinkedInJobsPosting(): void {
  window.open('https://www.linkedin.com/talent/post-a-job', '_blank');
}

// =====================================================
// TEMPLATES PRÉ-CONFIGURADOS
// =====================================================

export const JOB_TEMPLATES = {
  franchisee: {
    title: 'Oportunidade de Franquia',
    fields: [
      { id: 'position', label: 'Nome da Franquia', type: 'text', required: true },
      { id: 'location', label: 'Localização', type: 'text', required: true },
      { id: 'initialInvestment', label: 'Investimento Inicial (R$)', type: 'number', required: true },
      { id: 'averageRevenue', label: 'Faturamento Médio (R$)', type: 'number', required: false },
      { id: 'franchiseFee', label: 'Taxa de Franquia (R$)', type: 'number', required: false },
      { id: 'royalties', label: 'Royalties (%)', type: 'text', required: false },
      { id: 'support', label: 'Suporte Oferecido', type: 'textarea', required: false }
    ]
  },
  employee: {
    title: 'Vaga de Emprego',
    fields: [
      { id: 'position', label: 'Cargo', type: 'text', required: true },
      { id: 'department', label: 'Departamento', type: 'select', options: ['Marketing', 'RH', 'Comercial', 'TI', 'Financeiro', 'Operações'], required: true },
      { id: 'level', label: 'Nível', type: 'select', options: ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Coordenador', 'Gerente', 'Diretor'], required: true },
      { id: 'location', label: 'Localização', type: 'text', required: true },
      { id: 'workModel', label: 'Modelo de Trabalho', type: 'select', options: ['Remoto', 'Híbrido', 'Presencial'], required: true },
      { id: 'salary', label: 'Faixa Salarial', type: 'text', required: false },
      { id: 'benefits', label: 'Benefícios', type: 'tags', required: false },
      { id: 'requirements', label: 'Requisitos', type: 'tags', required: false }
    ]
  }
};

