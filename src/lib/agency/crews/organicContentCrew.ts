/**
 * Organic Content Crew
 * Crew especializada em conteúdo orgânico para redes sociais
 */

import { Crew } from '../core/crew';
import { Task } from '../core/task';
import { CrewExecutionResult } from '../core/types';
import {
  createHeadStrategist,
  createTrendHunter,
} from '../agents/strategic';
import {
  createInstagramExpert,
  createLinkedinExpert,
  createHookSpecialist,
  createCtaSpecialist,
} from '../agents/copywriters';
import {
  createGraphicDesignerPosts,
  createGraphicDesignerCarousels,
} from '../agents/visual';
import { createSocialMediaManager } from '../agents/distribution';
import { createBrandGuardian } from '../agents/quality';

export interface OrganicContentRequest {
  clientId: string;
  topic: string;
  platform: 'instagram' | 'linkedin' | 'both';
  contentType: 'post' | 'carousel' | 'story';
  objective?: string;
  additionalContext?: string;
}

export async function runOrganicContentCrew(
  request: OrganicContentRequest
): Promise<CrewExecutionResult> {
  const { clientId, topic, platform, contentType, objective, additionalContext } = request;

  // Create crew
  const crew = new Crew({
    id: `organic_content_${Date.now()}`,
    name: 'Organic Content Crew',
    description: `Criação de conteúdo orgânico: ${topic}`,
    agents: [],
    tasks: [],
    process: 'sequential',
  });

  // Add agents
  const strategist = createHeadStrategist(clientId);
  const trendHunter = createTrendHunter();
  const hookSpecialist = createHookSpecialist();
  const ctaSpecialist = createCtaSpecialist();
  const brandGuardian = createBrandGuardian(clientId);

  crew.addAgent(strategist);
  crew.addAgent(trendHunter);
  crew.addAgent(hookSpecialist);
  crew.addAgent(ctaSpecialist);
  crew.addAgent(brandGuardian);

  // Add platform-specific agents
  if (platform === 'instagram' || platform === 'both') {
    const instagramExpert = createInstagramExpert(clientId);
    crew.addAgent(instagramExpert);
  }
  if (platform === 'linkedin' || platform === 'both') {
    const linkedinExpert = createLinkedinExpert(clientId);
    crew.addAgent(linkedinExpert);
  }

  // Add design agents
  if (contentType === 'carousel') {
    const carouselDesigner = createGraphicDesignerCarousels(clientId);
    crew.addAgent(carouselDesigner);
  } else {
    const postDesigner = createGraphicDesignerPosts(clientId);
    crew.addAgent(postDesigner);
  }

  const socialManager = createSocialMediaManager();
  crew.addAgent(socialManager);

  // Create tasks
  const task1 = new Task({
    id: 'strategy',
    description: `Crie um briefing estratégico para o seguinte tema: "${topic}"
    
Plataforma: ${platform}
Tipo de conteúdo: ${contentType}
${objective ? `Objetivo: ${objective}` : ''}
${additionalContext ? `Contexto adicional: ${additionalContext}` : ''}`,
    expectedOutput: 'Briefing completo com ângulo, tom de voz e mensagens-chave',
    agentId: strategist.id,
  });

  const task2 = new Task({
    id: 'trends',
    description: `Pesquise tendências relacionadas ao tema "${topic}" para ${platform}`,
    expectedOutput: '3-5 tendências aplicáveis com sugestões de uso',
    agentId: trendHunter.id,
    dependencies: ['strategy'],
  });

  const task3 = new Task({
    id: 'hooks',
    description: `Crie hooks poderosos para o conteúdo sobre "${topic}"`,
    expectedOutput: '5-7 opções de hook ranqueadas',
    agentId: hookSpecialist.id,
    dependencies: ['strategy', 'trends'],
  });

  const copyAgentId = platform === 'linkedin' 
    ? 'copy_linkedin_expert' 
    : 'copy_instagram_expert';
  
  const task4 = new Task({
    id: 'copy',
    description: `Crie o copy completo para ${platform} sobre "${topic}"`,
    expectedOutput: 'Copy com variações, hashtags e CTA',
    agentId: copyAgentId,
    dependencies: ['strategy', 'hooks'],
  });

  const task5 = new Task({
    id: 'cta',
    description: `Otimize o CTA para o conteúdo sobre "${topic}"`,
    expectedOutput: 'CTAs otimizados para conversão',
    agentId: ctaSpecialist.id,
    dependencies: ['copy'],
  });

  const designAgentId = contentType === 'carousel'
    ? 'graphic_designer_carousels'
    : 'graphic_designer_posts';

  const task6 = new Task({
    id: 'design',
    description: `Crie a direção de arte para o ${contentType} sobre "${topic}"`,
    expectedOutput: 'Prompt detalhado para criativo com especificações visuais',
    agentId: designAgentId,
    dependencies: ['strategy', 'copy'],
  });

  const task7 = new Task({
    id: 'brand_review',
    description: `Valide o conteúdo criado contra as diretrizes da marca`,
    expectedOutput: 'Aprovação ou lista de ajustes',
    agentId: brandGuardian.id,
    dependencies: ['copy', 'design'],
  });

  const task8 = new Task({
    id: 'schedule',
    description: `Defina melhor horário e frequência para publicação`,
    expectedOutput: 'Recomendação de agendamento',
    agentId: socialManager.id,
    dependencies: ['brand_review'],
  });

  // Add tasks
  crew.addTask(task1);
  crew.addTask(task2);
  crew.addTask(task3);
  crew.addTask(task4);
  crew.addTask(task5);
  crew.addTask(task6);
  crew.addTask(task7);
  crew.addTask(task8);

  // Execute
  return crew.kickoff();
}
