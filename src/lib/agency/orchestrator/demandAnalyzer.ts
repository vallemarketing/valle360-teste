/**
 * Demand Analyzer - Analyzes requests and determines crew/agents needed
 */

import { OrchestratorRequest } from '../core/types';

export interface DemandAnalysis {
  demandType: string;
  crewRecommended: string;
  agentsNeeded: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: number; // in seconds
  requiresFocusGroup: boolean;
  suggestedTasks: string[];
}

/**
 * Analyzes a demand request and determines the best crew/agents
 */
export function analyzeDemand(request: OrchestratorRequest): DemandAnalysis {
  const { demandType, topic, objective, useFocusGroup } = request;

  // Map demand types to crews and agents
  const demandMappings: Record<string, Partial<DemandAnalysis>> = {
    instagram_post: {
      crewRecommended: 'organic_content_crew',
      agentsNeeded: [
        'head_strategist',
        'trend_hunter',
        'copy_instagram_expert',
        'graphic_designer_posts',
        'hook_specialist',
        'cta_specialist',
      ],
      complexity: 'medium',
      estimatedTime: 45,
      suggestedTasks: [
        'Análise estratégica e briefing',
        'Pesquisa de tendências',
        'Criação do copy',
        'Direção de arte',
        'Otimização de hook e CTA',
      ],
    },
    linkedin_post: {
      crewRecommended: 'organic_content_crew',
      agentsNeeded: [
        'head_strategist',
        'copy_linkedin_expert',
        'graphic_designer_posts',
        'hook_specialist',
      ],
      complexity: 'medium',
      estimatedTime: 40,
      suggestedTasks: [
        'Análise estratégica',
        'Criação do copy',
        'Direção de arte',
        'Otimização de hook',
      ],
    },
    youtube_video: {
      crewRecommended: 'video_content_crew',
      agentsNeeded: [
        'head_strategist',
        'trend_hunter',
        'copy_youtube_expert',
        'video_script_writer',
        'video_hook_specialist',
        'graphic_designer_posts',
      ],
      complexity: 'complex',
      estimatedTime: 120,
      suggestedTasks: [
        'Análise estratégica',
        'Pesquisa de tendências',
        'Criação de títulos e descrições',
        'Roteiro completo',
        'Hooks para retenção',
        'Thumbnail',
      ],
    },
    reels: {
      crewRecommended: 'video_content_crew',
      agentsNeeded: [
        'trend_hunter',
        'copy_instagram_expert',
        'reels_specialist',
        'video_hook_specialist',
      ],
      complexity: 'medium',
      estimatedTime: 35,
      suggestedTasks: [
        'Pesquisa de trends',
        'Copy e legenda',
        'Roteiro do Reels',
        'Hook de abertura',
      ],
    },
    carousel: {
      crewRecommended: 'organic_content_crew',
      agentsNeeded: [
        'head_strategist',
        'copy_instagram_expert',
        'graphic_designer_carousels',
        'hook_specialist',
        'cta_specialist',
      ],
      complexity: 'medium',
      estimatedTime: 60,
      suggestedTasks: [
        'Estrutura narrativa',
        'Copy por slide',
        'Design do carrossel',
        'Hook inicial',
        'CTA final',
      ],
    },
    meta_ads_campaign: {
      crewRecommended: 'paid_content_crew',
      agentsNeeded: [
        'head_strategist',
        'campaign_planner',
        'copy_ads_expert',
        'traffic_manager',
        'meta_ads_specialist',
        'graphic_designer_posts',
      ],
      complexity: 'complex',
      estimatedTime: 90,
      suggestedTasks: [
        'Estratégia de campanha',
        'Planejamento de funil',
        'Copies para ads',
        'Estrutura de campanha',
        'Configuração Meta Ads',
        'Criativos',
      ],
    },
    full_campaign: {
      crewRecommended: 'campaign_crew',
      agentsNeeded: [
        'head_strategist',
        'campaign_planner',
        'trend_hunter',
        'competitor_analyst',
        'copy_instagram_expert',
        'copy_linkedin_expert',
        'copy_ads_expert',
        'graphic_designer_posts',
        'graphic_designer_carousels',
        'video_script_writer',
        'traffic_manager',
        'social_media_manager',
      ],
      complexity: 'complex',
      estimatedTime: 300,
      suggestedTasks: [
        'Estratégia geral',
        'Planejamento de campanha',
        'Análise de tendências',
        'Análise competitiva',
        'Conteúdo orgânico',
        'Conteúdo pago',
        'Criativos visuais',
        'Vídeos',
        'Gestão de tráfego',
        'Calendário',
      ],
    },
  };

  const mapping = demandMappings[demandType] || demandMappings.instagram_post;

  return {
    demandType,
    crewRecommended: mapping.crewRecommended!,
    agentsNeeded: mapping.agentsNeeded!,
    complexity: mapping.complexity!,
    estimatedTime: mapping.estimatedTime!,
    requiresFocusGroup: useFocusGroup ?? mapping.complexity === 'complex',
    suggestedTasks: mapping.suggestedTasks!,
  };
}
