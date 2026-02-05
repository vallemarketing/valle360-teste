/**
 * Crew Builder - Dynamically builds crews based on demand analysis
 */

import { Crew } from '../core/crew';
import { Task } from '../core/task';
import { Agent } from '../core/agent';
import { DemandAnalysis } from './demandAnalyzer';

// Import all agent factories
import {
  createHeadStrategist,
  createTrendHunter,
  createCompetitorAnalyst,
  createCampaignPlanner,
} from '../agents/strategic';

import {
  createInstagramExpert,
  createLinkedinExpert,
  createYoutubeExpert,
  createAdsExpert,
  createCtaSpecialist,
  createHookSpecialist,
} from '../agents/copywriters';

import {
  createGraphicDesignerPosts,
  createGraphicDesignerCarousels,
  createVideoScriptWriter,
  createVideoHookSpecialist,
  createReelsSpecialist,
} from '../agents/visual';

import {
  createSocialMediaManager,
  createSchedulerAgent,
  createTrafficManager,
  createMetaAdsSpecialist,
} from '../agents/distribution';

import {
  createBrandGuardian,
  createPersonaSkeptic,
  createPersonaEnthusiast,
  createPersonaBusyExecutive,
} from '../agents/quality';

// Agent factory mapping
const agentFactories: Record<string, (clientId?: string) => Agent> = {
  head_strategist: createHeadStrategist,
  trend_hunter: createTrendHunter,
  competitor_analyst: createCompetitorAnalyst,
  campaign_planner: createCampaignPlanner,
  copy_instagram_expert: createInstagramExpert,
  copy_linkedin_expert: createLinkedinExpert,
  copy_youtube_expert: createYoutubeExpert,
  copy_ads_expert: createAdsExpert,
  cta_specialist: createCtaSpecialist,
  hook_specialist: createHookSpecialist,
  graphic_designer_posts: createGraphicDesignerPosts,
  graphic_designer_carousels: createGraphicDesignerCarousels,
  video_script_writer: createVideoScriptWriter,
  video_hook_specialist: createVideoHookSpecialist,
  reels_specialist: createReelsSpecialist,
  social_media_manager: createSocialMediaManager,
  scheduler_agent: createSchedulerAgent,
  traffic_manager: createTrafficManager,
  meta_ads_specialist: createMetaAdsSpecialist,
  brand_guardian: createBrandGuardian,
  persona_skeptic: createPersonaSkeptic,
  persona_enthusiast: createPersonaEnthusiast,
  persona_busy_executive: createPersonaBusyExecutive,
};

export interface CrewBuildResult {
  crew: Crew;
  agents: Agent[];
  tasks: Task[];
}

/**
 * Build a crew dynamically based on demand analysis
 */
export function buildCrew(
  analysis: DemandAnalysis,
  clientId: string,
  topic: string,
  objective?: string
): CrewBuildResult {
  // Create crew
  const crew = new Crew({
    id: `${analysis.crewRecommended}_${Date.now()}`,
    name: analysis.crewRecommended,
    description: `Crew para ${analysis.demandType}: ${topic}`,
    agents: analysis.agentsNeeded,
    tasks: [],
    process: 'sequential',
  });

  // Create agents
  const agents: Agent[] = [];
  for (const agentId of analysis.agentsNeeded) {
    const factory = agentFactories[agentId];
    if (factory) {
      const agent = factory(clientId);
      agents.push(agent);
      crew.addAgent(agent);
    }
  }

  // Create tasks based on suggested tasks
  const tasks: Task[] = [];
  for (let i = 0; i < analysis.suggestedTasks.length; i++) {
    const taskDescription = analysis.suggestedTasks[i];
    const agentId = analysis.agentsNeeded[i % analysis.agentsNeeded.length];
    
    const task = new Task({
      id: `task_${i + 1}`,
      description: `${taskDescription}\n\nTema: ${topic}${objective ? `\nObjetivo: ${objective}` : ''}`,
      expectedOutput: getExpectedOutput(taskDescription),
      agentId,
      dependencies: i > 0 ? [`task_${i}`] : undefined,
    });

    tasks.push(task);
    crew.addTask(task);
  }

  return { crew, agents, tasks };
}

function getExpectedOutput(taskDescription: string): string {
  const outputs: Record<string, string> = {
    'Análise estratégica': 'Briefing estratégico com ângulo, tom e mensagens-chave',
    'Pesquisa de tendências': 'Lista de 3-5 tendências aplicáveis com sugestões',
    'Criação do copy': 'Copy completo com variações, hashtags e CTA',
    'Direção de arte': 'Prompt detalhado para criativo com cores, tipografia e estilo',
    'Otimização de hook': '5 opções de hook ranqueadas por potencial',
    'default': 'Entregável completo e pronto para uso',
  };

  for (const [key, output] of Object.entries(outputs)) {
    if (taskDescription.toLowerCase().includes(key.toLowerCase())) {
      return output;
    }
  }

  return outputs.default;
}

/**
 * Build focus group crew for content validation
 */
export function buildFocusGroupCrew(clientId: string): CrewBuildResult {
  const crew = new Crew({
    id: `focus_group_${Date.now()}`,
    name: 'focus_group_crew',
    description: 'Focus Group Sintético para validação de conteúdo',
    agents: ['brand_guardian', 'persona_skeptic', 'persona_enthusiast', 'persona_busy_executive'],
    tasks: [],
    process: 'sequential',
  });

  const agents: Agent[] = [
    createBrandGuardian(clientId),
    createPersonaSkeptic(),
    createPersonaEnthusiast(),
    createPersonaBusyExecutive(),
  ];

  agents.forEach(agent => crew.addAgent(agent));

  const tasks: Task[] = [
    new Task({
      id: 'brand_validation',
      description: 'Valide o conteúdo contra as diretrizes da marca',
      expectedOutput: 'Aprovado ou lista de ajustes necessários',
      agentId: 'brand_guardian',
    }),
    new Task({
      id: 'skeptic_review',
      description: 'Avalie o conteúdo com olhar crítico',
      expectedOutput: 'Nota 0-10, positivos, negativos, sugestões',
      agentId: 'persona_skeptic',
      dependencies: ['brand_validation'],
    }),
    new Task({
      id: 'enthusiast_review',
      description: 'Avalie o conteúdo com olhar de entusiasta',
      expectedOutput: 'Nota 0-10, positivos, negativos, sugestões',
      agentId: 'persona_enthusiast',
      dependencies: ['brand_validation'],
    }),
    new Task({
      id: 'executive_review',
      description: 'Avalie o conteúdo com olhar de executivo ocupado',
      expectedOutput: 'Nota 0-10, positivos, negativos, sugestões',
      agentId: 'persona_busy_executive',
      dependencies: ['brand_validation'],
    }),
  ];

  tasks.forEach(task => crew.addTask(task));

  return { crew, agents, tasks };
}
