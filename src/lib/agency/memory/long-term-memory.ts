/**
 * Long-Term Memory (Supabase + pgvector)
 * Learnings, padrões de sucesso e benchmarks (meses/anos)
 */

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type LearningType =
  | 'successful_strategy'
  | 'failed_approach'
  | 'best_practice'
  | 'client_preference'
  | 'performance_insight'
  | 'optimization_tip';

/**
 * Long-Term Memory Service
 * Armazena learnings com busca por similaridade (pgvector)
 */
export const longTermMemory = {
  /**
   * Store a learning with vector embedding
   */
  async storeLearning(data: {
    clientId: string;
    type: LearningType;
    content: string;
    context?: string;
    performanceScore?: number;
    tags?: string[];
    confidence?: number;
  }) {
    try {
      // Generate embedding
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: data.content,
      });
      
      const supabase = getSupabaseAdmin();
      
      const { data: inserted, error } = await supabase
        .from('crew_learnings')
        .insert({
          client_id: data.clientId,
          type: data.type,
          content: data.content,
          context: data.context,
          performance_score: data.performanceScore,
          embedding: embedding.data[0].embedding,
          tags: data.tags || [],
          confidence: data.confidence || 70.0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return inserted;
    } catch (error) {
      console.error('[LongTermMemory] Error storing learning:', error);
      throw error;
    }
  },
  
  /**
   * Search similar learnings using vector similarity
   */
  async searchSimilarLearnings(query: string, clientId: string, matchCount: number = 5) {
    try {
      // Generate query embedding
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });
      
      const supabase = getSupabaseAdmin();
      
      const { data, error } = await supabase.rpc('match_crew_learnings', {
        query_embedding: embedding.data[0].embedding,
        match_count: matchCount,
        filter_client_id: clientId,
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[LongTermMemory] Error searching similar learnings:', error);
      return [];
    }
  },
  
  /**
   * Get learnings by type
   */
  async getLearningsByType(clientId: string, type: LearningType, limit: number = 10) {
    try {
      const supabase = getSupabaseAdmin();
      
      const { data, error } = await supabase
        .from('crew_learnings')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', type)
        .order('performance_score', { ascending: false, nullsFirst: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[LongTermMemory] Error getting learnings by type:', error);
      return [];
    }
  },
  
  /**
   * Get best practices (highest performance + confidence)
   */
  async getBestPractices(clientId: string, limit: number = 10) {
    try {
      const supabase = getSupabaseAdmin();
      
      const { data, error } = await supabase
        .from('crew_learnings')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'best_practice')
        .gte('performance_score', 80)
        .gte('confidence', 80)
        .order('performance_score', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[LongTermMemory] Error getting best practices:', error);
      return [];
    }
  },
  
  /**
   * Update learning usage and performance
   */
  async updateLearning(learningId: string, updates: {
    performanceScore?: number;
    campaignsCount?: number;
    confidence?: number;
  }) {
    try {
      const supabase = getSupabaseAdmin();
      
      const { error } = await supabase
        .from('crew_learnings')
        .update({
          ...updates,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', learningId);
      
      if (error) throw error;
    } catch (error) {
      console.error('[LongTermMemory] Error updating learning:', error);
    }
  },
  
  /**
   * Store a success pattern
   */
  async storeSuccessPattern(data: {
    clientId?: string;
    patternName: string;
    patternDescription: string;
    agentsCombination: string[];
    crewStructure: 'sequential' | 'parallel' | 'hierarchical';
    typicalParams?: any;
    successRate: number;
    avgPerformanceScore?: number;
    timesUsed?: number;
    bestForContexts?: string[];
    industry?: string;
  }) {
    try {
      const supabase = getSupabaseAdmin();
      
      const { data: inserted, error } = await supabase
        .from('crew_success_patterns')
        .insert({
          client_id: data.clientId,
          pattern_name: data.patternName,
          pattern_description: data.patternDescription,
          agents_combination: data.agentsCombination,
          crew_structure: data.crewStructure,
          typical_params: data.typicalParams || {},
          success_rate: data.successRate,
          avg_performance_score: data.avgPerformanceScore,
          times_used: data.timesUsed || 0,
          best_for_contexts: data.bestForContexts || [],
          industry: data.industry,
        })
        .select()
        .single();
      
      if (error) throw error;
      return inserted;
    } catch (error) {
      console.error('[LongTermMemory] Error storing success pattern:', error);
      throw error;
    }
  },
  
  /**
   * Get success patterns
   */
  async getSuccessPatterns(clientId?: string, industry?: string, limit: number = 10) {
    try {
      const supabase = getSupabaseAdmin();
      
      let query = supabase
        .from('crew_success_patterns')
        .select('*')
        .order('success_rate', { ascending: false });
      
      if (clientId) {
        query = query.or(`client_id.eq.${clientId},client_id.is.null`);
      }
      
      if (industry) {
        query = query.eq('industry', industry);
      }
      
      const { data, error } = await query.limit(limit);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[LongTermMemory] Error getting success patterns:', error);
      return [];
    }
  },
  
  /**
   * Update success pattern metrics
   */
  async updateSuccessPattern(patternId: string, metrics: {
    successRate?: number;
    avgPerformanceScore?: number;
    timesUsed?: number;
  }) {
    try {
      const supabase = getSupabaseAdmin();
      
      const { error } = await supabase
        .from('crew_success_patterns')
        .update(metrics)
        .eq('id', patternId);
      
      if (error) throw error;
    } catch (error) {
      console.error('[LongTermMemory] Error updating success pattern:', error);
    }
  },
  
  /**
   * Get industry benchmarks
   */
  async getIndustryBenchmarks(industry: string, contentType?: string) {
    try {
      const supabase = getSupabaseAdmin();
      
      let query = supabase
        .from('crew_industry_benchmarks')
        .select('*')
        .eq('industry', industry);
      
      if (contentType) {
        query = query.eq('content_type', contentType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[LongTermMemory] Error getting industry benchmarks:', error);
      return [];
    }
  },
  
  /**
   * Update industry benchmarks
   */
  async updateIndustryBenchmarks(data: {
    industry: string;
    contentType: string;
    avgEngagementRate?: number;
    avgReach?: number;
    avgClicks?: number;
    avgConversions?: number;
    bestTimeToPost?: string;
    bestDayToPost?: number;
    sampleSize?: number;
  }) {
    try {
      const supabase = getSupabaseAdmin();
      
      const { error } = await supabase
        .from('crew_industry_benchmarks')
        .upsert({
          industry: data.industry,
          content_type: data.contentType,
          avg_engagement_rate: data.avgEngagementRate,
          avg_reach: data.avgReach,
          avg_clicks: data.avgClicks,
          avg_conversions: data.avgConversions,
          best_time_to_post: data.bestTimeToPost,
          best_day_to_post: data.bestDayToPost,
          sample_size: data.sampleSize,
          data_updated_at: new Date().toISOString(),
        }, {
          onConflict: 'industry,content_type',
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('[LongTermMemory] Error updating industry benchmarks:', error);
    }
  },
  
  /**
   * Auto-learn from successful campaign
   */
  async learnFromCampaign(campaignData: {
    clientId: string;
    crewType: string;
    performanceScore: number;
    agentsUsed: string[];
    crewStructure: string;
    context: string;
    outputs: any;
  }) {
    try {
      // If performance is good (>= 80), store as learning
      if (campaignData.performanceScore >= 80) {
        const learningContent = `Campanha ${campaignData.crewType} teve sucesso com score ${campaignData.performanceScore}. 
Agentes utilizados: ${campaignData.agentsUsed.join(', ')}. 
Estrutura: ${campaignData.crewStructure}.
Contexto: ${campaignData.context}`;
        
        await this.storeLearning({
          clientId: campaignData.clientId,
          type: 'successful_strategy',
          content: learningContent,
          context: campaignData.context,
          performanceScore: campaignData.performanceScore,
          tags: [campaignData.crewType, campaignData.crewStructure],
          confidence: 85,
        });
        
        console.log(`[LongTermMemory] Learned from successful campaign: ${campaignData.crewType}`);
      }
      
      // If performance is poor (< 50), store as failed approach
      if (campaignData.performanceScore < 50) {
        const learningContent = `Campanha ${campaignData.crewType} teve performance baixa (${campaignData.performanceScore}). 
Evitar usar: ${campaignData.agentsUsed.join(', ')} com estrutura ${campaignData.crewStructure} neste contexto.`;
        
        await this.storeLearning({
          clientId: campaignData.clientId,
          type: 'failed_approach',
          content: learningContent,
          context: campaignData.context,
          performanceScore: campaignData.performanceScore,
          tags: [campaignData.crewType, 'avoid'],
          confidence: 70,
        });
        
        console.log(`[LongTermMemory] Learned from failed campaign: ${campaignData.crewType}`);
      }
    } catch (error) {
      console.error('[LongTermMemory] Error learning from campaign:', error);
    }
  },
};

export default longTermMemory;
