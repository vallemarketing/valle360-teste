/**
 * Valle AI - Post Scheduler Service
 * Sistema de agendamento e publicação de posts
 */

import { supabase } from '@/lib/supabase';

export interface ScheduledPost {
  id?: string;
  client_id: string;
  client_name?: string;
  title: string;
  content: string;
  media_urls?: string[];
  platforms: Platform[];
  scheduled_for: string;
  timezone?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  published_at?: string;
  created_by: string;
  created_at?: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'revision';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  hashtags?: string[];
  mentions?: string[];
  link?: string;
  campaign_id?: string;
  ai_generated?: boolean;
  ai_suggestions?: string[];
  performance?: PostPerformance;
}

export interface Platform {
  name: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok';
  post_type: 'feed' | 'story' | 'reel' | 'carousel' | 'video';
  specific_content?: string;
  specific_media?: string[];
}

export interface PostPerformance {
  impressions?: number;
  reach?: number;
  engagement?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  collected_at?: string;
}

export interface ContentCalendar {
  client_id: string;
  month: number;
  year: number;
  posts: ScheduledPost[];
  total_posts: number;
  by_platform: Record<string, number>;
  by_status: Record<string, number>;
}

export interface PostTemplate {
  id: string;
  name: string;
  category: string;
  content_template: string;
  hashtags: string[];
  platforms: string[];
  best_times: string[];
  is_active: boolean;
}

class PostSchedulerService {
  /**
   * Agenda um novo post
   */
  async schedulePost(post: Omit<ScheduledPost, 'id' | 'created_at'>): Promise<ScheduledPost | null> {
    try {
      const postData = {
        ...post,
        status: 'scheduled',
        approval_status: post.approval_status || 'pending',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert(postData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao agendar post:', error);
        return null;
      }

      // Notifica cliente para aprovação
      if (post.approval_status === 'pending') {
        await this.notifyClientForApproval(data);
      }

      return data;
    } catch (error) {
      console.error('Erro ao agendar post:', error);
      return null;
    }
  }

  /**
   * Busca posts agendados
   */
  async getScheduledPosts(filters?: {
    client_id?: string;
    status?: string;
    approval_status?: string;
    platform?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<ScheduledPost[]> {
    try {
      let query = supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_for', { ascending: true });

      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.approval_status) {
        query = query.eq('approval_status', filters.approval_status);
      }
      if (filters?.from_date) {
        query = query.gte('scheduled_for', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('scheduled_for', filters.to_date);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      return [];
    }
  }

  /**
   * Aprova um post
   */
  async approvePost(postId: string, approvedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({
          approval_status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) {
        console.error('Erro ao aprovar post:', error);
        return false;
      }

      // Notifica equipe de social media
      await this.notifyPostApproved(postId);

      return true;
    } catch (error) {
      console.error('Erro ao aprovar post:', error);
      return false;
    }
  }

  /**
   * Rejeita um post
   */
  async rejectPost(postId: string, reason: string, rejectedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason,
          approved_by: rejectedBy,
          approved_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) {
        console.error('Erro ao rejeitar post:', error);
        return false;
      }

      // Notifica equipe para correção
      await this.notifyPostRejected(postId, reason);

      return true;
    } catch (error) {
      console.error('Erro ao rejeitar post:', error);
      return false;
    }
  }

  /**
   * Publica um post (simula integração com APIs)
   */
  async publishPost(postId: string): Promise<{ success: boolean; results: any[] }> {
    try {
      const { data: post } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (!post) {
        return { success: false, results: [{ error: 'Post não encontrado' }] };
      }

      if (post.approval_status !== 'approved') {
        return { success: false, results: [{ error: 'Post não aprovado' }] };
      }

      const results: any[] = [];

      // Simula publicação em cada plataforma
      for (const platform of post.platforms) {
        const result = await this.publishToPlatform(post, platform);
        results.push({
          platform: platform.name,
          ...result
        });
      }

      const allSuccess = results.every(r => r.success);

      // Atualiza status do post
      await supabase
        .from('scheduled_posts')
        .update({
          status: allSuccess ? 'published' : 'failed',
          published_at: allSuccess ? new Date().toISOString() : null,
          publish_results: results
        })
        .eq('id', postId);

      return { success: allSuccess, results };
    } catch (error) {
      console.error('Erro ao publicar post:', error);
      return { success: false, results: [{ error: 'Erro interno' }] };
    }
  }

  /**
   * Simula publicação em uma plataforma específica
   */
  private async publishToPlatform(post: ScheduledPost, platform: Platform): Promise<{ success: boolean; post_id?: string; error?: string }> {
    // Em produção, integraria com APIs reais:
    // - Meta Graph API para Instagram e Facebook
    // - LinkedIn API
    // - Twitter API v2
    // - TikTok API

    console.log(`[PUBLISH] Publicando em ${platform.name}: ${post.title}`);

    // Simula delay de publicação
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simula sucesso (90% de chance)
    const success = Math.random() > 0.1;

    if (success) {
      return {
        success: true,
        post_id: `${platform.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    }

    return {
      success: false,
      error: 'Falha na conexão com a API'
    };
  }

  /**
   * Gera calendário de conteúdo
   */
  async getContentCalendar(clientId: string, month: number, year: number): Promise<ContentCalendar> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const posts = await this.getScheduledPosts({
      client_id: clientId,
      from_date: startDate.toISOString(),
      to_date: endDate.toISOString()
    });

    const byPlatform: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const post of posts) {
      // Conta por plataforma
      for (const platform of post.platforms) {
        byPlatform[platform.name] = (byPlatform[platform.name] || 0) + 1;
      }
      // Conta por status
      byStatus[post.status] = (byStatus[post.status] || 0) + 1;
    }

    return {
      client_id: clientId,
      month,
      year,
      posts,
      total_posts: posts.length,
      by_platform: byPlatform,
      by_status: byStatus
    };
  }

  /**
   * Sugere melhores horários para publicação
   */
  getBestPostingTimes(platform: string): { day: string; times: string[] }[] {
    const bestTimes: Record<string, { day: string; times: string[] }[]> = {
      instagram: [
        { day: 'Segunda', times: ['11:00', '14:00', '19:00'] },
        { day: 'Terça', times: ['10:00', '13:00', '19:00'] },
        { day: 'Quarta', times: ['11:00', '15:00', '19:00'] },
        { day: 'Quinta', times: ['12:00', '14:00', '19:00'] },
        { day: 'Sexta', times: ['10:00', '14:00', '17:00'] },
        { day: 'Sábado', times: ['10:00', '13:00'] },
        { day: 'Domingo', times: ['10:00', '19:00'] }
      ],
      facebook: [
        { day: 'Segunda', times: ['09:00', '13:00', '16:00'] },
        { day: 'Terça', times: ['09:00', '13:00', '16:00'] },
        { day: 'Quarta', times: ['09:00', '13:00', '15:00'] },
        { day: 'Quinta', times: ['09:00', '12:00', '14:00'] },
        { day: 'Sexta', times: ['09:00', '11:00', '14:00'] },
        { day: 'Sábado', times: ['12:00', '13:00'] },
        { day: 'Domingo', times: ['13:00', '14:00'] }
      ],
      linkedin: [
        { day: 'Segunda', times: ['07:45', '10:45', '12:45'] },
        { day: 'Terça', times: ['07:45', '10:45', '17:00'] },
        { day: 'Quarta', times: ['08:00', '12:00', '17:00'] },
        { day: 'Quinta', times: ['07:45', '09:45', '17:00'] },
        { day: 'Sexta', times: ['07:45', '10:00', '14:00'] }
      ],
      twitter: [
        { day: 'Segunda', times: ['08:00', '12:00', '17:00'] },
        { day: 'Terça', times: ['09:00', '12:00', '17:00'] },
        { day: 'Quarta', times: ['09:00', '12:00', '17:00'] },
        { day: 'Quinta', times: ['09:00', '12:00', '17:00'] },
        { day: 'Sexta', times: ['09:00', '12:00', '16:00'] }
      ],
      tiktok: [
        { day: 'Segunda', times: ['06:00', '10:00', '22:00'] },
        { day: 'Terça', times: ['02:00', '04:00', '09:00'] },
        { day: 'Quarta', times: ['07:00', '08:00', '23:00'] },
        { day: 'Quinta', times: ['09:00', '12:00', '19:00'] },
        { day: 'Sexta', times: ['05:00', '13:00', '15:00'] },
        { day: 'Sábado', times: ['11:00', '19:00', '20:00'] },
        { day: 'Domingo', times: ['07:00', '08:00', '16:00'] }
      ]
    };

    return bestTimes[platform] || bestTimes.instagram;
  }

  /**
   * Gera sugestões de conteúdo com IA
   */
  async generateContentSuggestions(params: {
    client_id: string;
    platform: string;
    theme?: string;
    tone?: string;
  }): Promise<string[]> {
    // Em produção, integraria com OpenAI ou similar
    const suggestions = [
      `📢 Novidade chegando! Fique ligado nas próximas horas para uma surpresa especial. #Novidade #EmBreve`,
      `💡 Dica do dia: ${params.theme || 'Invista em você'}. Pequenas mudanças fazem grandes diferenças! #Dicas #Motivação`,
      `🎯 Você sabia? Empresas que investem em marketing digital crescem 2.8x mais rápido. Vamos conversar? #Marketing #Crescimento`,
      `✨ Bastidores: é assim que a mágica acontece! Acompanhe nossa rotina e veja como trabalhamos para entregar o melhor. #Bastidores #Equipe`,
      `🚀 Case de sucesso: como ajudamos nosso cliente a aumentar as vendas em 150%. Link na bio! #CaseDeSuccesso #Resultados`
    ];

    return suggestions;
  }

  /**
   * Processa posts agendados para publicação
   */
  async processScheduledPosts(): Promise<{ processed: number; published: number; failed: number }> {
    const result = { processed: 0, published: 0, failed: 0 };

    try {
      const now = new Date().toISOString();

      // Busca posts aprovados e agendados para agora ou antes
      const { data: posts } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('status', 'scheduled')
        .eq('approval_status', 'approved')
        .lte('scheduled_for', now);

      if (!posts || posts.length === 0) {
        return result;
      }

      for (const post of posts) {
        result.processed++;
        const publishResult = await this.publishPost(post.id);
        
        if (publishResult.success) {
          result.published++;
        } else {
          result.failed++;
        }
      }

      return result;
    } catch (error) {
      console.error('Erro ao processar posts:', error);
      return result;
    }
  }

  /**
   * Coleta métricas de performance dos posts
   */
  async collectPostPerformance(postId: string): Promise<PostPerformance | null> {
    // Em produção, buscaria dados reais das APIs das plataformas
    const mockPerformance: PostPerformance = {
      impressions: Math.floor(Math.random() * 10000) + 1000,
      reach: Math.floor(Math.random() * 8000) + 800,
      engagement: Math.floor(Math.random() * 500) + 50,
      likes: Math.floor(Math.random() * 400) + 40,
      comments: Math.floor(Math.random() * 50) + 5,
      shares: Math.floor(Math.random() * 30) + 3,
      saves: Math.floor(Math.random() * 20) + 2,
      clicks: Math.floor(Math.random() * 100) + 10,
      collected_at: new Date().toISOString()
    };

    // Atualiza no banco
    await supabase
      .from('scheduled_posts')
      .update({ performance: mockPerformance })
      .eq('id', postId);

    return mockPerformance;
  }

  // Métodos de notificação
  private async notifyClientForApproval(post: ScheduledPost): Promise<void> {
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('user_id, company_name, contact_email, email')
        .eq('id', post.client_id)
        .maybeSingle();

      const userId = client?.user_id ? String(client.user_id) : null;
      if (!userId) return;

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'post_approval',
        title: 'Post aguardando aprovação',
        message: `Novo post "${post.title}" aguardando sua aprovação`,
        link: '/cliente/aprovacoes',
        metadata: { post_id: post.id, client_id: post.client_id },
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } catch {
      // best-effort
    }
  }

  private async notifyPostApproved(postId: string): Promise<void> {
    try {
      const { data: admins } = await supabase
        .from('user_profiles')
        .select('user_id, user_type')
        .in('user_type', ['super_admin', 'admin']);

      const userIds = (admins || [])
        .map((r: any) => r.user_id)
        .filter(Boolean)
        .map((id: any) => String(id));

      if (userIds.length === 0) return;

      await supabase.from('notifications').insert(
        userIds.map((userId) => ({
          user_id: userId,
          type: 'post_approved',
          title: 'Post aprovado',
          message: `Um post foi aprovado e será publicado no horário agendado`,
          link: '/admin',
          metadata: { post_id: postId, target_role: 'social_media' },
          is_read: false,
          created_at: new Date().toISOString(),
        }))
      );
    } catch {
      // best-effort
    }
  }

  private async notifyPostRejected(postId: string, reason: string): Promise<void> {
    try {
      const { data: admins } = await supabase
        .from('user_profiles')
        .select('user_id, user_type')
        .in('user_type', ['super_admin', 'admin']);

      const userIds = (admins || [])
        .map((r: any) => r.user_id)
        .filter(Boolean)
        .map((id: any) => String(id));

      if (userIds.length === 0) return;

      await supabase.from('notifications').insert(
        userIds.map((userId) => ({
          user_id: userId,
          type: 'post_rejected',
          title: 'Post rejeitado',
          message: `Um post foi rejeitado. Motivo: ${reason}`,
          link: '/admin',
          metadata: { post_id: postId, reason, target_role: 'social_media' },
          is_read: false,
          created_at: new Date().toISOString(),
        }))
      );
    } catch {
      // best-effort
    }
  }
}

export const postScheduler = new PostSchedulerService();
export default postScheduler;




