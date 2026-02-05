/**
 * Análise silenciosa de sentimento em mensagens
 * Chamada de forma assíncrona (fire-and-forget) após envio de mensagens
 */

export interface SilentAnalysisParams {
  messageId: string;
  content: string;
  senderId: string;
  senderType: 'client' | 'collaborator' | 'admin' | 'super_admin';
  conversationType: 'group' | 'direct_team' | 'direct_client';
  groupId?: string;
  clientId?: string;
  conversationName?: string;
}

/**
 * Envia mensagem para análise de sentimento em background
 * Fire-and-forget: não bloqueia a UI e não espera resposta
 */
export function triggerSilentAnalysis(params: SilentAnalysisParams): void {
  // Ignorar mensagens muito curtas
  if (!params.content || params.content.trim().length < 10) {
    return;
  }

  // Chamada assíncrona que não bloqueia
  fetch('/api/ai/analyze-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).catch((error) => {
    // Silenciar erros - análise não é crítica
    console.debug('[SilentAnalysis] Erro (ignorado):', error);
  });
}

/**
 * Determina o tipo de sender baseado no user_type
 */
export function getSenderType(userType: string | null | undefined): SilentAnalysisParams['senderType'] {
  const type = String(userType || '').toLowerCase();
  
  if (type === 'super_admin') return 'super_admin';
  if (type === 'admin') return 'admin';
  if (type === 'client') return 'client';
  return 'collaborator';
}

/**
 * Determina o tipo de conversa
 */
export function getConversationType(
  isGroup: boolean,
  isClientConversation: boolean
): SilentAnalysisParams['conversationType'] {
  if (isGroup) return 'group';
  if (isClientConversation) return 'direct_client';
  return 'direct_team';
}
