/**
 * Valle 360 - Hook de IA
 * Hook React para usar as funcionalidades de IA em qualquer componente
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// =====================================================
// TIPOS
// =====================================================

export interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation' | 'alert';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: string;
  actionType?: 'link' | 'button' | 'automation';
  actionTarget?: string;
  metrics?: Record<string, number | string>;
  confidence: number;
  category: string;
}

export interface GeneratedContent {
  title?: string;
  content: string;
  subject?: string;
  body?: string;
  suggestions?: string[];
  hashtags?: string[];
  callToAction?: string;
}

export interface UseAIReturn {
  // Estados
  isLoading: boolean;
  error: string | null;
  
  // Funções de Insights
  generateInsights: (type: string, data?: any) => Promise<AIInsight[]>;
  analyzeClient: (clientId: string, data?: any) => Promise<any>;
  getForecast: (data?: any) => Promise<any>;
  
  // Funções de Geração
  generateContent: (type: string, params: any) => Promise<GeneratedContent>;
  generateEmail: (params: any) => Promise<{ subject: string; body: string }>;
  generateSocialPost: (params: any) => Promise<GeneratedContent>;
  generateJobDescription: (params: any) => Promise<any>;
  generateReport: (params: any) => Promise<any>;
  
  // Val
  askVal: (message: string, context?: any) => Promise<any>;
  
  // Análise
  analyzeText: (text: string) => Promise<any>;
}

// =====================================================
// HOOK
// =====================================================

export function useAI(): UseAIReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeJson = async (response: Response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  // ==========================================
  // FUNÇÕES DE INSIGHTS
  // ==========================================

  const generateInsights = useCallback(async (type: string, data?: any): Promise<AIInsight[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ type, data })
      });
      
      const result = await safeJson(response);
      
      if (!response.ok) {
        const details = result?.details ? ` (${result.details})` : '';
        throw new Error((result?.error || `Erro ao gerar insights [${response.status}]`) + details);
      }
      
      return result?.data || [];
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeClient = useCallback(async (clientId: string, data?: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ 
          type: 'client_health', 
          data: { clientId, ...data } 
        })
      });
      
      const result = await safeJson(response);
      
      if (!response.ok) {
        const details = result?.details ? ` (${result.details})` : '';
        throw new Error((result?.error || `Erro ao analisar cliente [${response.status}]`) + details);
      }
      
      return result?.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getForecast = useCallback(async (data?: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ type: 'financial_forecast', data })
      });
      
      const result = await safeJson(response);
      
      if (!response.ok) {
        const details = result?.details ? ` (${result.details})` : '';
        throw new Error((result?.error || `Erro ao gerar previsão [${response.status}]`) + details);
      }
      
      return result?.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==========================================
  // FUNÇÕES DE GERAÇÃO
  // ==========================================

  const generateContent = useCallback(async (type: string, params: any): Promise<GeneratedContent> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ type, params })
      });
      
      const result = await safeJson(response);
      
      if (!response.ok) {
        const details = result?.details ? ` (${result.details})` : '';
        throw new Error((result?.error || `Erro ao gerar conteúdo [${response.status}]`) + details);
      }
      
      return result?.content;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateEmail = useCallback(async (params: any) => {
    const content = await generateContent('email', params);
    return {
      subject: content.subject || content.title || '',
      body: content.body || content.content || ''
    };
  }, [generateContent]);

  const generateSocialPost = useCallback(async (params: any) => {
    return generateContent('social', params);
  }, [generateContent]);

  const generateJobDescription = useCallback(async (params: any) => {
    return generateContent('job', params);
  }, [generateContent]);

  const generateReport = useCallback(async (params: any) => {
    return generateContent('report', params);
  }, [generateContent]);

  // ==========================================
  // VAL
  // ==========================================

  const askVal = useCallback(async (message: string, context?: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/ai/val', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ message, context })
      });
      
      const result = await safeJson(response);
      
      if (!response.ok) {
        const details = result?.details ? ` (${result.details})` : '';
        throw new Error((result?.error || `Erro ao processar mensagem [${response.status}]`) + details);
      }
      
      return result?.response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==========================================
  // ANÁLISE
  // ==========================================

  const analyzeText = useCallback(async (text: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ text })
      });
      
      const result = await safeJson(response);
      
      if (!response.ok) {
        const details = result?.details ? ` (${result.details})` : '';
        throw new Error((result?.error || `Erro ao analisar texto [${response.status}]`) + details);
      }
      
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    generateInsights,
    analyzeClient,
    getForecast,
    generateContent,
    generateEmail,
    generateSocialPost,
    generateJobDescription,
    generateReport,
    askVal,
    analyzeText
  };
}

export default useAI;

