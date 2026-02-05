/**
 * Valle 360 - Hook de Feature Flags
 * Verificação de acesso a funcionalidades no frontend
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Feature, getClientFeatures, getEnabledFeatureCodes, hasFeature } from '@/lib/features';

interface FeatureStatus {
  feature: Feature;
  status: 'enabled' | 'disabled' | 'pending';
  enabled_by?: string;
  enabled_at?: string;
  expires_at?: string;
}

interface UseFeatureResult {
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
}

interface UseFeaturesResult {
  features: FeatureStatus[];
  enabledCodes: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para verificar se o cliente atual tem acesso a uma feature específica
 */
export function useFeature(featureCode: string): UseFeatureResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkFeature() {
      try {
        setLoading(true);
        setError(null);

        // Buscar dados do usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasAccess(false);
          return;
        }

        // Buscar perfil para pegar client_id
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('client_id, user_type')
          .eq('user_id', user.id)
          .single();

        // Super admin e admin têm acesso a tudo
        if (profile?.user_type === 'super_admin' || profile?.user_type === 'admin') {
          setHasAccess(true);
          return;
        }

        // Se não tem client_id, não tem acesso
        if (!profile?.client_id) {
          setHasAccess(false);
          return;
        }

        // Verificar feature
        const result = await hasFeature(profile.client_id, featureCode);
        setHasAccess(result);
      } catch (err) {
        console.error('Erro ao verificar feature:', err);
        setError('Erro ao verificar permissão');
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkFeature();
  }, [featureCode]);

  return { hasAccess, loading, error };
}

/**
 * Hook para listar todas as features do cliente atual com seus status
 */
export function useFeatures(): UseFeaturesResult {
  const [features, setFeatures] = useState<FeatureStatus[]>([]);
  const [enabledCodes, setEnabledCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFeatures([]);
        setEnabledCodes([]);
        return;
      }

      // Buscar perfil para pegar client_id
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('client_id, user_type')
        .eq('user_id', user.id)
        .single();

      // Super admin e admin veem todas as features como habilitadas
      if (profile?.user_type === 'super_admin' || profile?.user_type === 'admin') {
        const { data: allFeatures } = await supabase
          .from('features')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        const featuresWithStatus = (allFeatures || []).map(f => ({
          feature: f,
          status: 'enabled' as const,
          enabled_by: 'admin'
        }));

        setFeatures(featuresWithStatus);
        setEnabledCodes((allFeatures || []).map(f => f.code));
        return;
      }

      // Se não tem client_id, não tem features
      if (!profile?.client_id) {
        setFeatures([]);
        setEnabledCodes([]);
        return;
      }

      // Buscar features do cliente
      const clientFeatures = await getClientFeatures(profile.client_id);
      setFeatures(clientFeatures);

      const codes = await getEnabledFeatureCodes(profile.client_id);
      setEnabledCodes(codes);
    } catch (err) {
      console.error('Erro ao buscar features:', err);
      setError('Erro ao carregar funcionalidades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return { features, enabledCodes, loading, error, refetch: fetchFeatures };
}

/**
 * Hook para verificar múltiplas features de uma vez
 */
export function useMultipleFeatures(featureCodes: string[]): {
  results: Record<string, boolean>;
  loading: boolean;
  error: string | null;
} {
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkFeatures() {
      try {
        setLoading(true);
        setError(null);

        // Buscar dados do usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setResults(Object.fromEntries(featureCodes.map(code => [code, false])));
          return;
        }

        // Buscar perfil
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('client_id, user_type')
          .eq('user_id', user.id)
          .single();

        // Admin tem tudo
        if (profile?.user_type === 'super_admin' || profile?.user_type === 'admin') {
          setResults(Object.fromEntries(featureCodes.map(code => [code, true])));
          return;
        }

        if (!profile?.client_id) {
          setResults(Object.fromEntries(featureCodes.map(code => [code, false])));
          return;
        }

        // Buscar features habilitadas
        const enabledCodes = await getEnabledFeatureCodes(profile.client_id);
        const enabledSet = new Set(enabledCodes);

        setResults(Object.fromEntries(
          featureCodes.map(code => [code, enabledSet.has(code)])
        ));
      } catch (err) {
        console.error('Erro ao verificar features:', err);
        setError('Erro ao verificar permissões');
        setResults(Object.fromEntries(featureCodes.map(code => [code, false])));
      } finally {
        setLoading(false);
      }
    }

    if (featureCodes.length > 0) {
      checkFeatures();
    }
  }, [featureCodes.join(',')]);

  return { results, loading, error };
}

/**
 * Hook para admin: buscar features de um cliente específico
 */
export function useClientFeatures(clientId: string | null): UseFeaturesResult {
  const [features, setFeatures] = useState<FeatureStatus[]>([]);
  const [enabledCodes, setEnabledCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    if (!clientId) {
      setFeatures([]);
      setEnabledCodes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const clientFeatures = await getClientFeatures(clientId);
      setFeatures(clientFeatures);

      const codes = await getEnabledFeatureCodes(clientId);
      setEnabledCodes(codes);
    } catch (err) {
      console.error('Erro ao buscar features do cliente:', err);
      setError('Erro ao carregar funcionalidades');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return { features, enabledCodes, loading, error, refetch: fetchFeatures };
}

export default useFeature;

