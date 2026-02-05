/**
 * Paid Content Crew
 * Crew especializada em conteúdo para mídia paga (Meta Ads, Google Ads)
 */

import { Crew } from '../core/crew';
import { Task } from '../core/task';
import { CrewExecutionResult } from '../core/types';
import {
  createHeadStrategist,
  createCampaignPlanner,
} from '../agents/strategic';
import {
  createAdsExpert,
  createCtaSpecialist,
  createHookSpecialist,
} from '../agents/copywriters';
import {
  createGraphicDesignerPosts,
  createVideoHookSpecialist,
} from '../agents/visual';
import {
  createTrafficManager,
  createMetaAdsSpecialist,
} from '../agents/distribution';
import { createBrandGuardian } from '../agents/quality';

export interface PaidContentRequest {
  clientId: string;
  campaignObjective: 'awareness' | 'traffic' | 'leads' | 'sales' | 'app_installs';
  product: string;
  targetAudience: string;
  budget?: string;
  platform: 'meta' | 'google' | 'tiktok' | 'all';
  additionalContext?: string;
}

export async function runPaidContentCrew(
  request: PaidContentRequest
): Promise<CrewExecutionResult> {
  const { 
    clientId, 
    campaignObjective, 
    product, 
    targetAudience, 
    budget, 
    platform, 
    additionalContext 
  } = request;

  // Create crew
  const crew = new Crew({
    id: `paid_content_${Date.now()}`,
    name: 'Paid Content Crew',
    description: `Campanha de mídia paga: ${product}`,
    agents: [],
    tasks: [],
    process: 'sequential',
  });

  // Add agents
  const strategist = createHeadStrategist(clientId);
  const campaignPlanner = createCampaignPlanner(clientId);
  const adsExpert = createAdsExpert(clientId);
  const ctaSpecialist = createCtaSpecialist();
  const hookSpecialist = createHookSpecialist();
  const designer = createGraphicDesignerPosts(clientId);
  const videoHook = createVideoHookSpecialist();
  const trafficManager = createTrafficManager();
  const metaSpecialist = createMetaAdsSpecialist();
  const brandGuardian = createBrandGuardian(clientId);

  crew.addAgent(strategist);
  crew.addAgent(campaignPlanner);
  crew.addAgent(adsExpert);
  crew.addAgent(ctaSpecialist);
  crew.addAgent(hookSpecialist);
  crew.addAgent(designer);
  crew.addAgent(videoHook);
  crew.addAgent(trafficManager);
  crew.addAgent(metaSpecialist);
  crew.addAgent(brandGuardian);

  // Create tasks
  const task1 = new Task({
    id: 'campaign_strategy',
    description: `Defina estratégia para campanha de ${campaignObjective}

Produto/Serviço: ${product}
Público-alvo: ${targetAudience}
${budget ? `Budget: ${budget}` : ''}
Plataforma: ${platform}
${additionalContext ? `Contexto: ${additionalContext}` : ''}`,
    expectedOutput: 'Estratégia com objetivos, KPIs e approach',
    agentId: strategist.id,
  });

  const task2 = new Task({
    id: 'campaign_plan',
    description: `Crie plano de campanha detalhado para ${product}`,
    expectedOutput: 'Plano com estrutura, públicos, fases e cronograma',
    agentId: campaignPlanner.id,
    dependencies: ['campaign_strategy'],
  });

  const task3 = new Task({
    id: 'ad_copies',
    description: `Crie copies para anúncios de ${product}

Objetivo: ${campaignObjective}
Público: ${targetAudience}`,
    expectedOutput: 'Variações de primary text, headline, description',
    agentId: adsExpert.id,
    dependencies: ['campaign_strategy'],
  });

  const task4 = new Task({
    id: 'hooks_ads',
    description: `Crie hooks para os anúncios de ${product}`,
    expectedOutput: '5 hooks para diferentes abordagens',
    agentId: hookSpecialist.id,
    dependencies: ['ad_copies'],
  });

  const task5 = new Task({
    id: 'ctas_ads',
    description: `Otimize CTAs para anúncios de ${product}`,
    expectedOutput: 'CTAs por estágio do funil',
    agentId: ctaSpecialist.id,
    dependencies: ['ad_copies'],
  });

  const task6 = new Task({
    id: 'ad_creatives',
    description: `Crie direção de arte para anúncios de ${product}`,
    expectedOutput: 'Prompts para criativos estáticos e vídeo',
    agentId: designer.id,
    dependencies: ['campaign_strategy', 'ad_copies'],
  });

  const task7 = new Task({
    id: 'video_hooks_ads',
    description: `Crie hooks de vídeo para anúncios de ${product}`,
    expectedOutput: 'Scripts de 3-5 segundos para vídeo ads',
    agentId: videoHook.id,
    dependencies: ['campaign_strategy'],
  });

  const task8 = new Task({
    id: 'campaign_structure',
    description: `Defina estrutura técnica da campanha no ${platform}`,
    expectedOutput: 'Estrutura de campanha, ad sets, públicos',
    agentId: trafficManager.id,
    dependencies: ['campaign_plan'],
  });

  const task9 = new Task({
    id: 'meta_config',
    description: `Configure detalhes específicos para Meta Ads`,
    expectedOutput: 'Configurações de públicos, objetivos, otimização',
    agentId: metaSpecialist.id,
    dependencies: ['campaign_structure'],
  });

  const task10 = new Task({
    id: 'brand_review',
    description: `Valide toda a campanha contra diretrizes da marca`,
    expectedOutput: 'Aprovação ou ajustes necessários',
    agentId: brandGuardian.id,
    dependencies: ['ad_copies', 'ad_creatives'],
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
  crew.addTask(task9);
  crew.addTask(task10);

  // Execute
  return crew.kickoff();
}
