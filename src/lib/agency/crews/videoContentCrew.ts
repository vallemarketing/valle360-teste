/**
 * Video Content Crew
 * Crew especializada em conteúdo de vídeo (YouTube, Reels, TikTok)
 */

import { Crew } from '../core/crew';
import { Task } from '../core/task';
import { CrewExecutionResult } from '../core/types';
import {
  createHeadStrategist,
  createTrendHunter,
} from '../agents/strategic';
import {
  createYoutubeExpert,
  createInstagramExpert,
  createHookSpecialist,
} from '../agents/copywriters';
import {
  createVideoScriptWriter,
  createVideoHookSpecialist,
  createReelsSpecialist,
  createGraphicDesignerPosts,
} from '../agents/visual';
import { createBrandGuardian } from '../agents/quality';

export interface VideoContentRequest {
  clientId: string;
  topic: string;
  platform: 'youtube' | 'reels' | 'tiktok' | 'shorts';
  videoLength: 'short' | 'medium' | 'long'; // 15-60s, 1-5min, 5-15min
  objective?: string;
  additionalContext?: string;
}

export async function runVideoContentCrew(
  request: VideoContentRequest
): Promise<CrewExecutionResult> {
  const { clientId, topic, platform, videoLength, objective, additionalContext } = request;

  // Create crew
  const crew = new Crew({
    id: `video_content_${Date.now()}`,
    name: 'Video Content Crew',
    description: `Criação de conteúdo de vídeo: ${topic}`,
    agents: [],
    tasks: [],
    process: 'sequential',
  });

  // Add common agents
  const strategist = createHeadStrategist(clientId);
  const trendHunter = createTrendHunter();
  const videoHookSpecialist = createVideoHookSpecialist();
  const brandGuardian = createBrandGuardian(clientId);
  const thumbnailDesigner = createGraphicDesignerPosts(clientId);

  crew.addAgent(strategist);
  crew.addAgent(trendHunter);
  crew.addAgent(videoHookSpecialist);
  crew.addAgent(brandGuardian);
  crew.addAgent(thumbnailDesigner);

  // Add platform-specific agents
  if (platform === 'youtube') {
    const youtubeExpert = createYoutubeExpert(clientId);
    const scriptWriter = createVideoScriptWriter(clientId);
    crew.addAgent(youtubeExpert);
    crew.addAgent(scriptWriter);
  } else {
    // Reels, TikTok, Shorts
    const reelsSpecialist = createReelsSpecialist();
    const instagramExpert = createInstagramExpert(clientId);
    crew.addAgent(reelsSpecialist);
    crew.addAgent(instagramExpert);
  }

  // Create tasks
  const task1 = new Task({
    id: 'strategy',
    description: `Crie um briefing estratégico para vídeo sobre: "${topic}"
    
Plataforma: ${platform}
Duração: ${videoLength}
${objective ? `Objetivo: ${objective}` : ''}
${additionalContext ? `Contexto adicional: ${additionalContext}` : ''}`,
    expectedOutput: 'Briefing com ângulo, tom e estrutura sugerida',
    agentId: strategist.id,
  });

  const task2 = new Task({
    id: 'trends',
    description: `Pesquise tendências de vídeo para "${topic}" em ${platform}`,
    expectedOutput: 'Tendências, formatos e sons em alta',
    agentId: trendHunter.id,
    dependencies: ['strategy'],
  });

  const task3 = new Task({
    id: 'video_hooks',
    description: `Crie hooks poderosos para os primeiros segundos do vídeo sobre "${topic}"`,
    expectedOutput: '5 opções de hook com FALA + VISUAL + TEXTO',
    agentId: videoHookSpecialist.id,
    dependencies: ['strategy', 'trends'],
  });

  // Platform-specific tasks
  if (platform === 'youtube') {
    const task4 = new Task({
      id: 'titles_seo',
      description: `Crie títulos e descrição SEO para vídeo YouTube sobre "${topic}"`,
      expectedOutput: '5 títulos, descrição otimizada, 15-20 tags',
      agentId: 'copy_youtube_expert',
      dependencies: ['strategy'],
    });

    const task5 = new Task({
      id: 'script',
      description: `Escreva o roteiro completo para vídeo ${videoLength} sobre "${topic}"`,
      expectedOutput: 'Roteiro com NARRAÇÃO, VISUAL, TEXTO, TIMING',
      agentId: 'video_script_writer',
      dependencies: ['strategy', 'video_hooks'],
    });

    crew.addTask(task1);
    crew.addTask(task2);
    crew.addTask(task3);
    crew.addTask(task4);
    crew.addTask(task5);
  } else {
    const task4 = new Task({
      id: 'reels_script',
      description: `Crie roteiro segundo-a-segundo para ${platform} sobre "${topic}"`,
      expectedOutput: 'Roteiro com timing, texto overlay, transições',
      agentId: 'reels_specialist',
      dependencies: ['strategy', 'video_hooks', 'trends'],
    });

    const task5 = new Task({
      id: 'caption',
      description: `Crie legenda e hashtags para o ${platform} sobre "${topic}"`,
      expectedOutput: 'Legenda engajante com hashtags estratégicas',
      agentId: 'copy_instagram_expert',
      dependencies: ['reels_script'],
    });

    crew.addTask(task1);
    crew.addTask(task2);
    crew.addTask(task3);
    crew.addTask(task4);
    crew.addTask(task5);
  }

  // Common final tasks
  const thumbnailTask = new Task({
    id: 'thumbnail',
    description: `Crie conceito de thumbnail/capa para o vídeo sobre "${topic}"`,
    expectedOutput: 'Prompt detalhado para thumbnail com texto, cores, estilo',
    agentId: thumbnailDesigner.id,
    dependencies: ['strategy'],
  });

  const reviewTask = new Task({
    id: 'brand_review',
    description: `Valide todo o conteúdo contra as diretrizes da marca`,
    expectedOutput: 'Aprovação ou lista de ajustes',
    agentId: brandGuardian.id,
  });

  crew.addTask(thumbnailTask);
  crew.addTask(reviewTask);

  // Execute
  return crew.kickoff();
}
