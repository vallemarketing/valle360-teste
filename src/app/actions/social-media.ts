'use server';

import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/db-helpers';
import { z } from 'zod';

const CreatePostSchema = z.object({
  clientId: z.string().uuid().optional(),
  channel: z.enum(['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter']),
  title: z.string().min(3),
  content: z.string().optional(),
  scheduledAt: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
});

export async function createSocialPost(data: z.infer<typeof CreatePostSchema>) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  const validated = CreatePostSchema.parse(data);

  const { data: post, error } = await supabase
    .from('social_posts')
    .insert({
      client_id: validated.clientId,
      channel: validated.channel,
      title: validated.title,
      content: validated.content,
      scheduled_at: validated.scheduledAt,
      hashtags: validated.hashtags,
      status: validated.scheduledAt ? 'scheduled' : 'draft',
      owner_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return post;
}

export async function getSocialPosts(filters?: {
  channel?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase
    .from('social_posts')
    .select(`
      *,
      client:clients(name),
      metrics:social_metrics(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.channel) query = query.eq('channel', filters.channel);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.startDate) query = query.gte('scheduled_at', filters.startDate);
  if (filters?.endDate) query = query.lte('scheduled_at', filters.endDate);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function updatePostStatus(postId: string, status: string) {
  const { data, error } = await supabase
    .from('social_posts')
    .update({
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSocialMetrics(period: { start: string; end: string }) {
  const { data, error } = await supabase
    .from('social_posts')
    .select(`
      *,
      metrics:social_metrics(*)
    `)
    .gte('published_at', period.start)
    .lte('published_at', period.end)
    .eq('status', 'published');

  if (error) throw error;

  const posts = data || [];
  const totalPosts = posts.length;
  const totalLikes = posts.reduce((sum, p) => sum + (p.metrics[0]?.likes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.metrics[0]?.comments || 0), 0);
  const totalShares = posts.reduce((sum, p) => sum + (p.metrics[0]?.shares || 0), 0);
  const avgEngagement = totalPosts > 0 ? (totalLikes + totalComments + totalShares) / totalPosts : 0;

  return {
    totalPosts,
    totalLikes,
    totalComments,
    totalShares,
    avgEngagement: Math.round(avgEngagement),
  };
}
