/**
 * Valle 360 - Val Coach de Metas
 * Sistema de coaching inteligente para colaboradores
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TIPOS
// =====================================================

export interface CoachingMessage {
  type: 'motivation' | 'warning' | 'celebration' | 'tip' | 'challenge';
  title: string;
  message: string;
  emoji: string;
  action?: {
    label: string;
    href?: string;
    callback?: string;
  };
}

export interface CollaboratorContext {
  name: string;
  sector: string;
  currentProgress: number;
  targetProgress: number; // Onde deveria estar baseado no tempo
  streakDays: number;
  achievements: string[];
  recentTrend: 'up' | 'down' | 'stable';
  daysUntilDeadline: number;
}

// =====================================================
// MENSAGENS TEMPLATE
// =====================================================

const motivationalMessages: Record<string, CoachingMessage[]> = {
  // Quando está acima da meta
  exceeding: [
    {
      type: 'celebration',
      title: 'Você está voando! 🚀',
      message: 'Seu desempenho está {progress}% acima do esperado! Continue assim, você é inspiração para a equipe!',
      emoji: '🏆',
      action: { label: 'Ver conquistas', href: '/metas/conquistas' }
    },
    {
      type: 'celebration',
      title: 'Extraordinário!',
      message: 'Você já bateu {percent}% da meta e ainda faltam {days} dias! Que tal ajudar um colega?',
      emoji: '⭐',
      action: { label: 'Ver equipe', href: '/equipe' }
    }
  ],
  
  // Quando está no caminho certo
  onTrack: [
    {
      type: 'motivation',
      title: 'No caminho certo! 💪',
      message: 'Você está exatamente onde deveria estar. Mantenha o ritmo e a meta é sua!',
      emoji: '✅',
    },
    {
      type: 'tip',
      title: 'Dica do dia',
      message: 'Colaboradores que fazem pausas regulares têm 20% mais produtividade. Já fez sua pausa hoje?',
      emoji: '💡',
    }
  ],
  
  // Quando está um pouco atrasado
  slightlyBehind: [
    {
      type: 'motivation',
      title: 'Você consegue! 💪',
      message: 'Está {behind}% atrás, mas ainda dá tempo! Foque nas entregas prioritárias.',
      emoji: '🎯',
      action: { label: 'Ver prioridades', href: '/tarefas?sort=priority' }
    },
    {
      type: 'tip',
      title: 'Estratégia para acelerar',
      message: 'Que tal dividir suas tarefas grandes em menores? Entregas frequentes mantêm o momentum!',
      emoji: '⚡',
    }
  ],
  
  // Quando está muito atrasado
  behind: [
    {
      type: 'warning',
      title: 'Vamos conversar? 🤝',
      message: 'Notei que você está {behind}% abaixo do esperado. Posso ajudar a identificar bloqueios?',
      emoji: '🆘',
      action: { label: 'Pedir ajuda', callback: 'requestHelp' }
    },
    {
      type: 'motivation',
      title: 'Ainda dá tempo!',
      message: 'Faltam {days} dias. Vamos focar no que é essencial? Posso sugerir prioridades.',
      emoji: '⏰',
      action: { label: 'Ver sugestões', callback: 'showSuggestions' }
    }
  ],
  
  // Streak messages
  streak: [
    {
      type: 'celebration',
      title: '{days} dias de streak! 🔥',
      message: 'Você está em uma sequência incrível! Mais {remaining} dias para desbloquear uma conquista.',
      emoji: '🔥',
    },
    {
      type: 'challenge',
      title: 'Desafio do dia',
      message: 'Sua streak está em {days} dias. Aceita o desafio de chegar a {target}?',
      emoji: '🎮',
      action: { label: 'Aceitar desafio', callback: 'acceptChallenge' }
    }
  ],
  
  // Mensagens por setor
  comercial: [
    {
      type: 'tip',
      title: 'Insight Comercial',
      message: 'Leads contatados nas primeiras 24h têm 7x mais chance de converter. Tem leads novos para contatar?',
      emoji: '📞',
      action: { label: 'Ver leads', href: '/admin/prospeccao' }
    },
    {
      type: 'motivation',
      title: 'Fechamento à vista!',
      message: 'Você tem {meetings} reuniões agendadas. Cada uma é uma oportunidade de brilhar!',
      emoji: '🤝',
    }
  ],
  
  social_media: [
    {
      type: 'tip',
      title: 'Melhor horário!',
      message: 'Posts publicados entre 18h-20h têm 40% mais engajamento. Já agendou os de hoje?',
      emoji: '📱',
    }
  ],
  
  designer: [
    {
      type: 'tip',
      title: 'Design Tip',
      message: 'Revisões reduzem quando há briefing claro. Que tal criar um template de briefing?',
      emoji: '🎨',
    }
  ],
  
  trafego: [
    {
      type: 'tip',
      title: 'Otimização',
      message: 'Campanhas com A/B test têm 25% mais conversão. Está testando variações?',
      emoji: '📊',
    }
  ]
};

// =====================================================
// SERVIÇO DE COACHING
// =====================================================

class ValCoachService {
  
  /**
   * Gera mensagem de coaching baseada no contexto
   */
  generateCoachingMessage(context: CollaboratorContext): CoachingMessage {
    const progressDiff = context.currentProgress - context.targetProgress;
    let category: string;
    
    // Determinar categoria baseada no progresso
    if (progressDiff >= 15) {
      category = 'exceeding';
    } else if (progressDiff >= -10) {
      category = 'onTrack';
    } else if (progressDiff >= -25) {
      category = 'slightlyBehind';
    } else {
      category = 'behind';
    }

    // Chance de mensagem de streak se tiver
    if (context.streakDays >= 5 && Math.random() > 0.5) {
      category = 'streak';
    }

    // Chance de mensagem específica do setor
    if (motivationalMessages[context.sector] && Math.random() > 0.7) {
      category = context.sector;
    }

    // Selecionar mensagem aleatória da categoria
    const messages = motivationalMessages[category] || motivationalMessages.onTrack;
    const template = messages[Math.floor(Math.random() * messages.length)];

    // Personalizar mensagem
    return this.personalizeMessage(template, context);
  }

  /**
   * Personaliza mensagem com dados do contexto
   */
  private personalizeMessage(
    template: CoachingMessage, 
    context: CollaboratorContext
  ): CoachingMessage {
    let message = template.message;
    let title = template.title;

    const replacements: Record<string, string> = {
      '{name}': context.name,
      '{progress}': Math.abs(context.currentProgress - context.targetProgress).toFixed(0),
      '{percent}': context.currentProgress.toFixed(0),
      '{behind}': Math.abs(context.currentProgress - context.targetProgress).toFixed(0),
      '{days}': context.daysUntilDeadline.toString(),
      '{remaining}': Math.max(0, 7 - context.streakDays).toString(),
      '{target}': (context.streakDays < 7 ? 7 : context.streakDays < 30 ? 30 : 100).toString(),
      '{meetings}': '3' // Placeholder
    };

    Object.entries(replacements).forEach(([key, value]) => {
      message = message.replace(new RegExp(key, 'g'), value);
      title = title.replace(new RegExp(key, 'g'), value);
    });

    return {
      ...template,
      title,
      message
    };
  }

  /**
   * Envia notificação de coaching
   */
  async sendCoachingNotification(
    collaboratorId: string,
    message: CoachingMessage
  ): Promise<void> {
    try {
      await supabase.from('goal_alerts').insert({
        collaborator_id: collaboratorId,
        type: message.type,
        severity: message.type === 'warning' ? 'warning' : 'info',
        title: `${message.emoji} ${message.title}`,
        message: message.message,
        suggested_action: message.action?.label,
        action_url: message.action?.href
      });
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }

  /**
   * Gera mensagem diária para todos os colaboradores
   */
  async sendDailyCoaching(): Promise<{ sent: number; errors: number }> {
    let sent = 0;
    let errors = 0;

    try {
      // Buscar todas as metas ativas
      const { data: goals } = await supabase
        .from('collaborator_goals')
        .select('*')
        .eq('status', 'active');

      if (!goals) return { sent, errors };

      for (const goal of goals) {
        try {
          const context = this.buildContext(goal);
          const message = this.generateCoachingMessage(context);
          await this.sendCoachingNotification(goal.collaborator_id, message);
          sent++;
        } catch (e) {
          errors++;
        }
      }
    } catch (error) {
      console.error('Erro no coaching diário:', error);
    }

    return { sent, errors };
  }

  /**
   * Constrói contexto a partir de uma meta
   */
  private buildContext(goal: any): CollaboratorContext {
    const now = new Date();
    const periodEnd = new Date(goal.period_end);
    const periodStart = new Date(goal.period_start);
    
    const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
    const daysElapsed = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
    const daysUntilDeadline = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const targetProgress = (daysElapsed / totalDays) * 100;

    return {
      name: goal.collaborator_name || 'Colaborador',
      sector: goal.sector,
      currentProgress: goal.overall_progress || 0,
      targetProgress: Math.min(100, targetProgress),
      streakDays: goal.streak_days || 0,
      achievements: goal.achievements || [],
      recentTrend: goal.overall_progress > targetProgress ? 'up' : 
                   goal.overall_progress < targetProgress - 10 ? 'down' : 'stable',
      daysUntilDeadline
    };
  }

  /**
   * Gera insight específico para um colaborador
   */
  async generatePersonalizedInsight(collaboratorId: string): Promise<string> {
    const { data: goal } = await supabase
      .from('collaborator_goals')
      .select('*')
      .eq('collaborator_id', collaboratorId)
      .eq('status', 'active')
      .single();

    if (!goal) {
      return 'Você ainda não tem metas ativas. Que tal começar uma agora?';
    }

    const context = this.buildContext(goal);
    const message = this.generateCoachingMessage(context);

    return `${message.emoji} ${message.message}`;
  }

  /**
   * Gera sugestões de melhoria
   */
  async generateImprovementSuggestions(
    collaboratorId: string,
    sector: string
  ): Promise<string[]> {
    const suggestions: Record<string, string[]> = {
      comercial: [
        'Contate leads nas primeiras 24h após captação',
        'Faça follow-up em até 3 dias se não houver resposta',
        'Prepare roteiro personalizado para cada reunião',
        'Documente objeções frequentes e suas respostas'
      ],
      social_media: [
        'Publique nos horários de maior engajamento (18h-20h)',
        'Use stories diariamente para manter relevância',
        'Responda comentários em até 1 hora',
        'Teste diferentes formatos (carrossel, reels, estático)'
      ],
      designer: [
        'Solicite briefings detalhados antes de começar',
        'Envie prévia rápida antes da versão final',
        'Mantenha biblioteca de assets organizados',
        'Use templates para peças recorrentes'
      ],
      trafego: [
        'Faça testes A/B em todas as campanhas',
        'Revise públicos semanalmente',
        'Otimize lances baseado em horários',
        'Documente aprendizados de cada campanha'
      ],
      video_maker: [
        'Crie templates de intro/outro reutilizáveis',
        'Organize acervo de músicas e efeitos',
        'Faça backups incrementais durante edição',
        'Padronize processo de revisão com cliente'
      ]
    };

    return suggestions[sector] || [
      'Estabeleça metas diárias menores',
      'Faça pausas regulares para manter produtividade',
      'Priorize tarefas de maior impacto',
      'Peça feedback frequente'
    ];
  }
}

export const valCoach = new ValCoachService();
export default valCoach;

