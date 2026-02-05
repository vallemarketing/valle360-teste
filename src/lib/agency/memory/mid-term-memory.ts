/**
 * Mid-Term Memory (Supabase)
 * Histórico de campanhas e execuções (dias/semanas)
 */

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import type { CrewExecutionResult, AgentExecutionResult } from '../core/types';

/**
 * Mid-Term Memory Service
 * Armazena histórico de campanhas no Supabase
 */
export const midTermMemory = {
  /**
   * Save a completed campaign execution
   */
  async saveCampaign(data: {
    clientId: string;
    crewId: string;
    crewName: string;
    crewType: string;
    processType: 'sequential' | 'parallel' | 'hierarchical';
    result: CrewExecutionResult;
    initialContext?: string;
    params?: any;
  }) {
    try {
      const supabase = getSupabaseAdmin();
      
      const { data: inserted, error } = await supabase
        .from('crew_campaign_history')
        .insert({
          client_id: data.clientId,
          crew_id: data.crewId,
          crew_name: data.crewName,
          crew_type: data.crewType,
          process_type: data.processType,
          total_tasks: data.result.taskResults.length,
          completed_tasks: data.result.taskResults.filter(r => !r.error).length,
          failed_tasks: data.result.taskResults.filter(r => r.error).length,
          final_output: data.result.finalOutput,
          task_results: data.result.taskResults,
          total_tokens: data.result.totalTokens,
          total_time_ms: data.result.totalTime,
          success: data.result.success,
          error_message: data.result.error,
          initial_context: data.initialContext,
          params: data.params || {},
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Save individual agent interactions
      if (inserted && data.result.taskResults.length > 0) {
        await this.saveAgentInteractions(inserted.id, data.clientId, data.result.taskResults);
      }
      
      return inserted;
    } catch (error) {
      console.error('[MidTermMemory] Error saving campaign:', error);
      throw error;
    }
  },
  
  /**
   * Save agent interactions for a campaign
   */
  async saveAgentInteractions(
    campaignHistoryId: string,
    clientId: string,
    taskResults: AgentExecutionResult[]
  ) {
    try {
      const supabase = getSupabaseAdmin();
      
      const interactions = taskResults.map(result => ({
        campaign_history_id: campaignHistoryId,
        client_id: clientId,
        agent_id: result.agentId,
        agent_name: result.agentName,
        agent_role: result.agentName.split(' - ')[0] || result.agentName,
        output: result.output,
        tokens_used: result.tokenUsage?.total || 0,
        execution_time_ms: result.executionTime,
        reflection_score: result.reflection?.score,
        reflection_confidence: result.reflection?.confidence,
        was_corrected: result.corrected || false,
        fallback_used: result.fallbackUsed || false,
        tools_called: result.toolCalls?.map(tc => tc.toolName) || [],
      }));
      
      const { error } = await supabase
        .from('crew_agent_interactions')
        .insert(interactions);
      
      if (error) throw error;
    } catch (error) {
      console.error('[MidTermMemory] Error saving agent interactions:', error);
    }
  },
  
  /**
   * Get campaign history for a client
   */
  async getCampaignHistory(clientId: string, limit: number = 10) {
    try {
      const supabase = getSupabaseAdmin();
      
      const { data, error } = await supabase
        .from('crew_campaign_history')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[MidTermMemory] Error getting campaign history:', error);
      return [];
    }
  },
  
  /**
   * Get successful campaigns of a specific type
   */
  async getSuccessfulCampaigns(clientId: string, crewType: string, limit: number = 5) {
    try {
      const supabase = getSupabaseAdmin();
      
      const { data, error } = await supabase
        .from('crew_campaign_history')
        .select('*')
        .eq('client_id', clientId)
        .eq('crew_type', crewType)
        .eq('success', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[MidTermMemory] Error getting successful campaigns:', error);
      return [];
    }
  },
  
  /**
   * Get performance summary for a client
   */
  async getPerformanceSummary(clientId: string) {
    try {
      const supabase = getSupabaseAdmin();
      
      const { data, error } = await supabase
        .from('v_crew_performance_summary')
        .select('*')
        .eq('client_id', clientId);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[MidTermMemory] Error getting performance summary:', error);
      return [];
    }
  },
  
  /**
   * Get agent performance for a client
   */
  async getAgentPerformance(clientId: string, agentId?: string) {
    try {
      const supabase = getSupabaseAdmin();
      
      let query = supabase
        .from('crew_agent_interactions')
        .select('*')
        .eq('client_id', clientId);
      
      if (agentId) {
        query = query.eq('agent_id', agentId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Calculate stats
      if (data && data.length > 0) {
        const stats = {
          totalInteractions: data.length,
          avgReflectionScore: data.reduce((sum, i) => sum + (i.reflection_score || 0), 0) / data.length,
          avgConfidence: data.reduce((sum, i) => sum + (i.reflection_confidence || 0), 0) / data.length,
          correctionRate: (data.filter(i => i.was_corrected).length / data.length) * 100,
          fallbackRate: (data.filter(i => i.fallback_used).length / data.length) * 100,
          avgTokensUsed: data.reduce((sum, i) => sum + (i.tokens_used || 0), 0) / data.length,
          avgExecutionTime: data.reduce((sum, i) => sum + (i.execution_time_ms || 0), 0) / data.length,
        };
        
        return { interactions: data, stats };
      }
      
      return { interactions: data, stats: null };
    } catch (error) {
      console.error('[MidTermMemory] Error getting agent performance:', error);
      return { interactions: [], stats: null };
    }
  },
  
  /**
   * Search campaigns by params or output content
   */
  async searchCampaigns(clientId: string, searchTerm: string) {
    try {
      const supabase = getSupabaseAdmin();
      
      const { data, error } = await supabase
        .from('crew_campaign_history')
        .select('*')
        .eq('client_id', clientId)
        .or(`final_output.ilike.%${searchTerm}%,params->>topic.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[MidTermMemory] Error searching campaigns:', error);
      return [];
    }
  },
  
  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string) {
    try {
      const supabase = getSupabaseAdmin();
      
      const { data, error } = await supabase
        .from('crew_campaign_history')
        .select('*, crew_agent_interactions(*)')
        .eq('id', campaignId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[MidTermMemory] Error getting campaign by ID:', error);
      return null;
    }
  },
  
  /**
   * Delete old campaigns (cleanup)
   */
  async deleteOldCampaigns(daysOld: number = 90) {
    try {
      const supabase = getSupabaseAdmin();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const { error } = await supabase
        .from('crew_campaign_history')
        .delete()
        .lt('created_at', cutoffDate.toISOString());
      
      if (error) throw error;
      
      console.log(`[MidTermMemory] Deleted campaigns older than ${daysOld} days`);
    } catch (error) {
      console.error('[MidTermMemory] Error deleting old campaigns:', error);
    }
  },
};

export default midTermMemory;
