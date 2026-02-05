/**
 * Valle 360 - Sistema de Feature Flags
 * Controle de funcionalidades por cliente/contrato
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TIPOS
// =====================================================

export interface Feature {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  description: string | null;
  base_price: number | null;
  is_active: boolean;
  features?: Feature[];
}

export interface ClientFeature {
  id: string;
  client_id: string;
  feature_id: string;
  feature?: Feature;
  is_enabled: boolean;
  enabled_by: 'contract' | 'manual' | 'request';
  enabled_by_user_id: string | null;
  enabled_at: string | null;
  expires_at: string | null;
  notes: string | null;
}

export interface FeatureRequest {
  id: string;
  client_id: string;
  feature_id: string;
  feature?: Feature;
  requested_by_user_id: string;
  requested_by_name: string | null;
  justification: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export interface FeatureLog {
  id: string;
  client_id: string;
  feature_id: string | null;
  feature_code: string | null;
  action: string;
  changed_by_user_id: string | null;
  changed_by_name: string | null;
  reason: string | null;
  created_at: string;
}

// =====================================================
// FUNÇÕES DE CONSULTA
// =====================================================

/**
 * Verifica se cliente tem acesso a uma feature específica
 */
export async function hasFeature(clientId: string, featureCode: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('client_has_feature', {
        p_client_id: clientId,
        p_feature_code: featureCode
      });
    
    if (error) {
      console.error('Erro ao verificar feature:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Erro ao verificar feature:', error);
    return false;
  }
}

/**
 * Lista todas as features disponíveis
 */
export async function getAllFeatures(): Promise<Feature[]> {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) {
    console.error('Erro ao buscar features:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Lista features de um cliente com status
 */
export async function getClientFeatures(clientId: string): Promise<{
  feature: Feature;
  status: 'enabled' | 'disabled' | 'pending';
  enabled_by?: string;
  enabled_at?: string;
  expires_at?: string;
}[]> {
  // Buscar todas as features
  const { data: features, error: featuresError } = await supabase
    .from('features')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  
  if (featuresError || !features) {
    console.error('Erro ao buscar features:', featuresError);
    return [];
  }
  
  // Buscar features do cliente
  const { data: clientFeatures, error: clientError } = await supabase
    .from('client_features')
    .select('*')
    .eq('client_id', clientId);
  
  if (clientError) {
    console.error('Erro ao buscar features do cliente:', clientError);
  }
  
  // Buscar solicitações pendentes
  const { data: pendingRequests, error: requestsError } = await supabase
    .from('feature_requests')
    .select('feature_id')
    .eq('client_id', clientId)
    .eq('status', 'pending');
  
  if (requestsError) {
    console.error('Erro ao buscar solicitações:', requestsError);
  }
  
  const clientFeatureMap = new Map(
    (clientFeatures || []).map(cf => [cf.feature_id, cf])
  );
  const pendingFeatureIds = new Set(
    (pendingRequests || []).map(r => r.feature_id)
  );
  
  return features.map(feature => {
    const clientFeature = clientFeatureMap.get(feature.id);
    const isPending = pendingFeatureIds.has(feature.id);
    
    let status: 'enabled' | 'disabled' | 'pending' = 'disabled';
    if (clientFeature?.is_enabled) {
      // Verificar se não expirou
      if (!clientFeature.expires_at || new Date(clientFeature.expires_at) > new Date()) {
        status = 'enabled';
      }
    } else if (isPending) {
      status = 'pending';
    }
    
    return {
      feature,
      status,
      enabled_by: clientFeature?.enabled_by,
      enabled_at: clientFeature?.enabled_at || undefined,
      expires_at: clientFeature?.expires_at || undefined
    };
  });
}

/**
 * Lista códigos das features habilitadas para um cliente
 */
export async function getEnabledFeatureCodes(clientId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('client_features')
    .select(`
      is_enabled,
      expires_at,
      features!inner(code, is_active)
    `)
    .eq('client_id', clientId)
    .eq('is_enabled', true);
  
  if (error || !data) {
    console.error('Erro ao buscar features habilitadas:', error);
    return [];
  }
  
  const now = new Date();
  return data
    .filter(cf => {
      const feature = cf.features as any;
      const notExpired = !cf.expires_at || new Date(cf.expires_at) > now;
      return feature?.is_active && notExpired;
    })
    .map(cf => (cf.features as any).code);
}

// =====================================================
// FUNÇÕES DE GERENCIAMENTO (ADMIN)
// =====================================================

/**
 * Ativa/desativa feature para um cliente manualmente
 */
export async function toggleFeature(
  clientId: string,
  featureCode: string,
  enable: boolean,
  userId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar feature ID
    const { data: feature, error: featureError } = await supabase
      .from('features')
      .select('id')
      .eq('code', featureCode)
      .single();
    
    if (featureError || !feature) {
      return { success: false, error: 'Feature não encontrada' };
    }
    
    // Inserir ou atualizar
    const { error: upsertError } = await supabase
      .from('client_features')
      .upsert({
        client_id: clientId,
        feature_id: feature.id,
        is_enabled: enable,
        enabled_by: 'manual',
        enabled_by_user_id: userId,
        enabled_at: enable ? new Date().toISOString() : null,
        notes
      }, {
        onConflict: 'client_id,feature_id'
      });
    
    if (upsertError) {
      return { success: false, error: upsertError.message };
    }
    
    // Registrar log
    await supabase.from('feature_logs').insert({
      client_id: clientId,
      feature_id: feature.id,
      feature_code: featureCode,
      action: enable ? 'enabled' : 'disabled',
      changed_by_user_id: userId,
      reason: notes || 'Alteração manual'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao toggle feature:', error);
    return { success: false, error: 'Erro interno' };
  }
}

/**
 * Sincroniza features baseado nos serviços do contrato
 */
export async function syncFeaturesFromContract(
  clientId: string,
  serviceCodes: string[]
): Promise<{ success: boolean; enabledCount: number; error?: string }> {
  try {
    const { error } = await supabase.rpc('sync_client_features_from_contract', {
      p_client_id: clientId,
      p_service_codes: serviceCodes
    });
    
    if (error) {
      return { success: false, enabledCount: 0, error: error.message };
    }
    
    // Contar features habilitadas
    const { count } = await supabase
      .from('client_features')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('is_enabled', true);
    
    return { success: true, enabledCount: count || 0 };
  } catch (error) {
    console.error('Erro ao sincronizar features:', error);
    return { success: false, enabledCount: 0, error: 'Erro interno' };
  }
}

// =====================================================
// FUNÇÕES DE SOLICITAÇÕES
// =====================================================

/**
 * Cria solicitação de feature (Comercial)
 */
export async function createFeatureRequest(
  clientId: string,
  featureCode: string,
  userId: string,
  userName: string,
  justification: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar feature ID
    const { data: feature, error: featureError } = await supabase
      .from('features')
      .select('id')
      .eq('code', featureCode)
      .single();
    
    if (featureError || !feature) {
      return { success: false, error: 'Feature não encontrada' };
    }
    
    // Verificar se já existe solicitação pendente
    const { data: existing } = await supabase
      .from('feature_requests')
      .select('id')
      .eq('client_id', clientId)
      .eq('feature_id', feature.id)
      .eq('status', 'pending')
      .single();
    
    if (existing) {
      return { success: false, error: 'Já existe uma solicitação pendente para esta feature' };
    }
    
    // Criar solicitação
    const { error: insertError } = await supabase
      .from('feature_requests')
      .insert({
        client_id: clientId,
        feature_id: feature.id,
        requested_by_user_id: userId,
        requested_by_name: userName,
        justification
      });
    
    if (insertError) {
      return { success: false, error: insertError.message };
    }
    
    // Registrar log
    await supabase.from('feature_logs').insert({
      client_id: clientId,
      feature_id: feature.id,
      feature_code: featureCode,
      action: 'request_created',
      changed_by_user_id: userId,
      changed_by_name: userName,
      reason: justification
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar solicitação:', error);
    return { success: false, error: 'Erro interno' };
  }
}

/**
 * Lista solicitações pendentes (Admin)
 */
export async function getPendingRequests(): Promise<FeatureRequest[]> {
  const { data, error } = await supabase
    .from('feature_requests')
    .select(`
      *,
      feature:features(*)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar solicitações:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Aprova solicitação de feature (Super Admin)
 */
export async function approveFeatureRequest(
  requestId: string,
  adminUserId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar solicitação
    const { data: request, error: requestError } = await supabase
      .from('feature_requests')
      .select('client_id, feature_id')
      .eq('id', requestId)
      .single();
    
    if (requestError || !request) {
      return { success: false, error: 'Solicitação não encontrada' };
    }
    
    // Atualizar solicitação
    const { error: updateError } = await supabase
      .from('feature_requests')
      .update({
        status: 'approved',
        reviewed_by_user_id: adminUserId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes
      })
      .eq('id', requestId);
    
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    
    // Habilitar feature para o cliente
    const { error: enableError } = await supabase
      .from('client_features')
      .upsert({
        client_id: request.client_id,
        feature_id: request.feature_id,
        is_enabled: true,
        enabled_by: 'request',
        enabled_by_user_id: adminUserId,
        enabled_at: new Date().toISOString(),
        notes: `Aprovado via solicitação. ${notes || ''}`
      }, {
        onConflict: 'client_id,feature_id'
      });
    
    if (enableError) {
      return { success: false, error: enableError.message };
    }
    
    // Registrar log
    await supabase.from('feature_logs').insert({
      client_id: request.client_id,
      feature_id: request.feature_id,
      action: 'request_approved',
      changed_by_user_id: adminUserId,
      reason: notes || 'Solicitação aprovada'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao aprovar solicitação:', error);
    return { success: false, error: 'Erro interno' };
  }
}

/**
 * Rejeita solicitação de feature (Super Admin)
 */
export async function rejectFeatureRequest(
  requestId: string,
  adminUserId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar solicitação
    const { data: request, error: requestError } = await supabase
      .from('feature_requests')
      .select('client_id, feature_id')
      .eq('id', requestId)
      .single();
    
    if (requestError || !request) {
      return { success: false, error: 'Solicitação não encontrada' };
    }
    
    // Atualizar solicitação
    const { error: updateError } = await supabase
      .from('feature_requests')
      .update({
        status: 'rejected',
        reviewed_by_user_id: adminUserId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes
      })
      .eq('id', requestId);
    
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    
    // Registrar log
    await supabase.from('feature_logs').insert({
      client_id: request.client_id,
      feature_id: request.feature_id,
      action: 'request_rejected',
      changed_by_user_id: adminUserId,
      reason: notes
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao rejeitar solicitação:', error);
    return { success: false, error: 'Erro interno' };
  }
}

// =====================================================
// FUNÇÕES DE SERVIÇOS
// =====================================================

/**
 * Lista todos os serviços com suas features
 */
export async function getAllServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      service_features(
        feature:features(*)
      )
    `)
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) {
    console.error('Erro ao buscar serviços:', error);
    return [];
  }
  
  return (data || []).map(service => ({
    ...service,
    features: service.service_features?.map((sf: any) => sf.feature).filter(Boolean) || []
  }));
}

/**
 * Busca features que um serviço libera
 */
export async function getServiceFeatures(serviceCode: string): Promise<Feature[]> {
  const { data, error } = await supabase
    .from('service_features')
    .select(`
      feature:features(*)
    `)
    .eq('services.code', serviceCode);
  
  if (error) {
    console.error('Erro ao buscar features do serviço:', error);
    return [];
  }
  
  return (data || []).map((sf: any) => sf.feature).filter(Boolean);
}

// =====================================================
// FUNÇÕES DE LOGS
// =====================================================

/**
 * Busca histórico de alterações de features de um cliente
 */
export async function getFeatureLogs(
  clientId: string,
  limit: number = 50
): Promise<FeatureLog[]> {
  const { data, error } = await supabase
    .from('feature_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Erro ao buscar logs:', error);
    return [];
  }
  
  return data || [];
}

export default {
  hasFeature,
  getAllFeatures,
  getClientFeatures,
  getEnabledFeatureCodes,
  toggleFeature,
  syncFeaturesFromContract,
  createFeatureRequest,
  getPendingRequests,
  approveFeatureRequest,
  rejectFeatureRequest,
  getAllServices,
  getServiceFeatures,
  getFeatureLogs
};

