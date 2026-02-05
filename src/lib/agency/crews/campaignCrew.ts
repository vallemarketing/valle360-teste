/**
 * Campaign Crew
 * Crew para campanhas completas 360°
 */

import { Crew } from '../core/crew';
import { Task } from '../core/task';
import { CrewExecutionResult } from '../core/types';
import {
  createHeadStrategist,
  createCampaignPlanner,
  createTrendHunter,
  createCompetitorAnalyst,
} from '../agents/strategic';
import {
  createInstagramExpert,
  createLinkedinExpert,
  createAdsExpert,
  createHookSpecialist,
  createCtaSpecialist,
} from '../agents/copywriters';
import {
  createGraphicDesignerPosts,
  createGraphicDesignerCarousels,
  createVideoScriptWriter,
} from '../agents/visual';
import {
  createTrafficManager,
  createSocialMediaManager,
} from '../agents/distribution';
import { createBrandGuardian } from '../agents/quality';

export interface CampaignRequest {
  clientId: string;
  campaignName: string;
  objective: string;
  duration: string; // e.g., "30 dias", "3 meses"
  channels: ('instagram' | 'linkedin' | 'facebook' | 'youtube' | 'paid')[];
  budget?: string;
  targetAudience: string;
  keyMessages: string[];
  additionalContext?: string;
}

export async function runCampaignCrew(
  request: CampaignRequest
): Promise<CrewExecutionResult> {
  const { 
    clientId, 
    campaignName, 
    objective, 
    duration, 
    channels, 
    budget, 
    targetAudience, 
    keyMessages,
    additionalContext,
  } = request;

  // Create crew
  const crew = new Crew({
    id: `campaign_${Date.now()}`,
    name: 'Full Campaign Crew',
    description: `Campanha 360°: ${campaignName}`,
    agents: [],
    tasks: [],
    process: 'sequential',
  });

  // Add all strategic agents
  const strategist = createHeadStrategist(clientId);
  const campaignPlanner = createCampaignPlanner(clientId);
  const trendHunter = createTrendHunter();
  const competitorAnalyst = createCompetitorAnalyst();

  crew.addAgent(strategist);
  crew.addAgent(campaignPlanner);
  crew.addAgent(trendHunter);
  crew.addAgent(competitorAnalyst);

  // Add copywriters
  const instagramExpert = createInstagramExpert(clientId);
  const linkedinExpert = createLinkedinExpert(clientId);
  const adsExpert = createAdsExpert(clientId);
  const hookSpecialist = createHookSpecialist();
  const ctaSpecialist = createCtaSpecialist();

  crew.addAgent(instagramExpert);
  crew.addAgent(linkedinExpert);
  crew.addAgent(adsExpert);
  crew.addAgent(hookSpecialist);
  crew.addAgent(ctaSpecialist);

  // Add visual agents
  const postDesigner = createGraphicDesignerPosts(clientId);
  const carouselDesigner = createGraphicDesignerCarousels(clientId);
  const videoScriptWriter = createVideoScriptWriter(clientId);

  crew.addAgent(postDesigner);
  crew.addAgent(carouselDesigner);
  crew.addAgent(videoScriptWriter);

  // Add distribution
  const trafficManager = createTrafficManager();
  const socialManager = createSocialMediaManager();

  crew.addAgent(trafficManager);
  crew.addAgent(socialManager);

  // Add quality
  const brandGuardian = createBrandGuardian(clientId);
  crew.addAgent(brandGuardian);

  // Create tasks - Phase 1: Strategy
  const task1 = new Task({
    id: 'campaign_brief',
    description: `Crie briefing estratégico para a campanha "${campaignName}"

Objetivo: ${objective}
Duração: ${duration}
Canais: ${channels.join(', ')}
${budget ? `Budget: ${budget}` : ''}
Público-alvo: ${targetAudience}
Mensagens-chave: ${keyMessages.join(', ')}
${additionalContext ? `Contexto: ${additionalContext}` : ''}`,
    expectedOutput: 'Briefing completo com posicionamento, tom e diretrizes',
    agentId: strategist.id,
  });

  const task2 = new Task({
    id: 'competitor_analysis',
    description: `Analise concorrentes para a campanha "${campaignName}"`,
    expectedOutput: 'Análise competitiva com gaps e oportunidades',
    agentId: competitorAnalyst.id,
    dependencies: ['campaign_brief'],
  });

  const task3 = new Task({
    id: 'trend_research',
    description: `Pesquise tendências relevantes para "${campaignName}"`,
    expectedOutput: 'Tendências aplicáveis por canal',
    agentId: trendHunter.id,
    dependencies: ['campaign_brief'],
  });

  const task4 = new Task({
    id: 'campaign_plan',
    description: `Crie plano detalhado da campanha "${campaignName}"`,
    expectedOutput: 'Plano com fases, cronograma, KPIs e alocação de budget',
    agentId: campaignPlanner.id,
    dependencies: ['campaign_brief', 'competitor_analysis', 'trend_research'],
  });

  // Phase 2: Content Creation
  const task5 = new Task({
    id: 'instagram_content',
    description: `Crie conteúdo para Instagram da campanha "${campaignName}"`,
    expectedOutput: 'Pack de conteúdo: posts, carrosséis, stories, reels',
    agentId: instagramExpert.id,
    dependencies: ['campaign_plan'],
  });

  const task6 = new Task({
    id: 'linkedin_content',
    description: `Crie conteúdo para LinkedIn da campanha "${campaignName}"`,
    expectedOutput: 'Pack de posts e artigos para LinkedIn',
    agentId: linkedinExpert.id,
    dependencies: ['campaign_plan'],
  });

  const task7 = new Task({
    id: 'ads_content',
    description: `Crie conteúdo para mídia paga da campanha "${campaignName}"`,
    expectedOutput: 'Pack de anúncios para Meta e Google',
    agentId: adsExpert.id,
    dependencies: ['campaign_plan'],
  });

  const task8 = new Task({
    id: 'hooks_ctas',
    description: `Crie hooks e CTAs para a campanha "${campaignName}"`,
    expectedOutput: 'Library de hooks e CTAs por formato',
    agentId: hookSpecialist.id,
    dependencies: ['campaign_plan'],
  });

  // Phase 3: Visual Direction
  const task9 = new Task({
    id: 'visual_direction',
    description: `Crie direção de arte para a campanha "${campaignName}"`,
    expectedOutput: 'Guia visual com prompts para todos os formatos',
    agentId: postDesigner.id,
    dependencies: ['campaign_plan', 'instagram_content', 'ads_content'],
  });

  const task10 = new Task({
    id: 'video_scripts',
    description: `Crie roteiros de vídeo para a campanha "${campaignName}"`,
    expectedOutput: 'Roteiros para Reels, Stories e anúncios em vídeo',
    agentId: videoScriptWriter.id,
    dependencies: ['campaign_plan', 'hooks_ctas'],
  });

  // Phase 4: Distribution
  const task11 = new Task({
    id: 'media_plan',
    description: `Crie plano de mídia paga para "${campaignName}"`,
    expectedOutput: 'Estrutura de campanhas, públicos, orçamento por fase',
    agentId: trafficManager.id,
    dependencies: ['campaign_plan', 'ads_content'],
  });

  const task12 = new Task({
    id: 'editorial_calendar',
    description: `Crie calendário editorial para "${campaignName}"`,
    expectedOutput: 'Calendário com datas, horários e conteúdo por canal',
    agentId: socialManager.id,
    dependencies: ['instagram_content', 'linkedin_content'],
  });

  // Phase 5: Quality Review
  const task13 = new Task({
    id: 'brand_review',
    description: `Faça revisão completa da campanha "${campaignName}"`,
    expectedOutput: 'Aprovação final ou lista de ajustes',
    agentId: brandGuardian.id,
    dependencies: ['visual_direction', 'video_scripts', 'media_plan', 'editorial_calendar'],
  });

  // Add all tasks
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
  crew.addTask(task11);
  crew.addTask(task12);
  crew.addTask(task13);

  // Execute
  return crew.kickoff();
}
