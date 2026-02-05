/**
 * Content to Kanban - Automatically creates Kanban tasks based on AI content output
 * Detects what resources are needed and creates appropriate tasks for each team
 */

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export interface ContentOutput {
  strategy?: string;
  copy?: string;
  visualPrompt?: string;
  hashtags?: string[];
  cta?: string;
  videoScript?: string;
  carouselSlides?: string[];
}

export interface KanbanTaskDraft {
  title: string;
  description: string;
  area: string;
  targetColumn: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours?: number;
  metadata?: Record<string, any>;
}

export interface ContentAnalysisResult {
  needsDesign: boolean;
  needsVideo: boolean;
  needsSocialMedia: boolean;
  needsCopywriting: boolean;
  detectedFormats: string[];
  suggestedTasks: KanbanTaskDraft[];
}

/**
 * Analyzes the generated content and determines what Kanban tasks need to be created
 */
export function analyzeContentForTasks(
  demandType: string,
  content: ContentOutput,
  clientName: string
): ContentAnalysisResult {
  const result: ContentAnalysisResult = {
    needsDesign: false,
    needsVideo: false,
    needsSocialMedia: false,
    needsCopywriting: false,
    detectedFormats: [],
    suggestedTasks: [],
  };

  // Detect video needs
  const videoKeywords = [
    'vídeo', 'video', 'reels', 'reel', 'gravação', 'filmagem',
    'edição de vídeo', 'roteiro', 'script', 'youtube', 'tiktok'
  ];
  
  const contentText = JSON.stringify(content).toLowerCase();
  
  if (
    demandType === 'reels' ||
    demandType === 'youtube_video' ||
    content.videoScript ||
    videoKeywords.some(kw => contentText.includes(kw))
  ) {
    result.needsVideo = true;
    result.detectedFormats.push('video');
    
    result.suggestedTasks.push({
      title: `📹 Vídeo - ${clientName}`,
      description: content.videoScript || `Produzir vídeo baseado no briefing:\n\n${content.copy?.substring(0, 500) || 'Ver detalhes no card'}`,
      area: 'Videomaker',
      targetColumn: 'briefing',
      priority: 'high',
      estimatedHours: 4,
      metadata: {
        demandType,
        visualPrompt: content.visualPrompt,
      },
    });
  }

  // Detect design/visual needs
  const designKeywords = [
    'arte', 'design', 'visual', 'imagem', 'banner', 'post',
    'carrossel', 'carousel', 'feed', 'stories', 'story'
  ];
  
  if (
    demandType === 'instagram_post' ||
    demandType === 'carousel' ||
    content.visualPrompt ||
    content.carouselSlides ||
    designKeywords.some(kw => contentText.includes(kw))
  ) {
    result.needsDesign = true;
    result.detectedFormats.push('static_image');
    
    const isCarousel = demandType === 'carousel' || (content.carouselSlides && content.carouselSlides.length > 0);
    
    result.suggestedTasks.push({
      title: isCarousel ? `🎨 Carrossel - ${clientName}` : `🎨 Arte - ${clientName}`,
      description: content.visualPrompt || `Criar ${isCarousel ? 'carrossel' : 'arte'} para:\n\n${content.copy?.substring(0, 300) || 'Ver briefing'}`,
      area: 'Designer',
      targetColumn: 'briefing',
      priority: 'medium',
      estimatedHours: isCarousel ? 3 : 2,
      metadata: {
        demandType,
        visualPrompt: content.visualPrompt,
        carouselSlides: content.carouselSlides,
      },
    });
  }

  // Social Media task for scheduling/publishing
  if (content.copy) {
    result.needsSocialMedia = true;
    result.detectedFormats.push('social_post');
    
    result.suggestedTasks.push({
      title: `📱 Publicar - ${clientName}`,
      description: `Agendar/publicar conteúdo:\n\n${content.copy.substring(0, 400)}\n\n${content.hashtags?.join(' ') || ''}`,
      area: 'Social Media',
      targetColumn: 'aprovacao_interna',
      priority: 'medium',
      estimatedHours: 0.5,
      metadata: {
        demandType,
        copy: content.copy,
        hashtags: content.hashtags,
        cta: content.cta,
      },
    });
  }

  return result;
}

/**
 * Creates Kanban tasks in the database based on the analysis
 */
export async function createKanbanTasksFromContent(
  clientId: string,
  clientName: string,
  demandType: string,
  content: ContentOutput,
  createdBy: string
): Promise<{ success: boolean; tasksCreated: number; taskIds: string[]; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Analyze content to determine needed tasks
    const analysis = analyzeContentForTasks(demandType, content, clientName);
    
    if (analysis.suggestedTasks.length === 0) {
      return { success: true, tasksCreated: 0, taskIds: [] };
    }

    const taskIds: string[] = [];

    for (const taskDraft of analysis.suggestedTasks) {
      // Find the appropriate board for this area
      const { data: boards } = await supabase
        .from('kanban_boards')
        .select('id, name')
        .or(`department.ilike.%${taskDraft.area}%,name.ilike.%${taskDraft.area}%`)
        .limit(1);

      let boardId = boards?.[0]?.id;

      // If no specific board found, try to find a general one or create task without board reference
      if (!boardId) {
        const { data: generalBoards } = await supabase
          .from('kanban_boards')
          .select('id')
          .limit(1);
        boardId = generalBoards?.[0]?.id;
      }

      if (!boardId) {
        console.warn(`No board found for area: ${taskDraft.area}`);
        continue;
      }

      // Find the target column
      const { data: columns } = await supabase
        .from('kanban_columns')
        .select('id')
        .eq('board_id', boardId)
        .ilike('name', `%${taskDraft.targetColumn}%`)
        .limit(1);

      // If target column not found, get first column
      let columnId = columns?.[0]?.id;
      if (!columnId) {
        const { data: firstColumn } = await supabase
          .from('kanban_columns')
          .select('id')
          .eq('board_id', boardId)
          .order('position', { ascending: true })
          .limit(1);
        columnId = firstColumn?.[0]?.id;
      }

      if (!columnId) {
        console.warn(`No column found for board: ${boardId}`);
        continue;
      }

      // Get next position
      const { data: lastTask } = await supabase
        .from('kanban_tasks')
        .select('position')
        .eq('column_id', columnId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (lastTask?.[0]?.position || 0) + 1;

      // Create the task
      const { data: newTask, error: taskError } = await supabase
        .from('kanban_tasks')
        .insert({
          board_id: boardId,
          column_id: columnId,
          title: taskDraft.title,
          description: taskDraft.description,
          priority: taskDraft.priority,
          status: 'backlog',
          position: nextPosition,
          estimated_hours: taskDraft.estimatedHours,
          created_by: createdBy,
          tags: [`ia-generated`, taskDraft.area.toLowerCase().replace(/\s+/g, '-')],
          attachments: taskDraft.metadata ? { ai_metadata: taskDraft.metadata } : null,
        })
        .select('id')
        .single();

      if (taskError) {
        console.error('Error creating kanban task:', taskError);
        continue;
      }

      if (newTask) {
        taskIds.push(newTask.id);
      }
    }

    return {
      success: true,
      tasksCreated: taskIds.length,
      taskIds,
    };
  } catch (error: any) {
    console.error('Error in createKanbanTasksFromContent:', error);
    return {
      success: false,
      tasksCreated: 0,
      taskIds: [],
      error: error.message,
    };
  }
}

/**
 * Detects if the content requires any external resources (design, video, etc.)
 */
export function detectRequiredResources(demandType: string, content: ContentOutput): string[] {
  const resources: string[] = [];

  // Video resources
  if (
    demandType === 'reels' ||
    demandType === 'youtube_video' ||
    content.videoScript
  ) {
    resources.push('video_production');
  }

  // Design resources
  if (
    content.visualPrompt ||
    content.carouselSlides ||
    demandType === 'instagram_post' ||
    demandType === 'carousel'
  ) {
    resources.push('graphic_design');
  }

  // Photography/Stock
  if (content.visualPrompt?.toLowerCase().includes('foto')) {
    resources.push('photography');
  }

  return resources;
}
